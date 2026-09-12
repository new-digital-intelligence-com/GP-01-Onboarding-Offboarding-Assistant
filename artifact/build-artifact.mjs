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

const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + "Z";

const page = readFileSync(srcFile, "utf8")
  .replace('"__SKILL_FILES__"', embed(skill))
  .replace('"__MCP_MANIFEST__"', embed({ servers: enabled, staged }))
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

console.log(
  `\n[build-artifact] capabilities.mcp for the Artifact tool:\n` +
    JSON.stringify({ servers: enabled.map((s) => ({ server: s.server, tools: s.tools })) }, null, 2)
      .split("\n").map((l) => "  " + l).join("\n"),
);
