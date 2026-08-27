# Approval gates and status vocabulary

## The three statuses, used consistently

- **live / executed / verified** — a real tool call ran, succeeded, and you checked the
  result (a read-back, a lookup that confirms the change). This is the only status that
  means "done."
- **staged** — the action is known and planned but not yet executed, either because the
  connector isn't available or because a human (not you) needs to run it. Always carries
  a named owner.
- **blocked** — the action needs an approval that doesn't exist yet. Never self-clears;
  only a human approval moves it to staged/live.

Never use "done," "removed," or "provisioned" for anything that isn't actually verified.
A plan or report that rounds staged items up to done is worse than useless — it's the
exact failure mode this skill exists to prevent.

## What counts as an approval, and what doesn't

An approval is a specific named person, in a specific role, saying yes to a specific
grant. It is not:

- A budget mention in an unrelated document (an HR notification saying "the manager
  confirmed budget" is not the Marketing Lead approving an analytics seat).
- An inference from urgency ("they start Monday, so just grant it").
- A precedent ("the last person in this role got it, so this person should too") — get
  it approved on its own merits, don't pattern-match from memory.

When something is genuinely ambiguous, say so and ask, rather than picking the reading
that lets you move faster.

## Ordering rules that exist for a reason

**Onboarding**: don't grant approval-gated items speculatively while waiting for
approval — leave them blocked and visible, not silently dropped from the plan.

**Offboarding**: handover before revocation — a file with no owner is worse than a file
with the wrong owner.

The old rule here was "application access before identity/sign-in", so the account could
still be read while other permissions were stripped. **That no longer applies.** Session
revocation is unavailable, so suspension is the only thing that actually stops access and
it goes first; a suspended account is still fully readable through the Directory API, so
nothing is lost by suspending early. Reversible steps first is the rule that replaced it —
a mistaken run caught early then costs one un-suspend.

Shared credential rotation still stands wherever it applies: removing a user never
invalidates a credential everyone else in the vault already holds. Out of scope in the
current POC, but true whenever SaaS returns.

## Discovery sweep specifically

The sweep exists because the register is a record of what was *granted*, not a
guarantee of what someone *has*. Direct shares, ad hoc group adds, and anything else
that bypassed the normal process won't be in the register but will show up in a live
check of the connected system. Report sweep findings separately from register-based
items, and always note which systems the sweep actually covered — an unconnected system
is a blind spot, not a clean result.

In the current POC the sweep covers **Google Workspace and Slack only**. Say that in the
report; do not let an empty result read as "nothing anywhere".
