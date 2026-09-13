# Prompt — architecture diagrams for the artifact pattern

Copy everything below the line into Claude. It is self-contained: it carries all the facts,
so it does not matter which project you paste it from or whether the chat has any context.

Ask for one diagram at a time if you want to iterate on each; ask for all seven at once if you
want the set.

---

Draw the architecture of **an AI employee built as a published Claude Artifact**. This is a
reusable pattern, not one product — do not name any specific assistant, company, connector or
model. Say "the skill", "a connector", "the real system".

Produce **seven diagrams as inline SVG inside one HTML page**, each in a `<figure>` with a
`<figcaption>` stating what it shows. No libraries, no external images. Use `viewBox` and let
CSS scale them. Strokes and text in `currentColor` so they work in light and dark, with at
most two literal hues used consistently throughout:

- **one hue for Claude's side** (its servers, the model, the connector broker)
- **one hue for the outside world** (connectors, the real systems being changed)
- **neutral for everything the author wrote** — that contrast is the point of the whole set

Label every arrow with a verb (`reads`, `copies in at build time`, `asks`, `attaches
credentials`). An unlabelled arrow says nothing. Align to a grid; short labels in the drawing,
explanation in the caption.

## The facts to encode — all of these are true and none should be softened

**The skill.** A Markdown file. It holds the rules — what to do, in what order, what counts as
verified, what must never happen. It contains no code and calls nothing. It is the *only*
implementation: no surface re-states a rule in code, because the moment a rule exists twice the
copies drift.

**Two ways to reach it.** Installed as a plugin, it works in Claude chat and re-reads on every
update. Built into an artifact, it is a *build-time copy* — a snapshot that does not update
until someone rebuilds and republishes.

**Build is not publish.** The source page contains a placeholder word — literally a string like
`"__SKILL_FILES__"`. A build script reads the skill files and does a find-and-replace, writing
a second, self-contained file. That is all the build does. Publishing is a separate action that
takes the built file and gives it a URL. Building touches nothing on Claude's side.

**Inside the published page**, three things and none of them is intelligence:
1. the author's markup and code — the form, the buttons, the log;
2. the skill, as an inert string;
3. `window.claude`, an object with **one function: `use()`**. It is a door, not a brain.

**The page has no network of its own.** A direct request to any outside address is blocked by
CSP. Everything it reaches, it reaches by asking through that door.

**The capabilities behind the door**, and which one thinks:
- `sample` — send text to Claude, get text back; with tools, Claude can ask the page to run its
  own functions. **This is the only one that thinks.**
- `mcp` — call a connector the viewer has connected, using *their* credentials.
- `db` — a small database attached to this artifact, **shared by everyone who can open it**.
- `downloads` — offer a generated file to the person looking at the page.
- plus `artifact` (the page republishes itself), `assets` (stored files), `room` (live presence).

**Where the thinking happens.** The model is *not* in the page. Asking it something is a message
over the internet, exactly like a chat app. The page sends the skill plus the request, then
**waits**. All reasoning happens on Anthropic's servers.

**One run is a loop.** The page opens it with one long message. The model replies asking for one
of the page's own functions; the page runs it, which forwards to a connector through Claude's
broker; the broker attaches credentials and calls the connector; the connector calls the real
system; the result travels back the same way. Repeat, often twenty times or more, until the
model calls the page's "finished" function. **The page never talks to the real system and never
sees a credential.**

**Credentials are per viewer.** Nobody can put a secret in a published page — it is delivered to
the browser and anyone can read it. So the page holds *no token*. It names a connector, and the
credential is attached on Claude's side, by the viewer. Consequence: the same page, opened by
two people, reaches the real system for one and fails for the other. **Sharing a link is not
granting access; the connector is the permission.**

**Two stores, split on a real distinction.**
- `db` — **shared**: the records everyone works from, and the outputs that belong to those
  records. One person's work is there for the next person.
- `localStorage` — **private to one browser**: what *you* did and how you like to work. It can
  come back empty (private window, cleared data, another device), so it never holds anything
  that matters.

**Four limits every build hits in the first week:**
1. **Tool rounds** — one request gets a bounded number of tool calls. A long job runs out
   partway and must continue as a fresh request carrying what already happened.
2. **Prompt size** — one request carries a capped amount of text. A long skill plus a growing
   log reaches it. Check at build time and fail the build, not the run.
3. **The tab** — there is no server. Closing the page kills the job mid-step. Anything already
   done stays done. Write progress as it happens, never only at the end.
4. **No network** — the page cannot call any outside address directly. Everything external goes
   through a connector, including anything of your own, wrapped as a server and added as one.

**Distribution differs between the two surfaces.** The plugin is installed by each person and
updates itself. The artifact is published once as a URL and **nothing is installed** — the skill
is already inside the file. But it also never updates on its own: after every skill edit, rebuild
and republish, or chat runs the new rules and the page runs the old ones with nothing to say so.

## The seven diagrams

1. **One skill, two surfaces.** The skill file on the left; the plugin path and the artifact path
   on the right. Label what travels along each arrow — one re-reads, one takes a snapshot.
2. **Build is not publish.** Source page with a hole, plus the skill files, through the build
   script, to a self-contained file, then a separate publish step to a URL. Show clearly which
   side of the picture is the author's machine and which is Claude.
3. **Inside the page.** A box containing markup, the skill as text, and `window.claude`. One
   arrow out through the door; everything behind it listed. Make it obvious that nothing inside
   the box can think.
4. **Where the thinking happens.** Browser on one side, Anthropic's servers on the other.
   Arrows for: the skill and request going out, the answer coming back, and — the one that makes
   it an agent rather than a chat box — the model asking the page to run a function, and the
   page returning the result.
5. **One run, start to finish.** Four columns: the page, the model, the broker, the real system.
   Number the steps. Show that steps three to eight repeat until the model says it is finished.
6. **Who holds the credentials.** The same page opened by two viewers. One has the connector and
   the write lands; the other does not and the call fails. Same page, same code — only the
   viewer's own connections differ.
7. **What is shared and what is yours.** The two stores side by side: the shared database that
   everyone who opens the page reads and writes, and the per-browser storage that nobody else
   ever sees. Show what belongs in each and why.

## What not to draw

- **No model names.** An artifact asks for a *tier* — roughly "fastest", "balanced", "most
  capable" — and is told which tier answered. It is never told which model. Naming one would be
  wrong the next time a model ships.
- **No product, company or connector names.** The pattern is the subject.
- **No cloud icons, no clip art, no gradients.** Boxes, lines, labelled arrows.
- **Nothing you cannot source from the facts above.** If something is not stated here, leave it
  out rather than inventing it.
