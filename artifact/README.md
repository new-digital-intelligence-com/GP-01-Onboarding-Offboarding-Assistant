# GP-01 as a Claude Artifact

A published Claude Artifact that runs GP-01 with no web app, no deployment and no login to
build. It is the second surface on the same skill — Claude chat is the other — and like the
skill itself it **contains no provisioning logic**. It hands the skill to Claude and
forwards tool calls to the viewer's Zapier connector.

```
plugins/…/SKILL.md ──┬─→ Claude chat / Claude Code   (the plugin)
                     └─→ artifact/  this page        (build-artifact.mjs → dist/…html)

                        app/ is a retired Next.js console, no longer maintained.
```

If the page behaves wrongly, fix `SKILL.md`. Nothing here knows what a Directory API
payload looks like, and nothing here should ever learn.

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

## The artifact does not auto-update — the plugin does

This is the one thing that will bite you. They are distributed completely differently:

| | Plugin | Artifact |
|---|---|---|
| How people get it | Each person installs it from the marketplace | One link, published once |
| Ships with `artifact/`? | **No** — the plugin is only `plugins/…/`, so `artifact/` never travels with it. That is fine: nobody installs the artifact. |
| On a skill edit | Updates itself on the next commit SHA (no `version` in plugin.json — deliberate) | **Nothing happens.** It keeps the copy it was built with |

So **after every change to `SKILL.md` or a reference file:**

```bash
node artifact/build-artifact.mjs     # then republish to the SAME artifact url
```

Otherwise chat runs the new skill and the artifact runs the old one, and the two disagree
without saying so.

To check a live page: the build prints a skill hash (`skill 1a2b3c4d`) and the page shows
the same hash in its top-right corner. Run the build and compare. Different hash = the
published page is stale.

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
| `list_systems` | Every reachable connector, what it carries, and its exact tool names |
| `call_system` | `{connector, tool, input}` → `mcp.callTool`. The only way into any system |
| `log_event` | Renders one `STEP` / `DONE` / `FAIL` / `STAGED` / `ASSUME` row |
| `new_password` | One `crypto.getRandomValues` 18-character password |
| `finish_run` | Counts, ChangeRef, completion report, register rows |

`call_system` is a **passthrough**. It validates connector and tool against the manifest and
forwards the arguments object untouched, so no Zapier argument shape is encoded in this
page — the skill text is where Claude learns the raw Directory API calls, exactly as in chat.

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
  description: "Runs NDI's GP-01 joiner and leaver provisioning against Google Workspace, Gmail, Slack and the provisioning register.",
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
  run appends a duplicate set of register rows.
- **Ambiguous writes.** `server_unavailable` and `upstream_error` on a write are not proof
  the call did not run. The prompt tells Claude to read back rather than blind-retry, and
  the page never auto-retries a `call_system`.
- **Tab close ends the run.** There is no server-side continuation. Steps already reported
  `DONE` did happen; nothing after that point ran. The run record in `db` is marked
  `incomplete` so the next Review step shows it.

## Not verified in this repo

The page was written against runtime contract 0.2.46 and the `window.claude` type
definitions, but **no live Zapier call was observed while building it** — no Zapier
connector was connected in the authoring session. Two things therefore need a real run
before you trust the page in front of a new hire:

1. The tool names in `mcp-manifest.json` (see above).
2. That a `call_system` payload comes back in the shape the skill expects. `call_system`
   returns `result.payload` and falls back to `result.content`; if your connector returns
   something else, that is the one line to adjust.

Do the first joiner run on a test person.
