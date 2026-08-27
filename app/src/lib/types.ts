export type Action = 'onboard' | 'offboard';

export type Tag = 'STEP' | 'DONE' | 'FAIL' | 'STAGED' | 'ASSUME' | 'TEXT';

export type Line = {
  tag: Tag;
  text: string;
  /** Link to the artefact this line produced, when there is one. */
  href?: string;
};

export type Summary = {
  verified: number;
  staged: number;
  ref: string;
};

export type JoinerInput = {
  firstName: string;
  lastName: string;
  role: string;
  managerEmail: string;
  startDate: string;
  personalEmail: string;
};

/**
 * The work email is the whole input. The last working day and everything else
 * come from BambooHR — asking for them here only invites a value that disagrees
 * with the HR record.
 */
export type LeaverInput = {
  workEmail: string;
};

export type RunConfig = {
  action: Action;
  joiner: JoinerInput;
  leaver: LeaverInput;
};

export const ROLES = [
  'AI Engineer',
  'Solution Architect',
  'Marketing Analyst',
  'Delivery Lead',
] as const;

export const DEFAULT_MANAGER = 'helmi.lakhder@new-digital-intelligence.com';
