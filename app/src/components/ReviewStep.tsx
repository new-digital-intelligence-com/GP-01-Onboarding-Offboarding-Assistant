'use client';

import type { RunConfig } from '@/lib/types';

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs text-slate-500">{k}</span>
      <span className="text-right text-xs font-medium text-slate-800">{v || '—'}</span>
    </div>
  );
}

const EFFECTS: Record<RunConfig['action'], string[]> = {
  onboard: [
    'Creates a real Google Workspace account and sets its profile fields.',
    'Writes the effective-dated job rows into BambooHR.',
    'Sends real email to the personal address, cc the manager.',
  ],
  offboard: [
    'Suspends the Google Workspace account immediately.',
    'Marks the employee terminated in BambooHR.',
    'Sends a real farewell email and removes Slack channel memberships.',
  ],
};

export default function ReviewStep({
  config,
  onBack,
  onRun,
}: {
  config: RunConfig;
  onBack: () => void;
  onRun: () => void;
}) {
  const { action, joiner, leaver } = config;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10">
      <h1 className="text-xl font-semibold text-slate-900">Review before running</h1>
      <p className="mt-1 text-sm text-slate-600">
        The skill never asks for confirmation once it starts, so this is the last checkpoint.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          {action === 'onboard' ? 'Joiner' : 'Leaver'}
        </h2>
        <div className="mt-3">
          {action === 'onboard' ? (
            <>
              <Row k="Name" v={`${joiner.firstName} ${joiner.lastName}`.trim()} />
              <Row k="Role" v={joiner.role} />
              <Row k="Start date" v={joiner.startDate} />
              <Row k="Manager (cc)" v={joiner.managerEmail} />
              <Row k="Personal email" v={joiner.personalEmail} />
            </>
          ) : (
            <>
              <Row k="Work email" v={leaver.workEmail} />
              <Row k="Last working day" v="from BambooHR" />
            </>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-amber-300 bg-amber-50">
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100/70 px-4 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-600 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-700" />
          </span>
          <span className="text-sm font-semibold text-amber-900">
            Live run — every step is executed for real
          </span>
        </div>
        <ul className="space-y-1.5 px-4 py-3">
          {EFFECTS[action].map((e) => (
            <li key={e} className="flex gap-2 text-xs text-amber-900">
              <span aria-hidden className="select-none text-amber-700">
                &bull;
              </span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-amber-200 px-4 py-2.5 text-xs text-amber-800">
          There is no preview mode and no undo. Check the details above before you start.
        </p>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Back
        </button>
        <button
          onClick={onRun}
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          Run {action} for real
        </button>
      </div>
    </section>
  );
}
