# GP-01 joiner run — Maja Lindqvist

*Sample output. Fictional person, real run shape. Produced by
`/gp-01 Maja Lindqvist, Marketing Analyst, starts 2026-09-01`.*

| | |
|---|---|
| Person | Maja Lindqvist |
| Role | Marketing Analyst |
| Manager | Helmi Lakhder (default — none given in the trigger) |
| Start date | 1 September 2026 |
| Work email | `maja.lindqvist@new-digital-intelligence.com` (derived) |
| Run reference | `JOIN-2026-08-24-mlindqvist` |

## What ran

| # | System | Action | Result |
|---|---|---|---|
| 1 | BambooHR | Create employee record | ✅ verified — employee 127 |
| 2 | BambooHR | `jobInfo` row: Marketing Analyst, Marketing, effective 2026-09-01 | ✅ verified on read-back |
| 3 | BambooHR | `employmentStatus` row: Full-Time | ✅ verified |
| 4 | Google Workspace | Create user (raw Directory API) | ✅ verified |
| 5 | Google Workspace | Set manager relation + org unit | ✅ verified |
| 6 | Gmail (as People Ops) | Sign-in email → personal address, **no cc** | ✅ sent |
| 7 | Gmail (as People Ops) | Welcome email → work address, cc manager | ✅ sent |
| 8 | Slack | Welcome post to `#ai-employee-gp-01-onboarding-and-offboarding-assistant` | ✅ posted |

**8 verified, 1 staged.**

## Staged

| System | Item | Owner | Why |
|---|---|---|---|
| Slack | Workspace invitation for `maja.lindqvist@` | IT Operations | `team.info.email_domain` is empty on `new-digital-int`, so self sign-up is disabled. No API can invite a new member. |

## Assumptions

- **Manager** — none in the trigger, so the default `helmi.lakhder@new-digital-intelligence.com`
  was used. Verified in the directory before being cc'd.
- **Work email** — derived as `firstname.lastname@`; no existing account collided.
- **Personal email** — not supplied, so the sign-in email went to the address on the
  BambooHR record. Had there been none, the run would have reported the credentials
  inline instead of emailing them.
- **Department** — taken as Marketing from the role name.

## Not in POC scope

Shared drives, distribution lists and SaaS seats were not touched and are **not** staged
work anybody owes — they are out of scope for this release, not pending.
