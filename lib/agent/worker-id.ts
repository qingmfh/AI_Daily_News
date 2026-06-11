import { randomUUID } from 'crypto';

const WORKER_ID_ENV = 'AI_DAILY_AGENT_WORKER_ID';

export function getWorkerId(): string {
  if (!process.env[WORKER_ID_ENV]) {
    process.env[WORKER_ID_ENV] = randomUUID();
  }

  return process.env[WORKER_ID_ENV];
}
