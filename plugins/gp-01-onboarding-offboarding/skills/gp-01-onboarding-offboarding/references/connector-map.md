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
| BambooHR | `BambooHRCLIAPI` | Employee record, job-info and employment-status rows |
| Google Sheets | `GoogleSheetsV2CLIAPI` | Provisioning register |

Check connections at the start of a run with `inspect_zapier_actions`. If an app reports
no default connection, that is a setup gap — say so plainly rather than retrying.

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

## BambooHR: effective-dated tables, not fields

`jobTitle`, `department`, `reportsTo` and `employmentHistoryStatus` are rows in
effective-dated tables. BambooHR resolves the top-level field to whatever row is in effect
*today*, so for a future-dated joiner the top-level `jobTitle` is **correctly blank** until
their start date. Reading it and reporting failure is a false alarm — that happened once.

- Write to `/employees/{id}/tables/jobInfo` and `/employees/{id}/tables/employmentStatus`
- `reportsTo` takes the manager's **full name**, not an email or an ID
- **Set `reportsTo` in the `jobInfo` row itself, not through the packaged update action.**
  The packaged action requires the manager to be supplied via `dynamic_properties`, which
  needs employee-record context a mid-run call does not have; it fails and the model burns
  a step retrying. Same shape of trap as Google's packaged `create_user` above: the direct
  write works, the convenience wrapper does not
- Post each table **once** — repeating adds a duplicate row at the same date
- Verify by reading **the tables**
- Dates resolve in BambooHR's timezone and can shift a day — report the stored value
- Home email must be unique; a duplicate returns `409`. Leave it unset and carry on
- There is no delete

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
