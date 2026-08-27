'use client';

import { useCallback, useState } from 'react';
import Stepper from './Stepper';
import ActionStep from './ActionStep';
import DetailsStep from './DetailsStep';
import ReviewStep from './ReviewStep';
import RunStep from './RunStep';
import {
  DEFAULT_MANAGER,
  ROLES,
  type Action,
  type JoinerInput,
  type LeaverInput,
  type Line,
  type Summary,
  type Tag,
} from '@/lib/types';

const EMPTY_JOINER: JoinerInput = {
  firstName: '',
  lastName: '',
  role: ROLES[0],
  managerEmail: DEFAULT_MANAGER,
  startDate: '',
  personalEmail: '',
};

const EMPTY_LEAVER: LeaverInput = { workEmail: '' };

/**
 * Claude does not reliably put a newline between one tagged line and the next, so a
 * DONE arrives glued to the tail of the STEP before it. Splitting on \n alone loses
 * every such line into the previous one's text — the tag counters read 0 and the
 * SUMMARY never matches. Break before a tag token that starts mid-line.
 */
const TAG_BOUNDARY = /(?<=\S)[ \t]*(?=(?:STEP|DONE|FAIL|STAGED|ASSUME|SUMMARY)\s)/g;

function splitTags(text: string): string {
  return text.replace(TAG_BOUNDARY, '\n');
}

function parseLine(raw: string): Line {
  const m = raw.match(/^(STEP|DONE|FAIL|STAGED|ASSUME)\s+(.*)$/);
  if (!m) return { tag: 'TEXT', text: raw };
  const tag = m[1] as Tag;
  let text = m[2];
  let href: string | undefined;
  const link = text.split(' :: ').find((p) => p.trim().startsWith('http'));
  if (link) {
    href = link.trim();
    text = text.replace(` :: ${link}`, '');
  }
  return { tag, text, href };
}

function buildPrompt(action: Action, joiner: JoinerInput, leaver: LeaverInput): string {
  if (action === 'onboard') {
    return [
      'Onboard a new joiner.',
      `Name: ${joiner.firstName} ${joiner.lastName}`,
      `Role: ${joiner.role}`,
      joiner.managerEmail && `Manager: ${joiner.managerEmail}`,
      joiner.startDate && `Start date: ${joiner.startDate}`,
      joiner.personalEmail && `Personal email: ${joiner.personalEmail}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
  return `Offboard ${leaver.workEmail}`;
}

export default function ProvisioningWizard() {
  const [step, setStep] = useState(0);
  const [action, setAction] = useState<Action>('onboard');
  const [joiner, setJoiner] = useState<JoinerInput>(EMPTY_JOINER);
  const [leaver, setLeaver] = useState<LeaverInput>(EMPTY_LEAVER);
  const [lines, setLines] = useState<Line[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setStep(3);
    setRunning(true);
    setLines([]);
    setSummary(null);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(action, joiner, leaver) }),
      });

      if (!res.ok || !res.body) {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        setLines([{ tag: 'FAIL', text: error ?? 'The run could not start.' }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let partial = '';

      const flush = (text: string) => {
        // Tolerant on purpose: an exact-wording match drops the entire summary
        // whenever Claude phrases the line slightly differently.
        const sum = text.match(/^SUMMARY\D*(\d+)\D+?(\d+)\D+?ref\s+(\S.*)$/i);
        if (sum) setSummary({ verified: +sum[1], staged: +sum[2], ref: sum[3] });
        else setLines((prev) => [...prev, parseLine(text)]);
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // The route re-emits plain text chunks, one per SSE `data:` line.
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const dataLine = evt.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          const raw = dataLine.slice(6);
          if (raw === '[DONE]') continue;

          let chunk: string;
          try {
            const payload = JSON.parse(raw) as { text?: string; error?: string };
            if (payload.error) {
              setLines((prev) => [...prev, { tag: 'FAIL', text: payload.error! }]);
              continue;
            }
            chunk = payload.text ?? '';
          } catch {
            continue;
          }
          if (!chunk) continue;

          partial += chunk;
          // An incomplete tag token at the tail simply does not match yet, so it
          // stays in `partial` and is broken out on a later pass.
          const complete = splitTags(partial).split('\n');
          partial = complete.pop() ?? '';
          for (const line of complete) {
            const text = line.trim();
            if (text) flush(text);
          }
        }
      }

      for (const line of splitTags(partial).split('\n')) {
        const text = line.trim();
        if (text) flush(text);
      }
    } catch (err) {
      setLines((prev) => [
        ...prev,
        {
          tag: 'FAIL',
          text: err instanceof Error ? err.message : 'The run stopped unexpectedly.',
        },
      ]);
    } finally {
      setRunning(false);
    }
  }, [action, joiner, leaver]);

  const restart = () => {
    setStep(0);
    setLines([]);
    setSummary(null);
  };

  return (
    <main className="flex-1">
      <Stepper current={step} />
      {step === 0 && (
        <ActionStep value={action} onChange={setAction} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <DetailsStep
          action={action}
          joiner={joiner}
          leaver={leaver}
          onJoiner={setJoiner}
          onLeaver={setLeaver}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <ReviewStep
          config={{ action, joiner, leaver }}
          onBack={() => setStep(1)}
          onRun={run}
        />
      )}
      {step === 3 && (
        <RunStep
          action={action}
          lines={lines}
          summary={summary}
          running={running}
          onRestart={restart}
        />
      )}
    </main>
  );
}
