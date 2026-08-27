# Offboarding completion report — Tom Beck

*Sample output. Fictional person, real run shape. Confidential — People Ops, the manager
and IT Operations only.*

| | |
|---|---|
| Person | Tom Beck (BambooHR 118) |
| Role / team | Solution Architect, Delivery |
| Last working day | 21 August 2026 |
| Run reference | `LEAVE-2026-08-21-tbeck` |
| Date confirmed by | BambooHR `employmentStatus` — not a verbal report |

## Headline

**5 verified, 2 staged. The Slack account is still active.**

This offboarding is not signed off until the two staged items are executed and confirmed.

## Access removed (verified)

| System | Action | Evidence |
|---|---|---|
| Google Workspace | Account suspended (`suspended: true`) | Read-back shows `suspended: true`; sign-in refused |
| BambooHR | `employmentStatus` row: Terminated, 2026-08-21 | Read back; stored date matches |
| Slack | Removed from `#ai-employee-gp-01-onboarding-and-offboarding-assistant` | `slack_remove_user_from_channel` returned ok; member list re-read |
| Slack | Removed from `#delivery` | Same |
| Gmail | Farewell sent to personal address, cc manager | Message ID recorded |

## Staged — not done

| System | Item | Owner | Why |
|---|---|---|---|
| Slack | Remove from `#leadership` | IT Operations | *"neither you nor the bot are in the selected channel"* — the acting identity is not a member, so it cannot remove anyone there |
| Slack | **Deactivate the account** | IT Operations | `users.admin.setInactive` → `not_allowed_token_type`. Not reachable by any connected tool |

## What suspension does and does not cover

The Google Workspace account is **suspended, not deleted**. Suspension stops sign-in
immediately and is the step that actually revokes access. It does **not**:

- kill sessions already open on a device — session revocation needs a scope this
  integration does not have, so treat active sessions as a residual risk until IT confirms
- deactivate their Slack account — they keep the workspace account and can still sign in,
  see public channels and DM people until IT Operations deactivates it
- delegate their mailbox or transfer their Drive files — both need scopes not granted

Deletion is deliberately never automatic. It happens after the retention window, by a
human, and it is irreversible.

## Findings

Private Slack channels the acting identity cannot see are invisible to this sweep, so the
two channels listed are what was *visible*, not necessarily all of them. Absence of a
finding is not proof of absence.

## Open items

| # | Item | Owner | Due |
|---|---|---|---|
| 1 | Remove from `#leadership` | IT Operations | 22 Aug 2026 |
| 2 | Deactivate the Slack account | IT Operations | 22 Aug 2026 |
| 3 | Re-run the verification sweep once 1–2 are confirmed | People Ops | on confirmation |

## Sign-off

**Not ready for sign-off.** Two items staged, both Slack, both with IT Operations. Re-issue
this report after they are confirmed.

People Operations: ______________________  Date: ____________

IT Operations: ______________________  Date: ____________
