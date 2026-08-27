'use client';

import type { Action } from '@/lib/types';

const OPTIONS: { value: Action; title: string; body: string }[] = [
  {
    value: 'onboard',
    title: 'Onboard a joiner',
    body: 'Creates the BambooHR record and Google Workspace account, sends the sign-in and welcome emails, and posts the Slack welcome.',
  },
  {
    value: 'offboard',
    title: 'Offboard a leaver',
    body: 'Suspends the account, marks them Terminated in BambooHR, sends the farewell, posts to Slack and removes the channels it can reach.',
  },
];

export default function ActionStep({
  value,
  onChange,
  onNext,
}: {
  value: Action;
  onChange: (a: Action) => void;
  onNext: () => void;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10">
      <h1 className="text-xl font-semibold text-slate-900">What do you want to run?</h1>
      <p className="mt-1 text-sm text-slate-600">
        This console runs the GP-01 skill itself — the same instructions that run in Claude.
        It does not re-implement any provisioning step.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg border p-4 text-left transition ${
              value === o.value
                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className="block text-sm font-semibold text-slate-900">{o.title}</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-600">{o.body}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
