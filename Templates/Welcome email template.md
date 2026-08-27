# Welcome email template

*Placeholders in `{{ }}`. GP-01 fills them from intake and the provisioning run, and
creates the result as a Gmail draft — it never sends. Keep it short: a new joiner reads
this on their phone.*

**To:** {{joiner_personal_or_work_email}}
**Cc:** {{manager_email}}
**Subject:** Welcome to NDI, {{preferred_name}} — everything for your first day

---

Hi {{preferred_name}},

We're glad you're joining NDI as {{role}} on {{start_date_long}}. Here's what you need for
day one.

**Where to be:** {{first_day_location_or_link}} at {{first_day_time}}. {{manager_name}}
will meet you there and has your first week mapped out.

**Your account:** {{work_email}}. Sign in with the link in the separate mail from IT and
set up two-factor authentication before you start — it takes two minutes and saves an hour
on Monday.

**Ready for you:**
{{ready_list}}

{{#if pending_list}}
**Still coming:**
{{pending_list}}
{{/if}}

**Worth reading first:** {{first_documents}}

**Who to ask:** {{manager_name}} for anything about the work, People Ops
({{people_ops_email}}) for policy and contracts, IT ({{it_email}}) for access and kit.

Anything unclear before Monday, just reply to this mail.

Welcome aboard,
{{sender_name}}
People Operations, NDI

---

## Rules for filling it

- `ready_list` contains only what is actually provisioned and verified. Never list a
  staged item as ready.
- `pending_list` names each outstanding item with a date and an owner, or is omitted.
- No superlatives, no "exciting journey", no emoji.
- Personal details beyond name, role, team and start date do not belong in a mail with a
  cc line.
