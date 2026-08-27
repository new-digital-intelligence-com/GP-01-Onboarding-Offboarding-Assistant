# Joiner emails — two of them

A joiner run sends **two** emails, both from `peopleops@new-digital-intelligence.com`
(`from_name`: NDI People Ops) via Zapier Gmail. They go to different addresses for a
reason: the second lands in a mailbox the person cannot open until they have used the
first.

**Cc:** the verified manager on the welcome email only. Never on the sign-in email — it
carries a temporary password.

---

## Email 1 — sign-in details → personal address

**To:** {{personal email}}  ·  **Cc:** none  ·  **From:** peopleops@new-digital-intelligence.com
**Subject:** Your New Digital Intelligence account — sign-in details

Hi {{FirstName}},

Your New Digital Intelligence account is ready ahead of your start date on {{StartDate}}.

Sign-in details
  Address:  {{work email}}
  Password: {{temporary password}}
  Sign in at: https://accounts.google.com

You will be asked to set your own password the first time you sign in. Please do this
before your first day, and set up two-factor authentication at the same time — it takes a
couple of minutes.

A separate welcome message with your first-day details is waiting in your new mailbox.

If anything does not work, reply to this message and I will sort it out.

NDI People Ops
New Digital Intelligence

---

## Email 2 — welcome → new work address

**To:** {{work email}}  ·  **Cc:** {{verified manager}}  ·  **From:** peopleops@new-digital-intelligence.com
**Subject:** Welcome to New Digital Intelligence, {{FirstName}}

Hi {{FirstName}},

Welcome to New Digital Intelligence. We are glad to have you joining us as {{Role}} on
{{StartDate}}, reporting to {{Manager}}.

**Your account**
Your work address is {{work email}} — you are reading this in it. Sign-in details went to
your personal address separately.

**Ready for you**
{{only items actually executed and verified}}

**Slack**
Two cases — pick the one that matches what `team.info` returned this run. The workspace is
always `new-digital-int`; never paste a signup URL from an older email.

*If `email_domain` is set to our domain:*
Sign up at https://new-digital-int.slack.com/signup using your new work address —
no invitation needed. There is a welcome message waiting for you in
{{welcome channel}}.

*If `email_domain` is empty (currently the case):*
Your Slack invitation will be sent to you by IT Operations — self sign-up is not enabled,
so please wait for it rather than trying to join yourself.

**Still coming**
{{every staged item, phrased plainly, with who is chasing it}}

**Your first day**
{{Manager}} will walk you through your first-day plan.

**Who to ask**
{{Manager}} for the work, People Ops for policy and contracts, IT for access and kit.

Anything unclear before {{StartDate}}, just reply to this message.

Welcome aboard,

NDI People Ops
New Digital Intelligence

---

*Note for whoever reviews this: keep "still coming" honest. If the run staged more than it
executed, say so — never write "ready" for something that is not.*
