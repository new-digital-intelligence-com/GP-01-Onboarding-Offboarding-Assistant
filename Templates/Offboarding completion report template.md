# Offboarding completion report — {{person_name}}

*Template for the People Ops sign-off document. Both counts always appear in the headline:
what was verified, and what could not be. Confidential — People Ops, the manager and IT
only.*

| | |
|---|---|
| Person | {{person_name}} ({{employee_id}}) |
| Role / team | {{role}}, {{team}} |
| Last working day | {{last_working_day}} |
| Run reference | {{change_ref}} |
| Run by / date | {{run_by}}, {{run_date}} |
| Date confirmed by | {{date_source}} |

## Headline

{{total_items}} access items: **{{verified_count}} verified removed**,
{{staged_count}} staged with {{staged_owners}}, {{blocked_count}} blocked,
{{undocumented_count}} undocumented access found.

## Access removed

| System | Resource | Access | Action taken | When | Evidence | Verified |
|---|---|---|---|---|---|---|
{{access_rows}}

## Handover

| What | To whom | Status | Note |
|---|---|---|---|
{{handover_rows}}

## Findings

{{findings}}

*Examples of what belongs here: access found outside the register, resources with no clear
inheritor, shared credentials needing rotation, register rows that turned out to be wrong.*

## Open items

| # | Item | Owner | Due |
|---|---|---|---|
{{open_items}}

## Sign-off

Removal of remaining access and the retention-window deletion on {{retention_date}} are
subject to People Ops confirmation. Sign below when the open items above are closed.

People Operations: ______________________  Date: ____________

IT Operations: ______________________  Date: ____________
