/** Everything a test creates carries this tag, so it can be told apart and cleaned. */
export const RUN_TAG = `E2e-${Date.now().toString(36)}`;

let sequence = 0;

/** "E2e-lx3k9 Patient 1-1": unique within the run, readable in the dashboard. */
export function uniqueName(label: string): string {
  sequence += 1;
  return `${RUN_TAG} ${label} ${process.pid % 1000}-${sequence}`;
}

/** A Saudi mobile number (5XXXXXXXX) not likely to collide with real ones. */
export function uniquePhone(): string {
  return `5${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
}
