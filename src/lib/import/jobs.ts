import { randomUUID } from "node:crypto";
import type { ImportCaches } from "./apply";
import type { ParsedImportFile, PreparedProduct } from "./types";

const JOB_TTL_MS = 60 * 60 * 1000;

export type ImportRuntime = {
  records: PreparedProduct[];
  caches: ImportCaches;
  offset: number;
  added: number;
  updated: number;
  runId: string;
  articleKeys: string[];
};

export type ImportJob = {
  id: string;
  fileName: string;
  buffer: Buffer;
  parsed: ParsedImportFile;
  createdAt: number;
  runtime: ImportRuntime | null;
};

const jobs = new Map<string, ImportJob>();

function pruneJobs(now = Date.now()) {
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }
}

export function createImportJob(
  fileName: string,
  buffer: Buffer,
  parsed: ParsedImportFile,
): ImportJob {
  pruneJobs();

  const job: ImportJob = {
    id: randomUUID(),
    fileName,
    buffer,
    parsed,
    createdAt: Date.now(),
    runtime: null,
  };

  jobs.set(job.id, job);
  return job;
}

export function getImportJob(id: string): ImportJob | null {
  pruneJobs();
  return jobs.get(id) ?? null;
}
