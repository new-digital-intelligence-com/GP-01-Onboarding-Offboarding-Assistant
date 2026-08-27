# GP-01 — agent brief

## The architecture rule that matters most

**`plugins/gp-01-onboarding-offboarding/skills/gp-01-onboarding-offboarding/SKILL.md` is the only implementation.** The console in `app/` does not
perform provisioning; it calls the Claude API with the skill as the system prompt and the
same MCP connectors the skill uses in chat.

Never add a Google, BambooHR or Slack client to `app/`. The moment a provisioning
step exists in TypeScript as well as in the skill, GP-01 exists twice and the copies drift —
every fix has to be made in both, and the app quietly becomes the worse one. If the console
behaves wrongly, fix SKILL.md.

## Why the layout looks like this

The skill sits **inside the plugin**, not in a top-level `skill/` folder. Claude's plugin
loader blocks path traversal outside the plugin root: a `skills` entry of `../skill` is
copied nowhere on install and silently fails. Skills must be physically at
`<plugin>/skills/<name>/SKILL.md`.

This repo is **both a marketplace and a plugin**:

| Path | Role |
|---|---|
| `.claude-plugin/marketplace.json` | Marketplace — what users add |
| `plugins/gp-01-onboarding-offboarding/` | The plugin itself |
| `plugins/…/.claude-plugin/plugin.json` | Plugin manifest |
| `plugins/…/skills/gp-01-onboarding-offboarding/` | **The skill — source of truth** |

## Do not add a `version` to plugin.json

Deliberate. For a git-sourced plugin, Claude updates on **commit SHA** when no `version` is
set, and **only when the version string changes** when one is. Adding a version means every
skill edit also needs a version bump, and a forgotten bump means the fix never reaches
anyone — silently. SHA tracking makes every push propagate.

If NDI later wants pinned releases, add `version` **and** a release checklist that bumps it.
Do not add it without one.

## What the app is allowed to own

- The form, the streamed run view, the summary.
- Prompt framing: parameterised mode, and the `STEP`/`DONE`/`FAIL`/`STAGED`/`ASSUME`/
  `SUMMARY` line prefixes the console parses. Nothing else about the run.

There is **no dry-run mode**. It was removed deliberately on request: every run executes for
real. The Review step is the only checkpoint, so it must keep stating plainly what the run
will do. If a preview mode is ever wanted back, it belongs as a prompt preamble instructing
Claude to skip writes — never as TypeScript that skips calls.

`scripts/embed-skill.mjs` copies the skill into `src/lib/skill.generated.ts` on every
`dev` and `build`; `skill.ts` reshapes it into the system prompt. Build-time, not `fs` at
runtime — the skill lives **outside `app/`**, so it is not in the deployed function bundle
and an `fs` read works in `next dev` and fails once deployed. The generated file is
git-ignored; never edit it.

**The build needs the repo root, not just `app/`.** `embed-skill.mjs` reads
`../../plugins/...`. On Vercel, if Root Directory is `app`, *Include source files outside of
the Root Directory* must be on, or `prebuild` fails on a missing `SKILL.md`.

## Platform facts — verified, do not re-derive

`references/connector-map.md` in the skill holds the full record. Short version:

- **Google:** create users via the raw Directory API — Zapier's `create_user` returns 403
  regardless of permissions. Profile fields need a second `PUT`. Suspend, never delete.
  Session revocation, mailbox delegation and Drive transfer need scopes nobody has.
- **BambooHR:** job title, department, supervisor and employment status are effective-dated
  **table rows**, not plain fields. A blank top-level `jobTitle` on a future-dated joiner is
  correct, not a failure.
- **Slack:** a new person cannot be added by API (`not_allowed_token_type`), and domain
  sign-up is off on `new-digital-int`, so IT Operations invites by hand. Adding an existing
  member to a channel works; so does removing one, but only in channels the acting Slack
  identity has joined. Account deactivation is not reachable at all.


## Deployment prerequisite — authentication

The console has no login. It creates and suspends Google Workspace accounts, so it must sit
behind **Vercel Deployment Protection** (Vercel Authentication), confirmed to cover the
**production** domain and not only preview URLs, before it is deployed at all
— there is no dry-run mode to fall back on, so any reachable deployment is a live one. Do not
add a hand-rolled password or a client-side check instead: the API
route is the thing that must be protected, and anything enforced in the browser is not.
