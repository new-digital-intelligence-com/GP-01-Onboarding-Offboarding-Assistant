# Connector map

Which connector does which step. Everything here was established by live testing against
the NDI tenant — the failures are observations, not assumptions. Where a cause is unknown,
this file says so rather than inventing one.

## Everything runs through Zapier

**Do not use the native Gmail, Slack or Drive connectors.** They belong to
whoever is running the skill, so the same run behaves differently per person and each
person has to connect things themselves. One Zapier MCP endpoint carries the lot, so a run
is identical whoever triggers it and nobody connects anything.

| System | Zapier app | Used for |
|---|---|---|
| Google Workspace Admin | `GoogleWorkspaceAdminCLIAPI` | Create the account, set the profile, suspend on offboarding |
| Gmail | `GoogleMailV2CLIAPI` | Sign-in, welcome and farewell emails — **as `peopleops@`** |
| Slack | `SlackCLIAPI` | Welcome and farewell posts, user and channel lookups |
| Google Sheets | `GoogleSheetsV2CLIAPI` | Provisioning register |

Check connections at the start of a run with `inspect_zapier_actions`. If an app reports
no default connection, that is a setup gap — say so plainly rather than retrying.

## Zapier MCP is generic — discover, then execute

**Read this before calling anything.** Zapier no longer exposes one MCP tool per configured
action. Confirmed against the live connector on 2026-09-12, it exposes six tools GP-01 uses:

| Tool | Use |
|---|---|
| `discover_zapier_actions` | Find the action you need |
| `execute_zapier_read_action` | Run a read (lookups, `team.info`, read-backs) |
| `execute_zapier_write_action` | Run a write (create, send, post, append, suspend) |
| `inspect_zapier_actions` | Check what is configured at the start of a run |
| `list_zapier_connections` | See which connection is default |
| `manage_zapier_connections` | Fix a wrong default — see the trap below |

**Mind the infix.** The Claude UI shows them as *Discover Actions*, *Execute Read Action* and
*Execute Write Action*, but the real names carry `zapier`: `discover_zapier_actions`, not
`discover_actions`. Three names elsewhere in this file predate the change and are reachable
only as *actions*, not as tools — `gmail_send_email`, `channels_invite_v2` and
`slack_remove_user_from_channel` are things you `discover` and then `execute`, not tools you
call directly.

So the shape of every step is: discover the action once, then execute it. Never assume a
tool name for an app action — there is no such tool.

### The execute arguments — verified 2026-09-12, get these right first time

The execute tools take **`selected_api`, `action`, `instructions` and `params`**. Nothing
else. Three calls failed on argument shape in the first live run before this was established,
so use these names directly and do not improvise.

Parameter names inside `params` are the action's own, and they are not the obvious ones.
The Google Workspace Admin find-user action takes **`email_to_search_for`**, not `email`.
When a call fails on shape, `discover_zapier_actions` is what tells you the real field
names — read them, do not guess a second time.

### The raw Directory API call is still reachable

The Google Workspace Admin raw-request action is present and is called
**`Make API Mutating Request`**. Confirmed live on 2026-09-12 by enumerating the app's
actions. This is the action behind every raw call in SKILL.md — the account create, the
profile `PUT` and the suspend — so the packaged-`create_user`-returns-403 workaround still
works under the generic MCP model.

## The connection trap that has bitten this project twice

**Zapier adds a connection on each authorise; it never replaces one, and it never changes
the default.** Reconnecting an app therefore appears to do nothing: the new connection sits
alongside the old, and calls keep running against whichever was default.

This produced two silent failures here — several Slack connections where the default was
still pointing at the wrong workspace, and a Gmail connection to `peopleops@` that went
unused because the default was unset. In both cases the user had done the work correctly.

So: when an app behaves as though it was never reconnected, **check the default before
anything else** — `list_zapier_connections`, then `manage_zapier_connections` with
`default_connection_id`. Do not ask the user to authorise again.

**Live state, checked 2026-09-12.** The Gmail default connection is
`access-tools-and-subscription-manager@new-digital-intelligence.com` — **not** `peopleops@`.
A `peopleops@new-digital-intelligence.com` connection exists and is not stale:

```
029c9ca6-45dc-8070-b7ce-2b305fe8b20f
```

**Pass that connection id explicitly on every send.** Do not change the tenant-wide default
to fix this — the default belongs to the whole account and other things depend on it. An
unset or wrong connection is the failure this project has already had twice, and on an email
it is invisible: the send succeeds, from the wrong address, and only the joiner notices.

## One Slack workspace only

`new-digital-int` / `T0BG8HX3E0G` (`https://new-digital-int.slack.com`) is the NDI
workspace. It is the only one this skill touches. Several workspaces can carry the same
display name in a picker, so **never identify the workspace by name** — call `team.info`
and match the team ID. Anything other than `T0BG8HX3E0G` means the connection is wrong:
report it, do not post.

## Google Workspace: use the raw Directory API

Create and update the user with raw HTTP through Zapier's Google Workspace Admin
`_zap_raw_request`, not the packaged `create_user` action.

**What was observed** (2026-08-26, this tenant): on the same connection, minutes apart —

- packaged `create_user` → `403 Not Authorized to access this resource/api`, with both the
  full field set and a minimal name/email/password payload
- `find_user` → succeeded
- raw `POST /admin/directory/v1/users` → succeeded first try

**The cause was never established.** It is not the admin role, since the raw call works on
the same credentials; the packaged action may request something extra, or send a field the
tenant rejects. Treat the raw call as the known-good path, and **do not read a 403 from the
packaged action as evidence that the user lacks rights** — that misreading cost several
rounds of unnecessary permission changes here. If someone retests the packaged action later
and it works, update this file.

Profile fields (job title, department, manager, recovery email) do not reliably persist on
create — send them in a second `PUT`, then read the user back.

**Suspend, never delete.** Deletion is a human decision after the retention window.

## Slack: what is and is not possible

| Action | Status |
|---|---|
| Post a message | ✅ |
| Look a user up by email | ✅ |
| Add an **existing** member to a channel | ✅ `channels_invite_v2` |
| Invite a **new** person to the workspace | ❌ `users.admin.invite` and `admin.users.invite` both return `not_allowed_token_type`; no connected tool exposes an invite |
| Self-signup at the workspace link | ⚠️ **Only if `team.info.email_domain` is set.** On `new-digital-int` it is currently empty, so the signup page refuses with *"administrator has not enabled email sign-ups"*. Read `email_domain` before offering the link — do not carry the answer over from another workspace or an earlier run |
| Deactivate a member | ❌ `users.admin.setInactive` → `not_allowed_token_type`. The leaver keeps the workspace account; only channel membership can be revoked |
| Remove from a channel | ✅ `slack_remove_user_from_channel` (`userId` + `channelId`). **Only works for channels the acting Slack identity has joined** — elsewhere it fails *"neither you nor the bot are in the selected channel"*, which is a membership problem, not a token one. Add the acting identity to a channel and removal there becomes automatic |

### Why Slack is not on the native Claude connector

This was looked at properly (2026-09-12) and rejected. The claude.ai Slack connector is
Slack's own hosted MCP server (`mcp.slack.com/mcp`) and exposes 11 tools, of which exactly
one is a non-canvas write: `slack_send_message`. It has **no tool to add a member to a
channel and no tool to remove one**, so both membership writes GP-01 depends on — joiner
pass 2 and the leaver sweep — disappear. It also has no `team.info` equivalent, so the
`T0BG8HX3E0G` workspace guard below has nothing to check against, and its scopes are
user-token scopes, meaning posts would carry the name of whoever triggered the run rather
than a fixed service identity.

It does offer things Zapier does not — private-channel search, thread reads, canvases, and
no connection-default drift. None of them is worth losing revocation. Revisit only if Slack
exposes invite/kick tools on that server.

## There is no HR system

NDI has no HRIS in this scope. BambooHR was removed on 2026-09-12; nothing replaced it.

- Employee attributes — job title, department, manager — live on the **Google Workspace
  account**, written by the profile `PUT`.
- What was granted and revoked lives in the **provisioning register** (Google Sheets).

Those two are the whole record. Do not look for an HR system to write to, do not report its
absence as a failure or a staged item, and do not add one back without also writing down
what was verified about it.

## Scopes Zapier's Google Workspace app never requests

Three offboarding steps are impossible for this reason, not for lack of admin rights:
session revocation (`admin.directory.user.security`), mailbox delegation
(`gmail.settings.sharing`), and Drive ownership transfer (Data Transfer API).

**Suspension is therefore the load-bearing revocation step.** Say so in the completion
report rather than implying sessions were killed.

## The general rule

State plainly which items ran and which are staged, and give the concrete reason for each
staged one. Never assume a connector is present, and never report a staged item as done
because you knew what the call would have been.
