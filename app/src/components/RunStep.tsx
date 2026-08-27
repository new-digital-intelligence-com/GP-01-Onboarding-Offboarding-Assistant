'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Action, Line, Summary, Tag } from '@/lib/types';

const TAG_STYLE: Record<Tag, string> = {
  STEP: 'bg-slate-100 text-slate-600',
  DONE: 'bg-emerald-100 text-emerald-700',
  FAIL: 'bg-rose-100 text-rose-700',
  STAGED: 'bg-amber-100 text-amber-800',
  ASSUME: 'bg-indigo-100 text-indigo-700',
  TEXT: 'bg-transparent text-transparent',
};

/** Rows the eye should land on first: a failure, or something left for a human. */
const ROW_STYLE: Partial<Record<Tag, string>> = {
  FAIL: 'bg-rose-50',
  STAGED: 'bg-amber-50',
};

function mmss(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Counter tile — also the live progress readout while the run is still going. */
function Tile({
  value,
  label,
  tone,
}: {
  value: number | string;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function RunStep({
  action,
  lines,
  summary,
  running,
  onRestart,
}: {
  action: Action;
  lines: Line[];
  summary: Summary | null;
  running: boolean;
  onRestart: () => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [lines.length]);

  // Tick only while running, so a finished run keeps its final duration on screen.
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => clearInterval(id);
  }, [running]);

  const counts = useMemo(() => {
    const c = { DONE: 0, FAIL: 0, STAGED: 0 };
    for (const l of lines) if (l.tag in c) c[l.tag as keyof typeof c]++;
    return c;
  }, [lines]);

  // While streaming, the newest STEP is what the skill is doing right now.
  const current = running
    ? [...lines].reverse().find((l) => l.tag === 'STEP')?.text
    : undefined;

  const failed = counts.FAIL > 0;

  // The skill ends every complete run with a SUMMARY line. Reaching the end of the
  // stream without one means the run stopped early, which otherwise looks identical
  // to a clean finish.
  const truncated = !running && lines.length > 0 && !summary;

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {running
              ? `Running ${action}…`
              : lines.length
                ? failed
                  ? 'Run finished with failures'
                  : truncated
                    ? 'Run stopped early'
                    : 'Run complete'
                : 'Run'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {running
              ? 'Steps appear as the skill completes them. Closing this tab does not stop the run.'
              : failed
                ? 'Some steps did not complete — check the rows highlighted in red.'
                : truncated
                  ? 'The stream ended without a SUMMARY line, so the last step shown may not have finished. Anything after it did not run.'
                  : 'Nothing further is running.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              running
                ? 'bg-amber-100 text-amber-900'
                : failed
                  ? 'bg-rose-100 text-rose-800'
                  : truncated
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {running && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-600 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-700" />
              </span>
            )}
            {running ? 'LIVE' : failed ? 'FAILED' : truncated ? 'INCOMPLETE' : 'DONE'}
          </span>
          <span className="font-mono text-xs tabular-nums text-slate-500">
            {mmss(elapsed)}
          </span>
        </div>
      </div>

      {running && (
        <div className="mt-4 overflow-hidden rounded-full bg-slate-200">
          <div className="h-1 w-1/3 animate-pulse rounded-full bg-amber-600" />
        </div>
      )}

      {current && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-amber-600" />
          <span className="truncate text-sm text-slate-700">{current}</span>
        </div>
      )}

      <div className="mt-4 max-h-[28rem] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
        {lines.length === 0 && !running && (
          <p className="p-2 text-sm text-slate-500">Nothing yet.</p>
        )}
        {lines.length === 0 && running && (
          <p className="p-2 text-sm text-slate-500">Waiting for the first step…</p>
        )}
        {lines.map((l, i) => (
          <div
            key={i}
            className={`flex gap-3 rounded px-2 py-1.5 text-sm ${ROW_STYLE[l.tag] ?? ''}`}
          >
            <span
              className={`mt-0.5 h-fit w-16 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] uppercase ${TAG_STYLE[l.tag]}`}
            >
              {l.tag === 'TEXT' ? '' : l.tag}
            </span>
            <span className={l.tag === 'FAIL' ? 'text-rose-900' : 'text-slate-700'}>
              {l.text}
              {l.href && (
                <>
                  {' · '}
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline"
                  >
                    open
                  </a>
                </>
              )}
            </span>
          </div>
        ))}
        <div ref={end} />
      </div>

      {(running || lines.length > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile
            value={summary?.verified ?? counts.DONE}
            label={summary ? 'Verified' : 'Completed'}
            tone="text-emerald-600"
          />
          <Tile
            value={summary?.staged ?? counts.STAGED}
            label="Staged for IT Ops"
            tone="text-amber-700"
          />
          <Tile value={counts.FAIL} label="Failed" tone="text-rose-600" />
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="truncate font-mono text-sm font-semibold text-slate-800">
              {summary?.ref ?? '—'}
            </div>
            <div className="mt-1 text-xs text-slate-500">Run reference</div>
          </div>
        </div>
      )}

      {!running && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onRestart}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Start another run
          </button>
        </div>
      )}
    </section>
  );
}
