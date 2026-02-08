/**
 * Job State Database - SQLite-based persistent state for Codex/Gemini background jobs
 *
 * Provides a single shared database at .omd/state/jobs.db for both providers.
 * Uses better-sqlite3 with WAL mode for safe concurrent access from multiple
 * MCP server instances. Only job metadata is stored here; prompt/response
 * content remains as files on disk.
 *
 * Follows the same patterns as src/hooks/swarm/state.ts:
 * - Dynamic import of better-sqlite3 with graceful fallback
 * - WAL mode for concurrency
 * - Schema versioning with migrations
 * - Module-level singleton db variable
 * - All functions return false/null on failure (no throws)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type BetterSqlite3 from "better-sqlite3";
import type { JobStatus } from "./prompt-persistence.js";

// Schema version - bump when adding migrations
const DB_SCHEMA_VERSION = 1;

// Default max age for cleanup: 24 hours
const DEFAULT_CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Type alias for the Database constructor
type DatabaseConstructor = typeof BetterSqlite3;

// Dynamic import for better-sqlite3 to handle environments where it's not installed
let Database: DatabaseConstructor | null = null;
let db: BetterSqlite3.Database | null = null;

/**
 * Get the database file path
 */
function getDbPath(cwd: string): string {
  return join(cwd, ".omd", "state", "jobs.db");
}

/**
 * Ensure the state directory exists
 */
function ensureStateDir(cwd: string): void {
  const stateDir = join(cwd, ".omd", "state");
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }
}

/**
 * Map a database row (snake_case) to a JobStatus object (camelCase)
 */
function rowToJobStatus(row: Record<string, unknown>): JobStatus {
  return {
    provider: row.provider as "codex" | "gemini",
    jobId: row.job_id as string,
    slug: row.slug as string,
    status: row.status as JobStatus["status"],
    pid: (row.pid as number) ?? undefined,
    promptFile: row.prompt_file as string,
    responseFile: row.response_file as string,
    model: row.model as string,
    agentRole: row.agent_role as string,
    spawnedAt: row.spawned_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
    error: (row.error as string) ?? undefined,
    usedFallback: row.used_fallback === 1 ? true : undefined,
    fallbackModel: (row.fallback_model as string) ?? undefined,
    killedByUser: row.killed_by_user === 1 ? true : undefined,
  };
}

// --- DB Lifecycle ---

/**
 * Initialize the SQLite job state database.
 * Creates the database file and tables if they don't exist.
 * Uses WAL mode for safe concurrent access from multiple processes.
 *
 * @param cwd - The project working directory (worktree root)
 * @returns true if initialization succeeded, false on failure
 */
export async function initJobDb(cwd: string): Promise<boolean> {
  try {
    // Dynamic import of better-sqlite3 (may not be installed)
    if (!Database) {
      try {
        const betterSqlite3 = await import("better-sqlite3");
        Database = betterSqlite3.default;
      } catch (importError: unknown) {
        const errorMessage =
          importError instanceof Error
            ? importError.message
            : String(importError);
        console.error(
          "[job-state-db] Failed to load better-sqlite3:",
          errorMessage,
        );
        console.error(
          "[job-state-db] Install with: npm install better-sqlite3",
        );
        return false;
      }
    }

    if (!Database) {
      return false;
    }

    ensureStateDir(cwd);
    const dbPath = getDbPath(cwd);

    db = new Database(dbPath);

    // Enable WAL mode for better concurrency (multiple MCP servers)
    db.pragma("journal_mode = WAL");

    // Create tables
    db.exec(`
      -- Schema version tracking
      CREATE TABLE IF NOT EXISTS schema_info (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Job metadata for Codex/Gemini background jobs
      CREATE TABLE IF NOT EXISTS jobs (
        job_id TEXT NOT NULL,
        provider TEXT NOT NULL CHECK (provider IN ('codex', 'gemini')),
        slug TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'spawned' CHECK (status IN ('spawned', 'running', 'completed', 'failed', 'timeout')),
        pid INTEGER,
        prompt_file TEXT NOT NULL,
        response_file TEXT NOT NULL,
        model TEXT NOT NULL,
        agent_role TEXT NOT NULL,
        spawned_at TEXT NOT NULL,
        completed_at TEXT,
        error TEXT,
        used_fallback INTEGER DEFAULT 0,
        fallback_model TEXT,
        killed_by_user INTEGER DEFAULT 0,
        PRIMARY KEY (provider, job_id)
      );

      -- Indexes for common query patterns
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_provider ON jobs(provider);
      CREATE INDEX IF NOT EXISTS idx_jobs_spawned_at ON jobs(spawned_at);
      CREATE INDEX IF NOT EXISTS idx_jobs_provider_status ON jobs(provider, status);
    `);

    // Check current schema version for future migrations
    const versionStmt = db.prepare(
      "SELECT value FROM schema_info WHERE key = 'version'",
    );
    const versionRow = versionStmt.get() as { value: string } | undefined;
    const _currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;

    // Future migrations would go here:
    // if (_currentVersion > 0 && _currentVersion < 2) { ... }

    // Set schema version
    const setVersion = db.prepare(
      "INSERT OR REPLACE INTO schema_info (key, value) VALUES (?, ?)",
    );
    setVersion.run("version", String(DB_SCHEMA_VERSION));

    return true;
  } catch (error) {
    console.error("[job-state-db] Failed to initialize database:", error);
    return false;
  }
}

/**
 * Close the database connection.
 * Safe to call multiple times; no-ops if already closed.
 */
export function closeJobDb(): void {
  if (db) {
    try {
      db.close();
    } catch {
      // Ignore close errors (already closed, etc.)
    }
    db = null;
  }
}

/**
 * Check if the job database is initialized and connected.
 *
 * @returns true if the database is ready for queries
 */
export function isJobDbInitialized(): boolean {
  return db !== null;
}

/**
 * Get the raw database instance for advanced use.
 *
 * @returns The better-sqlite3 Database instance, or null if not initialized
 */
export function getJobDb(): BetterSqlite3.Database | null {
  return db;
}

// --- CRUD Operations ---

/**
 * Insert or update a job record from a JobStatus object.
 * Maps camelCase JobStatus fields to snake_case database columns.
 * Uses INSERT OR REPLACE (upsert on the composite primary key).
 *
 * @param status - The JobStatus to persist
 * @returns true if the upsert succeeded, false on failure
 */
export function upsertJob(status: JobStatus): boolean {
  if (!db) return false;

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO jobs (
        job_id, provider, slug, status, pid,
        prompt_file, response_file, model, agent_role,
        spawned_at, completed_at, error,
        used_fallback, fallback_model, killed_by_user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      status.jobId,
      status.provider,
      status.slug,
      status.status,
      status.pid ?? null,
      status.promptFile,
      status.responseFile,
      status.model,
      status.agentRole,
      status.spawnedAt,
      status.completedAt ?? null,
      status.error ?? null,
      status.usedFallback ? 1 : 0,
      status.fallbackModel ?? null,
      status.killedByUser ? 1 : 0,
    );

    return true;
  } catch (error) {
    console.error("[job-state-db] Failed to upsert job:", error);
    return false;
  }
}

/**
 * Get a single job by provider and job ID.
 *
 * @param provider - The provider ('codex' or 'gemini')
 * @param jobId - The unique job identifier
 * @returns The JobStatus if found, null otherwise
 */
export function getJob(
  provider: "codex" | "gemini",
  jobId: string,
): JobStatus | null {
  if (!db) return null;

  try {
    const stmt = db.prepare(
      "SELECT * FROM jobs WHERE provider = ? AND job_id = ?",
    );
    const row = stmt.get(provider, jobId) as
      | Record<string, unknown>
      | undefined;

    if (!row) return null;
    return rowToJobStatus(row);
  } catch (error) {
    console.error("[job-state-db] Failed to get job:", error);
    return null;
  }
}

/**
 * Get jobs filtered by provider and/or status.
 *
 * @param provider - Filter by provider, or undefined for all providers
 * @param status - Filter by status string
 * @returns Array of matching JobStatus objects, empty array on failure
 */
export function getJobsByStatus(
  provider: "codex" | "gemini" | undefined,
  status: string,
): JobStatus[] {
  if (!db) return [];

  try {
    let stmt;
    let rows: Record<string, unknown>[];

    if (provider) {
      stmt = db.prepare(
        "SELECT * FROM jobs WHERE provider = ? AND status = ? ORDER BY spawned_at DESC",
      );
      rows = stmt.all(provider, status) as Record<string, unknown>[];
    } else {
      stmt = db.prepare(
        "SELECT * FROM jobs WHERE status = ? ORDER BY spawned_at DESC",
      );
      rows = stmt.all(status) as Record<string, unknown>[];
    }

    return rows.map(rowToJobStatus);
  } catch (error) {
    console.error("[job-state-db] Failed to get jobs by status:", error);
    return [];
  }
}

/**
 * Get all active (spawned or running) jobs, optionally filtered by provider.
 *
 * @param provider - Filter by provider, or undefined for all providers
 * @returns Array of active JobStatus objects, empty array on failure
 */
export function getActiveJobs(provider?: "codex" | "gemini"): JobStatus[] {
  if (!db) return [];

  try {
    let stmt;
    let rows: Record<string, unknown>[];

    if (provider) {
      stmt = db.prepare(
        "SELECT * FROM jobs WHERE provider = ? AND status IN ('spawned', 'running') ORDER BY spawned_at DESC",
      );
      rows = stmt.all(provider) as Record<string, unknown>[];
    } else {
      stmt = db.prepare(
        "SELECT * FROM jobs WHERE status IN ('spawned', 'running') ORDER BY spawned_at DESC",
      );
      rows = stmt.all() as Record<string, unknown>[];
    }

    return rows.map(rowToJobStatus);
  } catch (error) {
    console.error("[job-state-db] Failed to get active jobs:", error);
    return [];
  }
}

/**
 * Get recent jobs within a time window, optionally filtered by provider.
 * Compares spawned_at ISO strings against a cutoff timestamp.
 *
 * @param provider - Filter by provider, or undefined for all providers
 * @param withinMs - Time window in milliseconds (default: 1 hour)
 * @returns Array of recent JobStatus objects, empty array on failure
 */
export function getRecentJobs(
  provider?: "codex" | "gemini",
  withinMs: number = 60 * 60 * 1000,
): JobStatus[] {
  if (!db) return [];

  try {
    const cutoff = new Date(Date.now() - withinMs).toISOString();
    let stmt;
    let rows: Record<string, unknown>[];

    if (provider) {
      stmt = db.prepare(
        "SELECT * FROM jobs WHERE provider = ? AND spawned_at > ? ORDER BY spawned_at DESC",
      );
      rows = stmt.all(provider, cutoff) as Record<string, unknown>[];
    } else {
      stmt = db.prepare(
        "SELECT * FROM jobs WHERE spawned_at > ? ORDER BY spawned_at DESC",
      );
      rows = stmt.all(cutoff) as Record<string, unknown>[];
    }

    return rows.map(rowToJobStatus);
  } catch (error) {
    console.error("[job-state-db] Failed to get recent jobs:", error);
    return [];
  }
}

/**
 * Partially update a job's fields. Only provided fields are updated;
 * omitted fields are left unchanged.
 *
 * @param provider - The provider ('codex' or 'gemini')
 * @param jobId - The unique job identifier
 * @param updates - Partial JobStatus with fields to update
 * @returns true if the update succeeded, false on failure
 */
export function updateJobStatus(
  provider: "codex" | "gemini",
  jobId: string,
  updates: Partial<JobStatus>,
): boolean {
  if (!db) return false;

  try {
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.status !== undefined) {
      setClauses.push("status = ?");
      values.push(updates.status);
    }
    if (updates.pid !== undefined) {
      setClauses.push("pid = ?");
      values.push(updates.pid ?? null);
    }
    if (updates.completedAt !== undefined) {
      setClauses.push("completed_at = ?");
      values.push(updates.completedAt ?? null);
    }
    if (updates.error !== undefined) {
      setClauses.push("error = ?");
      values.push(updates.error ?? null);
    }
    if (updates.usedFallback !== undefined) {
      setClauses.push("used_fallback = ?");
      values.push(updates.usedFallback ? 1 : 0);
    }
    if (updates.fallbackModel !== undefined) {
      setClauses.push("fallback_model = ?");
      values.push(updates.fallbackModel ?? null);
    }
    if (updates.killedByUser !== undefined) {
      setClauses.push("killed_by_user = ?");
      values.push(updates.killedByUser ? 1 : 0);
    }
    if (updates.slug !== undefined) {
      setClauses.push("slug = ?");
      values.push(updates.slug);
    }
    if (updates.model !== undefined) {
      setClauses.push("model = ?");
      values.push(updates.model);
    }
    if (updates.agentRole !== undefined) {
      setClauses.push("agent_role = ?");
      values.push(updates.agentRole);
    }

    // Nothing to update
    if (setClauses.length === 0) return true;

    values.push(provider, jobId);
    const stmt = db.prepare(
      `UPDATE jobs SET ${setClauses.join(", ")} WHERE provider = ? AND job_id = ?`,
    );
    stmt.run(...values);
    return true;
  } catch (error) {
    console.error("[job-state-db] Failed to update job status:", error);
    return false;
  }
}

/**
 * Delete a job record by provider and job ID.
 *
 * @param provider - The provider ('codex' or 'gemini')
 * @param jobId - The unique job identifier
 * @returns true if deletion succeeded, false on failure
 */
export function deleteJob(
  provider: "codex" | "gemini",
  jobId: string,
): boolean {
  if (!db) return false;

  try {
    const stmt = db.prepare(
      "DELETE FROM jobs WHERE provider = ? AND job_id = ?",
    );
    stmt.run(provider, jobId);
    return true;
  } catch (error) {
    console.error("[job-state-db] Failed to delete job:", error);
    return false;
  }
}

// --- Migration ---

/**
 * Migrate existing JSON status files into the SQLite database.
 * Scans the prompts directory for *-status-*.json files, parses each,
 * and upserts into the jobs table. Existing records are overwritten.
 *
 * @param promptsDir - Path to the .omd/prompts/ directory
 * @returns Object with imported and error counts
 */
export function migrateFromJsonFiles(promptsDir: string): {
  imported: number;
  errors: number;
} {
  const result = { imported: 0, errors: 0 };

  if (!db) return result;
  if (!existsSync(promptsDir)) return result;

  try {
    const files = readdirSync(promptsDir);
    const statusFiles = files.filter(
      (f: string) => f.includes("-status-") && f.endsWith(".json"),
    );

    // Use a transaction for bulk import efficiency
    const importAll = db.transaction(() => {
      for (const file of statusFiles) {
        try {
          const content = readFileSync(join(promptsDir, file), "utf-8");
          const status = JSON.parse(content) as JobStatus;

          // Validate minimum required fields
          if (!status.provider || !status.jobId || !status.promptFile) {
            result.errors++;
            continue;
          }

          if (upsertJob(status)) {
            result.imported++;
          } else {
            result.errors++;
          }
        } catch {
          result.errors++;
        }
      }
    });

    importAll();
  } catch (error) {
    console.error("[job-state-db] Failed to migrate from JSON files:", error);
  }

  return result;
}

// --- Cleanup ---

/**
 * Delete completed/failed/timeout jobs older than the specified age.
 * Only removes terminal-state jobs; active jobs are never cleaned up.
 *
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @returns Number of jobs deleted, 0 on failure
 */
export function cleanupOldJobs(
  maxAgeMs: number = DEFAULT_CLEANUP_MAX_AGE_MS,
): number {
  if (!db) return 0;

  try {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const stmt = db.prepare(`
      DELETE FROM jobs
      WHERE status IN ('completed', 'failed', 'timeout')
        AND spawned_at < ?
    `);
    const info = stmt.run(cutoff);
    return info.changes;
  } catch (error) {
    console.error("[job-state-db] Failed to cleanup old jobs:", error);
    return 0;
  }
}

// --- Stats ---

/**
 * Get aggregate job statistics for monitoring and diagnostics.
 *
 * @returns Object with total, active, completed, and failed counts, or null on failure
 */
export function getJobStats(): {
  total: number;
  active: number;
  completed: number;
  failed: number;
} | null {
  if (!db) return null;

  try {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('spawned', 'running') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status IN ('failed', 'timeout') THEN 1 ELSE 0 END) as failed
      FROM jobs
    `);
    const row = stmt.get() as {
      total: number;
      active: number;
      completed: number;
      failed: number;
    };

    return {
      total: row.total ?? 0,
      active: row.active ?? 0,
      completed: row.completed ?? 0,
      failed: row.failed ?? 0,
    };
  } catch (error) {
    console.error("[job-state-db] Failed to get job stats:", error);
    return null;
  }
}

/**
 * Generate a markdown summary of job state for PreCompact system message injection.
 * Includes active jobs with details and a brief summary of recent completed jobs.
 *
 * @returns Formatted markdown string, or empty string on failure
 */
export function getJobSummaryForPreCompact(): string {
  if (!db) return "";

  try {
    const lines: string[] = [];

    // Active jobs with full details
    const activeJobs = getActiveJobs();
    if (activeJobs.length > 0) {
      lines.push("## Active Background Jobs");
      lines.push("");
      for (const job of activeJobs) {
        const elapsed = Date.now() - new Date(job.spawnedAt).getTime();
        const elapsedMin = Math.round(elapsed / 60000);
        lines.push(
          `- **${job.provider}** \`${job.jobId}\` (${job.agentRole}, ${job.model}): ${job.status} for ${elapsedMin}m`,
        );
        lines.push(`  - Prompt: \`${job.promptFile}\``);
        lines.push(`  - Response: \`${job.responseFile}\``);
        if (job.pid) {
          lines.push(`  - PID: ${job.pid}`);
        }
      }
      lines.push("");
    }

    // Recent completed/failed jobs (last hour) - brief summary
    const recentJobs = getRecentJobs(undefined, 60 * 60 * 1000);
    const terminalJobs = recentJobs.filter(
      (j) =>
        j.status === "completed" ||
        j.status === "failed" ||
        j.status === "timeout",
    );

    if (terminalJobs.length > 0) {
      lines.push("## Recent Completed Jobs (last hour)");
      lines.push("");
      for (const job of terminalJobs.slice(0, 10)) {
        const icon = job.status === "completed" ? "done" : job.status;
        const fallback = job.usedFallback
          ? ` (fallback: ${job.fallbackModel})`
          : "";
        const errorNote = job.error
          ? ` - error: ${job.error.slice(0, 80)}`
          : "";
        lines.push(
          `- **${job.provider}** \`${job.jobId}\` (${job.agentRole}): ${icon}${fallback}${errorNote}`,
        );
      }
      if (terminalJobs.length > 10) {
        lines.push(`- ... and ${terminalJobs.length - 10} more`);
      }
      lines.push("");
    }

    // Overall stats
    const stats = getJobStats();
    if (stats && stats.total > 0) {
      lines.push(
        `**Job totals:** ${stats.total} total, ${stats.active} active, ${stats.completed} completed, ${stats.failed} failed`,
      );
    }

    return lines.join("\n");
  } catch (error) {
    console.error(
      "[job-state-db] Failed to generate PreCompact summary:",
      error,
    );
    return "";
  }
}
