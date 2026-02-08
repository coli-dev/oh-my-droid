/**
 * OMD HUD - State Management
 *
 * Manages HUD state file for background task tracking.
 * Follows patterns from ultrawork-state.
 */
import type { OmdHudState, BackgroundTask, HudConfig } from './types.js';
/**
 * Read HUD state from disk (checks new local and legacy local only)
 */
export declare function readHudState(directory?: string): OmdHudState | null;
/**
 * Write HUD state to disk (local only)
 */
export declare function writeHudState(state: OmdHudState, directory?: string): boolean;
/**
 * Create a new empty HUD state
 */
export declare function createEmptyHudState(): OmdHudState;
/**
 * Get running background tasks from state
 */
export declare function getRunningTasks(state: OmdHudState | null): BackgroundTask[];
/**
 * Get background task count string (e.g., "3/5")
 */
export declare function getBackgroundTaskCount(state: OmdHudState | null): {
    running: number;
    max: number;
};
/**
 * Read HUD configuration from disk.
 * Priority: settings.json > hud-config.json (legacy) > defaults
 */
export declare function readHudConfig(): HudConfig;
/**
 * Write HUD configuration to ~/.factory/settings.json (omdHud key)
 */
export declare function writeHudConfig(config: HudConfig): boolean;
/**
 * Apply a preset to the configuration
 */
export declare function applyPreset(preset: HudConfig['preset']): HudConfig;
/**
 * Initialize HUD state with cleanup of stale/orphaned tasks.
 * Should be called on HUD startup.
 */
export declare function initializeHUDState(): Promise<void>;
//# sourceMappingURL=state.d.ts.map