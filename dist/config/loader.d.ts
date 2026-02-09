/**
 * Configuration Loader
 *
 * Handles loading and merging configuration from multiple sources:
 * - User config: ~/.config/droid-sisyphus/config.jsonc
 * - Project config: .factory/sisyphus.jsonc
 * - Environment variables
 */
import type { PluginConfig } from "../shared/types.js";
/**
 * Default configuration
 */
export declare const DEFAULT_CONFIG: PluginConfig;
/**
 * Configuration file locations
 */
export declare function getConfigPaths(): {
    user: string;
    project: string;
};
/**
 * Load and parse a JSONC file
 */
export declare function loadJsoncFile(path: string): PluginConfig | null;
/**
 * Deep merge two objects
 */
export declare function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T;
/**
 * Load configuration from environment variables
 */
export declare function loadEnvConfig(): Partial<PluginConfig>;
/**
 * Load and merge all configuration sources
 */
export declare function loadConfig(): PluginConfig;
/**
 * Find and load AGENTS.md or AGENTS.md files for context injection
 */
export declare function findContextFiles(startDir?: string): string[];
/**
 * Load context from AGENTS.md/AGENTS.md files
 */
export declare function loadContextFromFiles(files: string[]): string;
/**
 * Generate JSON Schema for configuration (for editor autocomplete)
 */
export declare function generateConfigSchema(): object;
//# sourceMappingURL=loader.d.ts.map