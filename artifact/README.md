# GP-01 as a Claude Artifact

A published Claude Artifact that runs GP-01 with no web app, no deployment and no login to
build. It is a third surface on the same skill — chat, the Next.js console, and this — and
like the console it **contains no provisioning logic**. It hands the skill to Claude and
forwards tool calls to the viewer's Zapier connector.

```
plugins/…/SKILL.md ──┬─→ Claude chat / Claude Code   (the plugin)
                     ├─→ app/  console               (embed-skill.mjs → skill.generated.ts)
                     └─→ artifact/  this page        (build-artifact.mjs → dist/…html)
```

If the page behaves wrongly, fix `SKILL.md`. Nothing here knows what a BambooHR table row
is, and nothing here should ever learn.

## Build

```bash
node artifact/build-artifact.mjs     # → artifact/dist/gp-01-console.html
```

The build inlines the skill and the connector manifest into one self-contained file, and
fails rather than producing a broken page if the skill has outgrown `sample()`'s
65,536-byte prompt cap. Current headroom:

| | bytes |
|---|---|
| SKILL.md + 5 reference files | 45,624 |
| Framing allowance | 6,000 |
| Cap | 65,536 |

`dist/` is git-ignored. Never edit it.

## How the run actually works

There is no server. The published page:

1. `claude.use("mcp")` — calls the **viewer's** Zapier connector. The page holds no URL and
   no token; it can only name a connector, and the shell attaches the credentials.
2. `claude.use("sample")` — asks Claude, passing the skill as the prompt and five page
   functions as tools. The **viewer pays** for this from their own Claude usage.
3. `claude.use("db")` — remembers completed runs so a repeat is flagged at the Review step.
4. `claude.use("downloads")` — offers the completion report and register rows as files.

The five tools Claude is given:

| Tool | What it does |
|---|---|
| `zapier_list_tools` | The exact reachable tool names, so Claude never guesses one |
| `zapier_call` | `{tool, input}` → `mcp.callTool`. The only way into any system |
| `log_event` | Renders one `STEP` / `DONE` / `FAIL` / `STAGED` / `ASSUME` row |
| `new_password` | One `crypto.getRandomValues` 18-character password |
| `finish_run` | Counts, ChangeRef, completion report, register rows |

`zapier_call` is a **passthrough**. It validates the tool name against the manifest and
forwards the arguments object untouched, so no Zapier argument shape is encoded in this
page — the skill text is where Claude learns the raw Directory API and BambooHR table
calls, exactly as in chat.

This also replaces the console's most fragile part. `app/` parses `STEP`/`DONE` prefixes out
of a text stream and needs a lookahead regex because Claude glues tags together
(`ProvisioningWizard.tsx`, `TAG_BOUNDARY`). Here the log is driven by tool calls, which
cannot be mis-split. Claude's prose still streams into the "Claude's narration" panel.

## Before you publish: the two things that are not optional

### 1. The publishing account needs the Zapier connector

The page names a connector; it cannot supply one. In the account that will publish it, and
in **every account that will open it**, the Zapier MCP endpoint must exist under
claude.ai → Settings → Connectors with a display name matching `server` in
`mcp-manifest.json` (`Zapier` by default).

If your workspace admin can add it as an **organisation-level connector**, everyone's
`"Zapier"` resolves to the same Zapier account and the run stays identical whoever triggers
it — which is the property `references/connector-map.md` chose Zapier for in the first
place. If they cannot, each person adds it by hand and you lose that property; read
`connector-map.md` before accepting that trade.

### 2. Filling in the tool list

`mcp-manifest.json` carries an explicit tool allowlist. There is no wildcard, an empty list
is refused at publish time, and a name that is wrong fails at runtime with
`not_in_manifest`.

**The names currently in that file are transcribed from `connector-map.md` and `SKILL.md`.
They record live testing against the NDI tenant, but they have not been checked against a
live `listTools()` call.** Verify them before you publish:

- In a Claude Code session on the publishing account, the connector's tools appear in the
  tool list as `mcp__<connector>__<toolName>`, or
- ```bash
  curl -H 'anthropic-version: 2023-06-01' \
       -H 'anthropic-beta: mcp-servers-2025-12-04' \
       -H "Authorization: Bearer $CLAUDE_CODE_OAUTH_TOKEN" \
       'https://api.anthropic.com/v1/mcp_servers?limit=1000'
  ```

Put the exact upstream names into `mcp-manifest.json`, rebuild, and publish. The page's
preflight panel then shows each declared name as reachable (green) or missing
(struck through) — that panel is how you confirm you got it right, and it is the first
thing on the page for that reason.

## Publish

From the account that will own it:

```js
Artifact({
  file_path: "artifact/dist/gp-01-console.html",
  favicon: "🔐",
  description: "Runs NDI's GP-01 joiner and leaver provisioning against Google Workspace, BambooHR and Slack.",
  capabilities: {
    mcp: { servers: [{ server: "Zapier", tools: [ /* exactly the list in mcp-manifest.json */ ] }] },
    sample: {},
    db: {},
    downloads: true
  }
})
```

The file is authored for the Artifact tool, which supplies the `<!doctype>`, `<html>`,
`<head>` and `<body>` wrapper — that is why the file starts at `<title>`. Do not add them.

Redeploying: same `file_path` in the same session, or pass the artifact's `url`. Keep the
favicon stable; omit it on a redeploy.

## What this changes about access

Declaring `mcp` makes the page **organisation-internal** — it cannot be shared publicly, and
each viewer consents to the connector on first use. That replaces the Vercel Deployment
Protection requirement in `CLAUDE.md`, which existed because the console had no login.

It does **not** make provisioning safe by itself. Everyone in the organisation who can open
the artifact and has the Zapier connector can create and suspend Google Workspace accounts
from it. "Organisation-internal" is not the same as "authorised to provision employees" —
if that distinction matters at NDI, it has to be handled by who the connector is given to.

## Still true here

- **No dry-run.** Every run executes. The Review step is the only checkpoint, which is why
  it states each system and each action in full before the button.
- **Repeat runs.** Pass 2 of the joiner workflow is a legitimate re-run, so a prior
  completed run is a warning, not a block. The warning says plainly that a repeated
  BambooHR table write adds a duplicate row.
- **Ambiguous writes.** `server_unavailable` and `upstream_error` on a write are not proof
  the call did not run. The prompt tells Claude to read back rather than blind-retry, and
  the page never auto-retries a `zapier_call`.
- **Tab close ends the run.** There is no server-side continuation. Steps already reported
  `DONE` did happen; nothing after that point ran. The run record in `db` is marked
  `incomplete` so the next Review step shows it.

## Not verified in this repo

The page was written against runtime contract 0.2.46 and the `window.claude` type
definitions, but **no live Zapier call was observed while building it** — no Zapier
connector was connected in the authoring session. Two things therefore need a real run
before you trust the page in front of a new hire:

1. The tool names in `mcp-manifest.json` (see above).
2. That a `zapier_call` payload comes back in the shape the skill expects. `zapier_call`
   returns `result.payload` and falls back to `result.content`; if your connector returns
   something else, that is the one line to adjust.

Do the first joiner run on a test person.
