# GP-01 — Onboarding & Offboarding Assistant

NDI's GP-01 AI Employee, published as a Claude plugin. For a joiner it creates the BambooHR
record and the Google Workspace account, sends the sign-in and welcome emails, posts the
Slack welcome. For a leaver it suspends access,
arranges handover and reports honestly on what could not be automated.

```
/gp-01-onboarding-offboarding Mohamed Salah, AI Engineer, manager Helmi Lakhder, start 5 September 2026
/gp-01-onboarding-offboarding mohamed.salah@new-digital-intelligence.com     ← offboards
```

A bare `@new-digital-intelligence.com` address offboards; a name plus a role onboards.

## Install

This repo is a plugin marketplace. Once, per person:

```
/plugin marketplace add new-digital-intelligence-com/GP-01-Onboarding-Offboarding-Assistant
/plugin install gp-01-onboarding-offboarding@ndi-ai-employees
```

In Cowork: **Customize → Plugins → Add marketplace**, then install from it.

### Turn auto-update on — it is off by default

Auto-update is enabled by default only for Anthropic's own marketplaces. For a third-party
one like this it is **off until someone turns it on**, per marketplace, in the
`/plugin marketplace` UI (or `"autoUpdate": true` under `extraKnownMarketplaces` in
settings). Without it, `git push` changes nothing for anyone.

When on: Claude checks once per session in the background, and the new version loads on the
next launch or after `/reload-plugins` — not mid-session. To pull an update by hand:

```
/plugin marketplace update ndi-ai-employees
```

## Layout

| Path | Holds |
|---|---|
| `.claude-plugin/marketplace.json` | Marketplace definition |
| `plugins/gp-01-onboarding-offboarding/` | The plugin |
| └ `skills/gp-01-onboarding-offboarding/` | **SKILL.md, references, assets — the implementation** |
| `Sample Input/` `Sample Output/` `Templates/` | Demo data |
| `app/` | Web console — a second front end onto the same skill |

The skill lives inside the plugin because Claude's loader blocks path traversal outside the
plugin root. A top-level `skill/` folder referenced as `../skill` installs as nothing.

## Changing the skill

Edit **one file**: `plugins/gp-01-onboarding-offboarding/skills/gp-01-onboarding-offboarding/SKILL.md`.

```bash
git commit && git push        # → everyone with auto-update on gets it next launch
cd app && npm run cf:deploy   # → console picks it up (build-time embed)
```

`plugin.json` deliberately has **no `version` field**. Git-sourced plugins update on commit
SHA when no version is set, and only on a version change when one is — so a version would
mean every edit needs a bump, and a forgotten bump silently strands the fix.

Do not upload a hand-built `.skill` to the tenant alongside the plugin. Two GP-01s and
nobody can tell which one ran.

## The console

`app/` is a Next.js app deployed on Vercel for demonstrating GP-01 to people who will not
use a chat window. It **does not re-implement the skill** — it calls the Claude API with
SKILL.md as the system prompt and the same MCP connectors, then streams the run.

```bash
cd app
npm install
cp .env.local.example .env.local   # ANTHROPIC_API_KEY + Zapier MCP endpoint
npm run dev
```

Run from local disk, not a network share. **Dry run is on by default** — every read happens
for real, no writes.

### Put authentication in front of it before deploying

**The app has no login of its own, and it creates and suspends Google Workspace accounts.**
Deployed bare, its URL is an open form on the internet that provisions identities in the
NDI tenant. Holding the Zapier endpoint server-side protects the *credential*; it does
nothing to control *who can trigger it*.

Use **Vercel Deployment Protection** (Settings → Deployment Protection → Vercel
Authentication), and confirm the policy covers the **production** domain, not just preview
URLs. Enforced before a request reaches the app, no code required — and it gives a
per-person record of who ran what, which a shared Zapier endpoint cannot.

There is **no dry-run mode** to fall back on: every run executes for real, so any reachable
deployment is a live one. Do not deploy until protection is in place and verified by loading
the production URL from a signed-out browser.

Do not rely on the URL being hard to guess. `vercel.app` hostnames are enumerable, and an
unauthenticated provisioning endpoint is a finding in any security review.

Note the API key is a separate path from a Claude seat: it carries none of your account's
skills or connectors, which is why the app ships the skill itself and needs its own MCP
endpoint with Gmail, Drive, Sheets and Slack enabled on it.

## What cannot be automated

Platform limits, established by testing. They appear in every run as staged items with named
owners, never hidden:

| Step | Why |
|---|---|
| Slack workspace membership | No API can add a new person. Domain sign-up is currently off on `new-digital-int`, so IT Operations sends the invite by hand. |
| Slack account deactivation | `users.admin.setInactive` → `not_allowed_token_type`. Channel removal works; the account stays active until IT Operations deactivates it. |
| Session revocation, mailbox delegation, Drive ownership transfer | Scopes unavailable. Suspension is what actually stops access. |
| Account deletion | Never automatic — a human decision after the retention window. |

## Acceptance criteria

Against *NDI Demos Acceptance Criteria*. Honest status — ☐ means not done, not "nearly".

| Criterion | State |
|---|---|
| Runs on the Claude Enterprise Platform | ✅ |
| Skill file in a GitHub repo, plug-in created | ✅ this repo is both marketplace and plugin |
| Plug-in set to auto-update | ⚠️ **per marketplace, by each installer** — see *Turn auto-update on* above. Nobody can force it centrally. |
| MCP connectors | ✅ one Zapier endpoint: Google Workspace Admin, BambooHR, Gmail (as People Ops), Slack, Sheets |
| Artifacts (outputs) | ✅ register rows, emails, completion report — offered as files or Drive links |
| Interface systems on demo accounts | ✅ Google Workspace, BambooHR, Gmail, Slack — all live on the NDI tenant |
| Sample Input / Sample Output / Templates | ✅ |
| Functional specification | ✅ `GP-01-functional-spec.md` |
| Upload of documents | ✅ a pasted or attached HR notification is a complete input |
| Multi-step processing | ✅ |
| Single-prompt evocation | ✅ `/gp-01-onboarding-offboarding` |
| Explains its purpose briefly | ✅ bare invocation |
| Stores settings, offers reuse-or-change | ✅ settings doc in Drive, read at the start of every run |
| Selection menus (AskUserQuestion) | ✅ bare invocation |
| Guides the user through with further selections | ✅ bare invocation |
| Creates documents for download | ✅ |
| Live demo URL for non-chat users | ⚠️ `app/` builds and runs; **not deployed yet**, and must sit behind Vercel Deployment Protection first |
| **Skill published in NDI tenant** | ☐ |
| **Skill stored in the AI Employee Drive folder** | ☐ |
| **URL of an end-to-end sample chat** | ☐ |
| **YouTube demo video** | ☐ |

The four ☐ items and the auto-update toggle are all actions only an NDI admin can take;
nothing in this repo can complete them.

## Publishing to the NDI tenant

Two distribution paths, and they must not both be live at once.

**Plugin (preferred).** Push this repo to `new-digital-intelligence-com`, then each person
runs the two `/plugin` commands above and switches auto-update on for the marketplace. Every
later `git push` reaches them on their next launch. This is the path the acceptance criteria
describe as "stored in github repository — Plug-In created and set to auto update".

**Skill upload.** Build the bundle and upload it in the tenant's skill admin:

```bash
cd plugins/gp-01-onboarding-offboarding/skills
zip -r ../../../gp-01-onboarding-offboarding.skill gp-01-onboarding-offboarding
```

An uploaded `.skill` is a **snapshot** — it does not follow the repo. Editing SKILL.md and
pushing changes nothing for anyone who installed the upload, and there is no warning. If you
upload it, put a re-upload step in the release checklist, or the tenant copy silently rots.

**Never run both.** Two GP-01s in one tenant and no one can tell which one answered a
trigger — including you, when a run misbehaves.
