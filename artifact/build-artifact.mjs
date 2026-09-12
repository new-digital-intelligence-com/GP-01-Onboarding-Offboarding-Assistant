/**
 * Bundles the skill into a single self-contained artifact page.
 *
 * Same doctrine as app/scripts/embed-skill.mjs: the skill in plugins/ is the only
 * implementation, and every surface embeds a COPY of it at build time rather than
 * re-implementing a provisioning step. Nothing in src/console.html knows what a
 * BambooHR table row is — it hands the skill text to Claude and forwards tool calls.
 *
 * Output is git-ignored. Never edit dist/ — edit src/console.html or the skill.
 *
 *   node artifact/build-artifact.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const skillDir = join(
  here,
  "..",
  "plugins",
  "gp-01-onboarding-offboarding",
  "skills",
  "gp-01-onboarding-offboarding",
);
const srcFile = join(here, "src", "console.html");
const manifestFile = join(here, "mcp-manifest.json");
const outFile = join(here, "dist", "gp-01-console.html");

/** Order matters: SKILL.md first, then the files it tells the model to read. */
const FILES = [
  "SKILL.md",
  "references/connector-map.md",
  "references/approval-gates.md",
  "references/register-schema.md",
  "assets/welcome-email-template.md",
  "assets/completion-report-template.md",
];

/**
 * `sample()` caps `input` at 65536 UTF-8 bytes and rejects the whole call past it.
 * The skill is the bulk of that budget, so the overflow has to surface here, at
 * build time, and not as a failed run in front of somebody's first day.
 */
const SAMPLE_MAX_PROMPT_BYTES = 65536;
const FRAMING_ALLOWANCE = 6000;

const skill = {};
for (const rel of FILES) {
  try {
    skill[rel] = readFileSync(join(skillDir, rel), "utf8");
  } catch {
    console.warn(`[build-artifact] missing, skipped: ${rel}`);
  }
}

if (!skill["SKILL.md"]) {
  console.error(
    `[build-artifact] SKILL.md not found under ${skillDir}\n` +
      `  This script must run from the repo root, not from artifact/.`,
  );
  process.exit(1);
}

const skillBytes = Object.values(skill).reduce(
  (n, s) => n + Buffer.byteLength(s, "utf8"),
  0,
);
const budget = SAMPLE_MAX_PROMPT_BYTES - FRAMING_ALLOWANCE;
if (skillBytes > budget) {
  console.error(
    `[build-artifact] the skill is ${skillBytes} bytes; sample() allows ${SAMPLE_MAX_PROMPT_BYTES}\n` +
      `  and the run framing needs about ${FRAMING_ALLOWANCE}, leaving ${budget}.\n` +
      `  Trim the skill or drop a reference file from FILES before publishing.`,
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
if (!Array.isArray(manifest.servers) || !manifest.servers.length) {
  console.error(`[build-artifact] mcp-manifest.json needs a "servers" array.`);
  process.exit(1);
}

/**
 * A server with no tool list cannot be published: an empty `tools` array is refused,
 * and never means "all tools". Rather than block the build, an unconfigured system is
 * dropped from the manifest and the skill stages its steps with a named owner — the
 * same distinction approval-gates.md draws between "failed" and "staged".
 */
const enabled = [];
const staged = [];
for (const s of manifest.servers) {
  if (!s.server) {
    console.error(`[build-artifact] every entry in "servers" needs a "server" display name.`);
    process.exit(1);
  }
  const tools = Array.isArray(s.tools) ? s.tools.filter(Boolean) : [];
  if (s.enabled === false || !tools.length) {
    staged.push({ server: s.server, systems: s.systems || [], purpose: s.purpose || "", reason: tools.length ? "turned off in mcp-manifest.json" : "no tool names yet" });
  } else {
    enabled.push({ server: s.server, systems: s.systems || [], purpose: s.purpose || "", verified: s.verified === true, tools });
  }
}

if (!enabled.length) {
  console.error(
    `[build-artifact] every server is disabled or has no tools — the page could reach nothing.\n` +
      `  Fill in at least one server's "tools" in mcp-manifest.json.`,
  );
  process.exit(1);
}

/** `</script>` inside embedded JSON would close the tag early. */
const embed = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

/**
 * The published artifact carries a BUILD-TIME COPY of the skill. The plugin updates itself
 * on commit SHA; the artifact does not update at all until somebody rebuilds and
 * republishes it. So the page shows the hash of the skill it was built from: run the build
 * again and compare, and a mismatch means the published page is running an old skill.
 */
const skillHash = createHash("sha256")
  .update(FILES.map((rel) => rel + "\0" + (skill[rel] ?? "")).join("\0"))
  .digest("hex")
  .slice(0, 8);

const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + "Z · skill " + skillHash;

const page = readFileSync(srcFile, "utf8")
  .replace('"__SKILL_FILES__"', embed(skill))
  .replace(
    '"__MCP_MANIFEST__"',
    embed({
      servers: enabled,
      staged,
      /* Drives the history empty state, which otherwise cannot tell "no runs yet"
         apart from "your access level returned nothing". */
      historyRestricted: Array.isArray(manifest.dbRules) && manifest.dbRules.length > 0,
    }),
  )
  .replace('"__BUILD_STAMP__"', embed(stamp));

for (const token of ["__SKILL_FILES__", "__MCP_MANIFEST__", "__BUILD_STAMP__"]) {
  if (page.includes(token)) {
    console.error(`[build-artifact] placeholder ${token} was not substituted — check src/console.html`);
    process.exit(1);
  }
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, page, "utf8");

const unverified = enabled.filter((s) => !s.verified).map((s) => s.server);

console.log(
  `[build-artifact] dist/gp-01-console.html\n` +
    `  skill: ${Object.keys(skill).length} files, ${skillBytes} bytes (budget ${budget})\n` +
    `  page:  ${Buffer.byteLength(page, "utf8")} bytes\n` +
    enabled.map((s) => `  live   ${s.server} — ${s.tools.length} tools (${s.systems.join(", ")})`).join("\n") +
    (staged.length ? "\n" + staged.map((s) => `  staged ${s.server} — ${s.reason} (${s.systems.join(", ")})`).join("\n") : ""),
);

if (staged.length) {
  console.log(
    `\n[build-artifact] ${staged.length} system(s) will be reported as STAGED at run time.\n` +
      `  Give them real tool names and set "enabled": true in mcp-manifest.json to go live.`,
  );
}
if (unverified.length) {
  console.log(
    `\n[build-artifact] WARNING: tool names for ${unverified.join(", ")} were never confirmed\n` +
      `  against a live listTools(). The page's preflight panel shows which ones resolve —\n` +
      `  check it before the first real run, and set "verified": true once you have.`,
  );
}

/**
 * Printed whole so the publish step is a copy-paste, not four things to remember.
 * db rules in particular are easy to leave off, and leaving them off silently makes
 * the run history — employee names, terminations — readable by every viewer.
 */
const capabilities = {
  mcp: { servers: enabled.map((s) => ({ server: s.server, tools: s.tools })) },
  sample: {},
  db: Array.isArray(manifest.dbRules) && manifest.dbRules.length
    ? { rules: manifest.dbRules }
    : {},
  downloads: true,
};

console.log(
  `\n[build-artifact] capabilities for the Artifact tool — pass this whole object:\n` +
    JSON.stringify(capabilities, null, 2).split("\n").map((l) => "  " + l).join("\n"),
);

/* An empty `dbRules` is a decision; a missing one is an oversight. Only nag about the second. */
if (!Array.isArray(manifest.dbRules)) {
  console.log(
    `\n[build-artifact] WARNING: no dbRules key — the run history (employee names,\n` +
      `  terminations) will be readable by everyone the artifact is shared with.\n` +
      `  Set "dbRules": [] to say that is deliberate, or add rules to restrict it.`,
  );
} else if (!manifest.dbRules.length) {
  console.log(`\n[build-artifact] db is unrestricted — anyone the artifact is shared with reads the run history.`);
}
