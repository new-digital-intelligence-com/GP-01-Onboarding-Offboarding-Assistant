/**
 * The skill IS the implementation. This module only reshapes it into a system
 * prompt — the app must never re-implement a provisioning step in TypeScript,
 * or GP-01 would exist twice and the copies would drift.
 *
 * Content comes from skill.generated.ts, written by scripts/embed-skill.mjs at
 * build time from skill/. Workers has no runtime filesystem, so it cannot be
 * read with fs when deployed.
 */
import { SKILL_FILES } from "./skill.generated";

const REFERENCES = [
  "references/connector-map.md",
  "references/approval-gates.md",
  "references/register-schema.md",
  "assets/welcome-email-template.md",
  "assets/completion-report-template.md",
];

export function buildSystemPrompt(): string {
  const body = (SKILL_FILES["SKILL.md"] ?? "").replace(/^---[\s\S]*?---\n/, "");
  const refs = REFERENCES.map((rel) => {
    const content = SKILL_FILES[rel];
    return content ? `\n\n<file path="${rel}">\n${content}\n</file>` : "";
  }).join("");

  return `You are running NDI's GP-01 Onboarding and Offboarding Assistant, invoked from a web console rather than a chat window.

${body}
${refs}

## Running from the web console

You are in parameterised mode: the form has already supplied the details, so execute
without asking anything. There is no one to answer a question — a clarifying question
stalls the run.

**Skip the settings document entirely.** The section above tells you to find or create a
GP-01 settings document in Drive. That is for chat. The console supplies every setting
through the form and the environment constants, so searching Drive wastes a step and
creating a document is worse — it writes a file nobody asked for and burns output the run
needs to finish. Go straight to the first real provisioning step.

**Be terse.** Every token spent narrating is one not available for the rest of the run, and
a run that stops early leaves a half-provisioned person. One short line per step.

Narrate as you go, one line per step, each on its own line, prefixed so the console can
parse it:

  STEP  <what you are doing now>
  DONE  <what completed> :: <optional URL to the artefact>
  FAIL  <what failed and why>
  STAGED <system> :: <resource> :: <owner> :: <reason>
  ASSUME <assumption you made>

End with a line: SUMMARY <verified count> verified, <staged count> staged, ref <run ref>

Use those prefixes exactly. Everything else you write is shown as commentary.`;
}
