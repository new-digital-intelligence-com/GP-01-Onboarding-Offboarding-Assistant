# Offboarding completion report — {{Person}}

*Produced by a GP-01 leaver run. Confidential — People Ops, the manager, and IT
Operations only.*

| | |
|---|---|
| Person | {{Person}} ({{EmployeeID}}) |
| Role / team | {{Role}}, {{Team}} |
| Last working day | {{Date}} |
| Run reference | `{{ChangeRef}}` |
| Run by / date | {{Runner}}, {{RunDate}} |
| Date confirmed by | {{source of the confirmed last-working-day}} |

## Headline

**{{N}} access items: {{verified count}} verified removed, {{staged count}} staged with
{{owners}}, {{blocked count}} blocked. {{M}} undocumented access item(s) found outside
the register.**

Say plainly if the run is not complete: staged items mean this offboarding must not be
signed off until they're executed and confirmed.

## Access removed (verified)

| System | Resource | Access | Action | When | Evidence |
|---|---|---|---|---|---|
| {{fill one row per verified item}} | | | | | |

## Access staged for removal

Grouped by system, in execution order: **account suspension first** (the only step that
actually stops access), then handover, then anything staged for a human.

| System | Resource | Action | Owner | Artefact |
|---|---|---|---|---|
| {{fill one row per staged item}} | | | | |

## Handover

| What | To whom | Status | Note |
|---|---|---|---|
| {{files, mailbox, open tasks, recurring meetings, shared credentials}} | | | |

## What suspension does and does not cover

State this on every report — it is the most misread part of a GP-01 offboarding.

The Google Workspace account is **suspended, not deleted**. Suspension stops sign-in
immediately and is the step that actually revokes access. It does **not**:

- kill sessions already open on a device — session revocation needs a scope this
  integration does not have, so treat active sessions as a residual risk until IT confirms
- deactivate their Slack account — not reachable by API, so they keep the workspace
  account and can still sign in. Channel memberships are removed where the acting Slack
  identity is itself a member; the rest are staged, listed by name
- delegate their mailbox or transfer their Drive files — both need scopes not granted

Deletion of the account is deliberately never automatic. It happens after the retention
window, by a human, and it is irreversible.

## Findings

List anything the discovery sweep turned up that wasn't in the register, plus anything
that needs a human decision (an approval-gated resource, a cost decision, an export
decision). Say what's out of scope for GP-01 and who owns it instead.

Note plainly that the sweep only sees what the connected systems expose. It is not a
complete audit.

## Open items

| # | Item | Owner | Due |
|---|---|---|---|
| {{one row per open item, including "re-run the verification sweep on confirmation"}} | | | |

## Sign-off

State clearly whether this is ready for sign-off. If not, say how many items are still
staged and what has to happen before a re-issue of this report.

People Operations: ______________________  Date: ____________

IT Operations: ______________________  Date: ____________
