'use client';

import { ROLES, type Action, type JoinerInput, type LeaverInput } from '@/lib/types';

const field =
  'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600';
const label = 'block text-xs font-medium text-slate-700';

export default function DetailsStep({
  action,
  joiner,
  leaver,
  onJoiner,
  onLeaver,
  onBack,
  onNext,
}: {
  action: Action;
  joiner: JoinerInput;
  leaver: LeaverInput;
  onJoiner: (j: JoinerInput) => void;
  onLeaver: (l: LeaverInput) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const ready =
    action === 'onboard'
      ? Boolean(joiner.firstName && joiner.lastName && joiner.role)
      : Boolean(leaver.workEmail);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10">
      <h1 className="text-xl font-semibold text-slate-900">
        {action === 'onboard' ? 'Who is joining?' : 'Who is leaving?'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {action === 'onboard'
          ? 'Anything you leave blank is resolved by the skill and reported back under Assumptions.'
          : 'The work email is all that is needed. Everything else — including the last working day — is read from BambooHR and reported back under Assumptions.'}
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        {action === 'onboard' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="firstName">First name</label>
              <input
                id="firstName"
                className={field}
                value={joiner.firstName}
                onChange={(e) => onJoiner({ ...joiner, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                className={field}
                value={joiner.lastName}
                onChange={(e) => onJoiner({ ...joiner, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="role">Role</label>
              <select
                id="role"
                className={field}
                value={joiner.role}
                onChange={(e) => onJoiner({ ...joiner, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="startDate">Start date</label>
              <input
                id="startDate"
                type="date"
                className={field}
                value={joiner.startDate}
                onChange={(e) => onJoiner({ ...joiner, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="managerEmail">Manager</label>
              <input
                id="managerEmail"
                type="email"
                className={field}
                value={joiner.managerEmail}
                onChange={(e) => onJoiner({ ...joiner, managerEmail: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-500">
                Cc&rsquo;d on the welcome email once verified in the directory.
              </p>
            </div>
            <div>
              <label className={label} htmlFor="personalEmail">Personal email</label>
              <input
                id="personalEmail"
                type="email"
                className={field}
                value={joiner.personalEmail}
                onChange={(e) => onJoiner({ ...joiner, personalEmail: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-500">
                Where the temporary password goes. Never cc&rsquo;d.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <label className={label} htmlFor="workEmail">Work email of the leaver</label>
            <input
              id="workEmail"
              type="email"
              placeholder="name@new-digital-intelligence.com"
              className={field}
              value={leaver.workEmail}
              onChange={(e) => onLeaver({ workEmail: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!ready}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
