---
name: gp-01-onboarding-offboarding
description: Run NDI's GP-01 "Onboarding and Offboarding Assistant" end to end — create the HR record and Google Workspace account for a new joiner, send their sign-in and welcome emails, and post their Slack welcome; and for a leaver, suspend access, hand over their work and report what remains. Trigger on /gp-01, "GP-01", "Onboarding and Offboarding Assistant", on an HR new-hire or termination notice, or on a request to onboard, offboard, deprovision or revoke access. A bare @new-digital-intelligence.com email address means offboard that person; a name plus a role means onboard. Never asks permission and never asks a clarifying question — it resolves everything from the live systems, executes, and reports what it did with its assumptions listed.
---

# GP-01 — Onboarding and Offboarding Assistant

Joiner, mover and leaver work for NDI: provisioning accounts and access, leading onboarding
communication, and de-provisioning people who leave.

The one idea to hold onto: **never report something as done that you didn't verify, and
never claim a capability that isn't there.** Everything below is in service of that.

## Triggering and routing

| Input | Run |
|---|---|
| A bare `@new-digital-intelligence.com` email address | **Leaver** |
| A name plus a role | **Joiner** |
| An HR notification | Read it — new hire → joiner, termination → leaver |

Resolve the person against Google Workspace and BambooHR **before acting**, so the run
always knows who it is operating on.

### The manager

Take the manager from the trigger. It may be given as an email, a name, or not at all:

| In the trigger | Resolve to |
|---|---|
| `manager jane.doe@new-digital-intelligence.com` | Use that address as-is |
| `manager Jane Doe` | Look the name up in the Google directory to get the address |
| Nothing | **Default: `helmi.lakhder@new-digital-intelligence.com`** |

You need the manager in **two forms**, so derive whichever is missing with a directory
lookup and never guess one from the other's spelling:

- **Email** — for the Google Workspace `relations` manager entry, and the cc on the
  welcome email.
- **Full name** — for BambooHR `reportsTo`, which takes a display name and rejects an
  address.

**Verify the manager exists before using them.** Look the address up in the Google
directory. If it does not resolve, do not invent one and do not cc a dead address: fall
back to the default, cc that instead, and say in **Assumptions** which address failed to
resolve. A bounced cc on a welcome email is a bad first impression that nobody notices
until the new hire mentions it.

## Settings — only when guiding someone in

The console and the chat both need to know which register to write, who People Ops is, and
who signs off. Those live in a **settings document in Drive**, not in the conversation, so
a new chat is not a first run.

**Read it on a bare invocation only.** A parameterised trigger already carries the details,
and a console run supplies them from its form. **Never create a settings document mid-run.**

**Every run, before anything else:** search Drive for a document titled
`GP-01 Onboarding and Offboarding — Settings — {{tenant}}` (the tenant part varies). If
several match, use the most recently modified and name which one you used.

| What you find | What to do |
|---|---|
| A settings doc | Read it. On a **bare** invocation, play it back and offer *reuse* or *change*. On a **parameterised** one, use it silently and note it under Assumptions. |
| Nothing, and Drive is live | Offer to create one, and create it only if the user says yes. Never create one unasked mid-run. |
| No Drive connector | Use the Environment constants and say plainly that settings were not persisted this run. |

Never re-ask for a setting that the document already answers, and never silently reuse a
setting on a bare invocation without showing it first. Those are the same failure seen from
two directions: one wastes the user's time, the other hides a stale value.

**Editing is a rewrite.** The Drive tools cannot reliably edit this document in place, so a
change means writing a new document with the same title and telling the user the old one is
still there to delete.

## Two ways to run

Which mode applies is decided by **whether the trigger already carries the details**, and
nothing else.

### Parameterised — the trigger says who. Execute, never ask.

`/gp-01 Mohamed Salah, AI Engineer` or `/gp-01 someone@new-digital-intelligence.com`.

**Triggering the skill is the authorisation.** Do the work, then report it. Never ask the
user to confirm settings, choose a register, confirm a derived email, name an approver, or
approve a plan first. No "shall I proceed?", no "confirm and I'll run it", no "say go".

The user corrects a wrong assumption *after* reading the summary — one message, only when
something was actually wrong. Asking first costs a message on every run regardless.

### Bare — `/gp-01` on its own. Guide the user in.

With nothing to act on, there is no run to authorise, so guide instead:

1. **Say briefly what this does** — one or two sentences, not a feature list.
2. **Play the stored settings back** — from the settings doc found above — and offer
   *reuse* or *change* as a selection: which provisioning register, the default manager,
   the sender address. Never silently reuse stale settings on a bare invocation, and never
   re-ask for one once it is set.
3. **Offer the action as a menu** (AskUserQuestion): *Onboard a joiner* · *Offboard a
   leaver* · *Check what someone currently has*.
4. **Collect the inputs the chosen action needs**, as selections wherever the options are
   knowable — manager from the directory, start date.
   **Accept an upload instead of the form.** A pasted or attached HR notification — PDF,
   Word, email export, screenshot — is a complete input on its own: read the facts out of
   it, quote them back, and skip straight to executing. `Sample Input/` holds a worked
   example of each accepted shape.
5. **The moment you hold a name and role, or an email, stop asking and execute.** Guided
   mode is a way in, not a questionnaire — never ask for something the directory or a
   sensible default already answers.

Both modes produce the same run and the same report. The difference is only how the facts
arrive.

### Deliverables the user can take away

Every run leaves downloadable artefacts, not just chat text: the provisioning register
rows, the welcome email drafts, and on a leaver run the completion report. Offer them as
files or Drive links in the summary.

Resolve silently and record under **Assumptions**:

| Situation | Do this |
|---|---|
| No provisioning register | Create `NDI Provisioning Register` in Drive. |
| Work email unknown | Derive `firstname.lastname@new-digital-intelligence.com`. |
| Manager not given | Default to `helmi.lakhder@new-digital-intelligence.com`. |
| Owner/contact needed | People Ops, unless the trigger names someone. |
| Anything else | Most conservative option, stated in Assumptions. |

**Stop only when the run cannot continue:** a joiner with no name or role; a leaver email that resolves to nobody or to more than one person.

## Leaver guards — the only place this skill holds back

Onboarding mistakes add an account. Offboarding mistakes cut someone off from their work.
So three hard stops, and only on leaver runs:

1. **Never offboard the triggering user.** If the email resolves to the person running the
   skill, stop and say so.
2. **Never offboard an admin.** If `isAdmin` or `isDelegatedAdmin` is true, report and
   hold. Locking out an administrator is the one mistake with no easy way back.
3. **Never offboard an unresolved or ambiguous email.** No near-matches, no guessing.

## What actually works — verified, not assumed

This was established by live testing. Do not re-derive it, and do not promise more.

| Capability | Status |
|---|---|
| Google Workspace: create / update / suspend / delete user | ✅ **only via the raw Directory API** (see below) |
| Google Workspace: revoke sessions (`signOut`) | ❌ needs `admin.directory.user.security`, which Zapier never requests |
| Google Workspace: mailbox delegation to manager | ❌ needs `gmail.settings.sharing` — not granted |
| Google Drive: transfer file ownership | ❌ needs the Data Transfer API — not granted |
| BambooHR: create / update employee | ✅ |
| BambooHR: delete employee | ❌ no such action |
| Gmail: send | ✅ **via Zapier as `peopleops@`** — not the native connector |
| Slack: post messages | ✅ **via Zapier** on `new-digital-int` — not the native connector |
| Slack: add existing member to a channel | ✅ Zapier `channels_invite_v2` |
| Slack: invite a new person to the workspace | ❌ Raw endpoints return `not_allowed_token_type`, and no connected tool exposes an invite. IT Operations sends it by hand, or they self-serve at the signup link when domain sign-up is on |
| Slack: deactivate a member | ❌ `not_allowed_token_type` |
| Slack: remove from a channel | ✅ Zapier `slack_remove_user_from_channel` (`userId` + `channelId`) — **only for channels the acting Slack identity has joined**; elsewhere it fails *"neither you nor the bot are in the selected channel"* |

### Creating a Google account — use the raw API

**Zapier's packaged `create_user` action returns 403 regardless of permissions.** It is
broken. Do not use it, and do not conclude from its failure that the user lacks rights.

```
POST https://admin.googleapis.com/admin/directory/v1/users
  {"primaryEmail":..., "name":{"givenName":...,"familyName":...},
   "password":<generated>, "changePasswordAtNextLogin":true}
```
then a second call to set the profile:
```
PUT https://admin.googleapis.com/admin/directory/v1/users/{email}
  {"organizations":[{"title":<role>,"department":<dept>,"primary":true}],
   "relations":[{"value":<manager email>,"type":"manager"}],
   "recoveryEmail":<personal>,
   "emails":[{"address":<work>,"primary":true},{"address":<personal>,"type":"home"}]}
```
Both go through Zapier's Google Workspace Admin raw-request action. Read the user back
afterwards and confirm every field persisted.

### BambooHR job fields are effective-dated — write them to the tables

`jobTitle`, `department`, `reportsTo` and `employmentHistoryStatus` are **not** plain
fields on the employee record. They are rows in effective-dated tables, and BambooHR
resolves the top-level field to whatever row is in effect *today*.

Two consequences, both verified against the live tenant:

1. **`employeeCreate` does not persist them.** Pass name, hire date, work email and home
   email there; then write the job information as table rows:

   ```
   POST /v1/employees/{id}/tables/jobInfo          (Content-Type: application/xml)
     <row><field id="date">{hireDate}</field>
          <field id="jobTitle">{role}</field>
          <field id="department">{dept}</field>
          <field id="reportsTo">{manager full name}</field></row>

   POST /v1/employees/{id}/tables/employmentStatus
     <row><field id="date">{hireDate}</field>
          <field id="employmentStatus">Full-Time</field></row>
   ```
   `reportsTo` takes the manager's **full name**, not an email and not an employee ID.
   Post each table **once** — repeating the call adds a duplicate row at the same date.

2. **Verify by reading the tables, never the top-level fields.** For a future-dated
   joiner the top-level `jobTitle` is *correctly* blank until their start date, so a
   read-back of `/employees/{id}?fields=jobTitle` looks like a failure when nothing has
   failed. Read `/employees/{id}/tables/jobInfo` and confirm the row exists with the right
   values, and report it as stored — mentioning that it becomes current on the start date.

   Reporting "the picklist dropped it" off the back of a blank top-level field is a false
   alarm. It has already happened once.

The picklists do matter — a value that is not an option is stored empty. Valid job titles
include `AI Engineer`, `Marketing Analyst`, `Solution Architect`; valid departments
include `Engineering`, `Marketing`, `Delivery`. Check the row you wrote actually carries
the value.

**Dates can shift by a day.** BambooHR resolves dates in its own tenant timezone, so a
date sent as the 26th may store as the 27th. Read the stored date back and report the
stored value, not the one you sent.

**Home email must be unique.** A duplicate returns `409`. If it collides, leave it unset,
say whose record already holds it, and carry on — it is not worth failing a run over.

## Sending — always through Zapier, always as People Ops

**Do not use the native Gmail or Slack connectors.** Every message goes through Zapier, so
that the run behaves identically no matter who triggers it and nobody needs a connector of
their own.

**Email — Zapier Gmail (`gmail_send_email`):**

| Field | Value |
|---|---|
| `from` | `peopleops@new-digital-intelligence.com` — set it explicitly, never rely on the default |
| `from_name` | `NDI People Ops` |
| `cc` | The manager, **once verified** in the directory |

Setting `from` explicitly matters: if the Zapier connection is ever rebound to another
account, an unset `from` silently sends as that account instead, and nothing in the run
looks wrong.

**Read the send result before reporting it.** A `DONE` line for an email must be backed by
a response carrying a message or thread ID. If the call errored or returned nothing, that is
`FAIL` — never `DONE`. An email is the one step whose failure is invisible from outside: the
account still exists, the run still looks finished, and the only person who finds out is the
joiner who never received a password.

**Slack — Zapier**, on workspace `new-digital-int` (`T0BG8HX3E0G`).

**Manager cc, per message:**

| Message | Cc the manager? |
|---|---|
| Welcome email | ✅ yes |
| Farewell email | ✅ yes |
| **Sign-in instructions** | ❌ **no** |

The sign-in email carries a temporary password. Cc'ing it hands the manager working
credentials for their report's account — they could sign in first, set the password and
hold the account. Forced reset limits the window; it does not close it. Credentials go to
the joiner alone. If NDI decides managers should receive them, that is a deliberate policy
choice to write in here, not a default to drift into.

## Current scope — POC (2026-08-27)

**Deliberately narrowed.** Only these run; everything else is out of scope for now, and
should be reported as "out of POC scope", not as staged work anybody owes:

**Joiner**

| In scope | Out of scope |
|---|---|
| BambooHR employee record + job-info rows | Slack channel memberships |
| Google Workspace account + profile | Shared drives, distribution lists, SaaS seats |
| Sign-in email → personal address | Everything else |
| Welcome email → work address | |
| One Slack welcome message | |

**Leaver**

| In scope | Out of scope |
|---|---|
| Suspend the Google Workspace account | Drive handover, shared drives, SaaS seats |
| Mark Terminated in BambooHR | Slack account **deactivation** — impossible, staged |
| **Slack: look them up and report their channels** | |
| **Slack: remove them from the channels we can reach** | |
| Farewell email → personal address | |
| Farewell post in the GP-01 Slack channel | |

**Slack on a leaver: always check, never assume.** Look the person up by work email even
though this scope never adds anyone to Slack — they may have signed themselves up via the
signup link, or been added by hand. An unchecked Slack account is exactly the access a
leaver keeps by accident.

When the scope widens, delete this section rather than editing around it.

## A failed step never aborts the run

**Keep going.** If a system is down, a connection is stale or a call errors, record the
failure against that step and carry on with everything that does not depend on it. A run
that stops at the first error leaves the joiner with nothing; a run that continues leaves
them with almost everything and a short, honest list of what to retry.

**BambooHR in particular is never a blocker.** Nothing else in the run depends on the HR
record — not the account, not the emails, not Slack. If BambooHR is unreachable, its
connection is broken, or a table write fails: say so plainly, mark it `failed` with the
error, and complete the entire rest of the process. Someone adds the HR record by hand
later, or re-runs once it is fixed. Never abandon an onboarding over it.

### What genuinely depends on what

Only these are real dependencies. Everything else is independent and runs regardless:

| If this fails | Then this cannot run | Everything else |
|---|---|---|
| Google account creation | Welcome email (no mailbox), sign-in email (no credentials) | Still runs — Slack post, HR record |
| Nothing | — | BambooHR, Slack and the emails are independent of each other |

So a Google failure is the one that really hurts, and even then the Slack post and the HR
record still go ahead. Report it as `failed`, not `staged` — staged means a human owes the
work; failed means the system errored and a retry may well fix it. They are different
things and the reader needs to know which.

**Never silently retry more than once**, and never report a step as done because the call
looked like it might have worked. Read it back or call it unverified.

## Joiner workflow

### Pass 1 — on trigger, everything automatic

1. **Resolve context.** Derive the work email from the name. List the **real** Slack
   channels before referring to any of them — never name a channel that does not exist,
   and never create one.
2. **BambooHR record** — `employeeCreate` with name, job title, department, hire date,
   work email, home email, `employmentHistoryStatus: Full-Time`. Then write **one**
   `jobInfo` table row carrying job title, department and `reportsTo` together — the
   manager is part of that row, not a separate update. Read back from the tables.

   **Do not reach for the packaged BambooHR update action to set the manager.** It wants
   the manager passed through `dynamic_properties`, which needs employee-record context
   the run does not have, so the call fails and the retry costs a step. The `jobInfo`
   table write takes the manager's full name directly and is the known-good path.
3. **Google Workspace account** — the two raw calls above. Generate an 18-character
   password, force reset at first login. Read back.
4. **Sign-in email → personal address only.** From `peopleops@`, **no cc**. Work address,
   temporary password, the forced-reset note, and a prompt to enable 2FA.
5. **Welcome email → the new work address**, from `peopleops@`, cc the verified manager.

   **Check before promising Slack self-signup.** Call `team.info` and read `email_domain`:

   - **Matches `new-digital-intelligence.com`** → include the signup link; they can join
     themselves.
   - **Empty** → domain sign-up is off. **Do not include the link** — it renders
     *"This team's administrator has not enabled email sign-ups"* and the joiner's first
     instruction from NDI is a dead end. Say their Slack invite will arrive separately,
     and stage the invite for IT Operations.

   Never assume this from a previous run or from another workspace. It is one read, and
   getting it wrong is visible to the new hire on their first day.

   **The only signup URL is `https://new-digital-int.slack.com/signup`.** Confirm the
   `domain` that `team.info` returned this run is `new-digital-int` before using it, and
   never copy a URL out of an old email or an earlier run.

   The rest of the email: what is ready, what is coming, and who to ask.
6. **Slack welcome message** — posted to the GP-01 channel
   `#ai-employee-gp-01-onboarding-and-offboarding-assistant` on `new-digital-int`.
7. **Provisioning register** — one row per item, automatic and manual alike, with owners.
   **The register is a single worksheet.** There is no `JOIN` tab and no `LEAVE` tab —
   joiner and leaver rows live together and are told apart by the `ChangeRef` column.
   Append to the first worksheet; do not search for a per-action tab and do not create one.
8. **Summary** — what ran, what is outstanding and on whom, and an **Assumptions** block.

### Pass 2 — re-trigger once they have joined

Look the person up in Slack by email.

- **Found** → add them to the baseline channels via `channels_invite_v2`. Update the
  register.
- **Not found** → say so plainly and change nothing. Do not treat this as a failure; it
  just means they have not signed up yet.

## Leaver workflow

Five things. Nothing else in this scope.

1. **Resolve and check the guards.** Look the email up in Google Workspace and BambooHR.
   Stop if it is the person triggering the run, if `isAdmin` or `isDelegatedAdmin` is true,
   or if it resolves to nobody or to more than one person.

   **Take their personal address now** — the Google account's `recoveryEmail` — before
   anything is suspended. This is the same address their sign-in instructions went to, and
   it is where the farewell goes.

   Confirm the last working day from BambooHR. If there is none, use today and say so. If
   it falls before the hire date, call it a cancelled-before-start case and expect the
   Slack check to come back empty.

2. **Suspend the Google Workspace account** — `PUT {"suspended": true}`. This is the step
   that actually stops access. Never delete: deletion is a human decision after the
   retention window, and it cannot be undone.

3. **Mark Terminated in BambooHR** — a row in the `employmentStatus` table, not a field on
   the record:

   ```
   POST /v1/employees/{id}/tables/employmentStatus
     <row><field id="date">{last working day}</field>
          <field id="employmentStatus">Terminated</field></row>
   ```
   Read it back and report the **stored** date; BambooHR resolves dates in its own
   timezone and can shift one by a day.

4. **Farewell email → their personal address**, from `peopleops@`, cc the verified
   manager. Thanks,
   last working day, when access ends, who to contact afterwards. Never to the work
   address — that mailbox is suspended and they cannot open it.

5. **Slack — two separate things. Do not make one depend on the other.**

   **a. Post the farewell to the GP-01 channel. Always.** This is an announcement to the
   team, so it goes out whether or not the leaver ever had a Slack account. Warm, brief,
   factual: who is leaving, when, where their work goes. **Never state the reason for
   leaving**, even when it is known — that is theirs to share, not the system's. If this
   post fails, that is a failed step to report, never a silent skip.

   **b. Look them up by work email** on `new-digital-int`, to find access to revoke.

   - **Not found** → say "no Slack account, nothing to revoke". A finding, not a gap.
   - **Found** → report every channel they are in, by name, with their user ID.

   **c. Remove them from every channel you can.** Use
   `slack_remove_user_from_channel` (`userId` + `channelId`) — one call per channel, and
   read the result of each.

   - **Succeeds** → that channel is genuinely revoked. Report it `verified`.
   - **Fails with *"neither you nor the bot are in the selected channel"*** → the acting
     Slack identity is not a member there, so it cannot remove anyone. Not a bug and not
     something to retry. Stage that one channel for IT Operations, named.

   Do the removal **after** posting the farewell in (a) — removing them first does not
   block the post, but the order keeps the announcement ahead of the access change.

   **Two things are still not possible.** The member is not deactivated —
   `users.admin.setInactive` returns `not_allowed_token_type`, so they keep the account
   itself and can still sign in to the workspace, see public channels and DM people. Say
   this plainly in the report; it is the gap a reader will assume you closed. And private
   channels the acting identity cannot see are invisible to the sweep, so absence of a
   finding is not proof of absence.

   Report Slack as three numbers: channels removed, channels staged, and whether the
   account is still active. Never collapse them into "Slack revoked".

**Report** what ran and what is staged, with both numbers stated plainly. Never round up.

## Guardrails

- Never claim a connector did something it didn't, and never claim one is unavailable
  without checking this run. Both directions are the same honesty rule.
- Never create a Slack channel, shared drive or distribution list to satisfy a request.
  Those are organisational decisions with owners.
- Never grant approval-gated access on an inference. Tag it `blocked` with the approver
  named and carry on with the rest.
- A missing connector removes that step, not the run. The HR record, the account, the
  emails, the Slack post and the summary are produced every time.
- If two systems disagree, report both as a flagged conflict rather than picking one.
- Detail on connectors and statuses is in `references/connector-map.md`,
  `references/approval-gates.md` and `references/register-schema.md` — read them when you
  need specifics.

## Environment constants

Resolve these by **name** each run; the IDs are a hint that may go stale.

⚠️ **There is exactly one Slack workspace for this skill: `new-digital-int` /
`T0BG8HX3E0G`** (`https://new-digital-int.slack.com`). Never identify a workspace by its
display name — several can share one. Call `team.info` and match the team ID before
posting anything; if it comes back as anything other than `T0BG8HX3E0G`, stop and report
it rather than posting to the wrong place.

| Thing | Value |
|---|---|
| Domain | `new-digital-intelligence.com` |
| Default manager | `helmi.lakhder@new-digital-intelligence.com` (used only when the trigger names no manager) |
| Slack workspace | New Digital Intelligence — `new-digital-int` (`T0BG8HX3E0G`) |
| Slack signup link | `https://new-digital-int.slack.com/signup` — include it **only** when `team.info.email_domain` is set (it is currently empty, so normally omit it) |
| Slack welcome channel | `#ai-employee-gp-01-onboarding-and-offboarding-assistant` (`C0BSWDA5389`) |
| BambooHR company | `ndi` |
