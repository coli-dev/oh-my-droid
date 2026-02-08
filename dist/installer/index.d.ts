/**
 * Installer Module
 *
 * Handles installation of OMD agents, commands, and configuration
 * into the Droid config directory (~/.factory/).
 *
 * Cross-platform support via Node.js-based hook scripts (.mjs).
 * Bash hook scripts were removed in v3.9.0.
 */
/** Droid configuration directory */
export declare const DROID_CONFIG_DIR: string;
export declare const AGENTS_DIR: string;
export declare const COMMANDS_DIR: string;
export declare const SKILLS_DIR: string;
export declare const HOOKS_DIR: string;
export declare const HUD_DIR: string;
export declare const SETTINGS_FILE: string;
export declare const VERSION_FILE: string;
/**
 * Core commands - DISABLED for v3.0+
 * All commands are now plugin-scoped skills managed by Droid.
 * The installer no longer copies commands to ~/.factory/commands/
 */
export declare const CORE_COMMANDS: string[];
/** Current version */
export declare const VERSION = "0.0.1";
/** Installation result */
export interface InstallResult {
    success: boolean;
    message: string;
    installedAgents: string[];
    installedCommands: string[];
    installedSkills: string[];
    hooksConfigured: boolean;
    hookConflicts: Array<{
        eventType: string;
        existingCommand: string;
    }>;
    errors: string[];
}
/** Installation options */
export interface InstallOptions {
    force?: boolean;
    verbose?: boolean;
    skipDroidCheck?: boolean;
    forceHooks?: boolean;
}
/**
 * Detect whether a hook command belongs to oh-my-droid.
 *
 * Uses substring matching rather than word-boundary regex.
 * Rationale: Real OMD hooks use compound names where "omd" is embedded
 * (e.g., `omd-pre-tool-use.mjs`, `oh-my-droid-hook.mjs`). A word-boundary
 * regex like /\bomd\b/ would fail to match "oh-my-droid" since "omd" appears
 * as an interior substring. The theoretical false positives (words containing "omd"
 * like "atomic", "socom") are extremely unlikely in real hook command paths.
 *
 * @param command - The hook command string
 * @returns true if the command contains 'omd' or 'oh-my-droid'
 */
export declare function isOmcHook(command: string): boolean;
/**
 * Check if the current Node.js version meets the minimum requirement
 */
export declare function checkNodeVersion(): {
    valid: boolean;
    current: number;
    required: number;
};
/**
 * Check if Droid is installed
 * Uses 'where' on Windows, 'which' on Unix
 */
export declare function isDroidInstalled(): boolean;
/**
 * Check if we're running in Droid plugin context
 *
 * When installed as a plugin, we should NOT copy files to ~/.factory/
 * because the plugin system already handles file access via ${DROID_PLUGIN_ROOT}.
 *
 * Detection method:
 * - Check if DROID_PLUGIN_ROOT environment variable is set (primary method)
 * - This env var is set by the Droid plugin system when running plugin hooks
 *
 * @returns true if running in plugin context, false otherwise
 */
export declare function isRunningAsPlugin(): boolean;
/**
 * Check if we're running as a project-scoped plugin (not global)
 *
 * Project-scoped plugins are installed in the project's .factory/plugins/ directory,
 * while global plugins are installed in ~/.factory/plugins/.
 *
 * When project-scoped, we should NOT modify global settings (like ~/.factory/settings.json)
 * because the user explicitly chose project-level installation.
 *
 * @returns true if running as a project-scoped plugin, false otherwise
 */
export declare function isProjectScopedPlugin(): boolean;
/**
 * Merge OMD content into existing AGENTS.md using markers
 * @param existingContent - Existing AGENTS.md content (null if file doesn't exist)
 * @param omdContent - New OMD content to inject
 * @returns Merged content with markers
 */
export declare function mergeDroidMd(existingContent: string | null, omdContent: string, version?: string): string;
/**
 * Install OMD agents, commands, skills, and hooks
 */
export declare function install(options?: InstallOptions): InstallResult;
/**
 * Check if OMD is already installed
 */
export declare function isInstalled(): boolean;
/**
 * Get installation info
 */
export declare function getInstallInfo(): {
    version: string;
    installedAt: string;
    method: string;
} | null;
//# sourceMappingURL=index.d.ts.map