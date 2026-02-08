/**
 * OMD HUD - Stdin Parser
 *
 * Parse stdin JSON from Droid statusline interface.
 * Based on droid-hud reference implementation.
 */
import type { StatuslineStdin } from './types.js';
/**
 * Read and parse stdin JSON from Droid.
 * Returns null if stdin is not available or invalid.
 */
export declare function readStdin(): Promise<StatuslineStdin | null>;
/**
 * Get context window usage percentage.
 * Prefers native percentage from Droid v2.1.6+, falls back to manual calculation.
 */
export declare function getContextPercent(stdin: StatuslineStdin): number;
/**
 * Get model display name from stdin.
 */
export declare function getModelName(stdin: StatuslineStdin): string;
//# sourceMappingURL=stdin.d.ts.map