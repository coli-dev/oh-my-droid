/**
 * OMD HUD - Transcript Parser
 *
 * Parse JSONL transcript from Droid to extract droids and todos.
 * Based on droid-hud reference implementation.
 *
 * Performance optimizations:
 * - Tail-based parsing: reads only the last ~500KB of large transcripts
 * - Bounded agent map: caps at 50 droids during parsing
 * - Early termination: stops when enough running droids found
 */
import type { TranscriptData, ActiveAgent, TodoItem } from "./types.js";
/**
 * Parse a Droid transcript JSONL file.
 * Extracts running droids and latest todo list.
 *
 * For large files (>500KB), only parses the tail portion for performance.
 */
export interface ParseTranscriptOptions {
    staleTaskThresholdMinutes?: number;
}
export declare function parseTranscript(transcriptPath: string | undefined, options?: ParseTranscriptOptions): Promise<TranscriptData>;
/**
 * Get count of running droids
 */
export declare function getRunningAgentCount(droids: ActiveAgent[]): number;
/**
 * Get todo completion stats
 */
export declare function getTodoStats(todos: TodoItem[]): {
    completed: number;
    total: number;
    inProgress: number;
};
//# sourceMappingURL=transcript.d.ts.map