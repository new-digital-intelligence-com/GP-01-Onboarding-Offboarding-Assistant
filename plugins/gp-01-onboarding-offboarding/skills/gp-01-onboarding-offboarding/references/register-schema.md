# Provisioning register schema

Use this CSV shape for any register you create fresh. If the user already has a register
in a different shape, use theirs — don't force a migration — but keep the same
information present in some form: who, what, from where, executed when, verified how.

## One worksheet, not one per action

Every row goes in the **same** worksheet. There is no `JOIN` worksheet and no `LEAVE`
worksheet — `ChangeRef` is what separates a joiner run from a leaver run, which is why it
is never blank. A run that goes looking for a per-action tab finds nothing, spends a step
listing worksheets, and may create a tab that splits the register in two.

## Columns

```
EmployeeID,Person,Role,System,Resource,AccessLevel,Action,Status,Basis,ApprovedBy,ExecutedAt,Evidence,ChangeRef
```

- **EmployeeID / Person / Role** — who this row is about.
- **System / Resource / AccessLevel** — what, specifically (e.g. `Slack`, `#marketing`,
  `member`; or `Google Workspace`, `Delivery shared drive`, `editor`).
- **Action** — `grant` or `revoke`.
- **Status** — `executed`, `verified`, `staged`, or `blocked` (see
  `approval-gates.md` for what each means).
- **Basis** — why this row exists: a standard joiner grant (`joiner — standard`), a
  register grant being reversed (`register grant JOIN-...`), or a discovery-sweep
  finding (`discovery sweep — undocumented access`). Never leave this blank — every row
  should trace to a reason.
- **ApprovedBy** — the named human, only when the row needed an approval. Blank for
  standard items that don't need one.
- **ExecutedAt** — ISO timestamp, only filled once actually executed. Blank for staged
  or blocked rows — an empty value here is itself meaningful, don't fill it in early.
- **Evidence** — what you actually checked to call this verified (e.g. "drive permission
  deleted; read-back shows no access"), or which owner/file a staged item is tracked in.
- **ChangeRef** — the run's reference, e.g. `JOIN-2026-08-24-mlindqvist` or
  `LEAVE-2026-08-21-tbeck` — ties every row from one run together.

## Worked example (fictional)

```
124,Francois Holland,AI Engineer,Google Workspace,Account,user,revoke,verified,register grant JOIN-2026-08-27-fholland,,2026-08-27T09:22:00Z,suspended: true confirmed on read-back,LEAVE-2026-08-27-fholland
124,Francois Holland,AI Engineer,Slack,Channel membership,member,revoke,staged,discovery sweep — Slack lookup,,,no Slack account found; nothing to revoke — owner IT Operations,LEAVE-2026-08-27-fholland
```

The first row is something GP-01 actually did and read back. The second is staged with an
owner and no execution timestamp — exactly as it should look until a human confirms it.

**There is no `Identity` / SSO row any more.** Okta was removed; the Google Workspace
account *is* the identity. An older register may still carry Identity rows from previous
runs — leave them, they are history, but do not create new ones.
