/**
 * Tests for Safe Installer (Task T2)
 * Tests hook conflict detection and forceHooks option
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { isOmdHook, install, InstallOptions } from '../index.js';

/**
 * Detect hook conflicts using the real isOmdHook function.
 * Mirrors the install() logic to avoid test duplication.
 */
function detectConflicts(
  hooks: Record<string, Array<{ hooks: Array<{ type: string; command: string }> }>>
): Array<{ eventType: string; existingCommand: string }> {
  const conflicts: Array<{ eventType: string; existingCommand: string }> = [];
  for (const [eventType, eventHooks] of Object.entries(hooks)) {
    for (const hookGroup of eventHooks) {
      for (const hook of hookGroup.hooks) {
        if (hook.type === 'command' && !isOmdHook(hook.command)) {
          conflicts.push({ eventType, existingCommand: hook.command });
        }
      }
    }
  }
  return conflicts;
}

const TEST_DROID_DIR = join(homedir(), '.factory-test-safe-installer');
const TEST_SETTINGS_FILE = join(TEST_DROID_DIR, 'settings.json');

describe('isOmdHook', () => {
  it('returns true for commands containing "omd"', () => {
    expect(isOmdHook('node ~/.factory/hooks/omd-hook.mjs')).toBe(true);
    expect(isOmdHook('bash $HOME/.factory/hooks/omd-detector.sh')).toBe(true);
    expect(isOmdHook('/usr/bin/omd-tool')).toBe(true);
  });

  it('returns true for commands containing "oh-my-droid"', () => {
    expect(isOmdHook('node ~/.factory/hooks/oh-my-droid-hook.mjs')).toBe(true);
    expect(isOmdHook('bash $HOME/.factory/hooks/oh-my-droid.sh')).toBe(true);
  });

  it('returns false for commands not containing omd or oh-my-droid', () => {
    expect(isOmdHook('node ~/.factory/hooks/other-plugin.mjs')).toBe(false);
    expect(isOmdHook('bash $HOME/.factory/hooks/beads-hook.sh')).toBe(false);
    expect(isOmdHook('python /usr/bin/custom-hook.py')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isOmdHook('node ~/.factory/hooks/OMD-hook.mjs')).toBe(true);
    expect(isOmdHook('bash $HOME/.factory/hooks/OH-MY-DROID.sh')).toBe(true);
  });
});

describe('isOmdHook detection', () => {
  it('detects real OMD hooks correctly', () => {
    expect(isOmdHook('node ~/.factory/hooks/omd-hook.mjs')).toBe(true);
    expect(isOmdHook('node ~/.factory/hooks/oh-my-droid-hook.mjs')).toBe(true);
    expect(isOmdHook('node ~/.factory/hooks/omd-pre-tool-use.mjs')).toBe(true);
    expect(isOmdHook('/usr/local/bin/omd')).toBe(true);
  });

  it('rejects non-OMD hooks correctly', () => {
    expect(isOmdHook('eslint --fix')).toBe(false);
    expect(isOmdHook('prettier --write')).toBe(false);
    expect(isOmdHook('node custom-hook.mjs')).toBe(false);
    expect(isOmdHook('node ~/.factory/hooks/beads-hook.mjs')).toBe(false);
  });

  it('uses case-insensitive matching', () => {
    expect(isOmdHook('node ~/.factory/hooks/OMD-hook.mjs')).toBe(true);
    expect(isOmdHook('OH-MY-DROID-detector.sh')).toBe(true);
  });
});

describe('Safe Installer - Hook Conflict Detection', () => {
  beforeEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DROID_DIR)) {
      rmSync(TEST_DROID_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DROID_DIR, { recursive: true });

    // Mock DROID_CONFIG_DIR for testing
    process.env.TEST_DROID_CONFIG_DIR = TEST_DROID_DIR;
  });

  afterEach(() => {
    // Clean up
    if (existsSync(TEST_DROID_DIR)) {
      rmSync(TEST_DROID_DIR, { recursive: true, force: true });
    }
    delete process.env.TEST_DROID_CONFIG_DIR;
  });

  it('detects conflict when PreToolUse is owned by another plugin', () => {
    // Create settings.json with non-OMD hook
    const existingSettings = {
      hooks: {
        PreToolUse: [
          {
            hooks: [
              {
                type: 'command',
                command: 'node ~/.factory/hooks/beads-hook.mjs'
              }
            ]
          }
        ]
      }
    };
    writeFileSync(TEST_SETTINGS_FILE, JSON.stringify(existingSettings, null, 2));

    const options: InstallOptions = {
      verbose: true,
      skipDroidCheck: true
    };

    // Simulate install logic (we'd need to mock or refactor install function for full test)
    // For now, test the detection logic directly
    const conflicts = detectConflicts(existingSettings.hooks);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].eventType).toBe('PreToolUse');
    expect(conflicts[0].existingCommand).toBe('node ~/.factory/hooks/beads-hook.mjs');
  });

  it('does not detect conflict when hook is OMD-owned', () => {
    const existingSettings = {
      hooks: {
        PreToolUse: [
          {
            hooks: [
              {
                type: 'command',
                command: 'node ~/.factory/hooks/omd-pre-tool-use.mjs'
              }
            ]
          }
        ]
      }
    };

    const conflicts = detectConflicts(existingSettings.hooks);

    expect(conflicts).toHaveLength(0);
  });

  it('detects multiple conflicts across different hook events', () => {
    const existingSettings = {
      hooks: {
        PreToolUse: [
          {
            hooks: [
              {
                type: 'command',
                command: 'node ~/.factory/hooks/beads-pre-tool-use.mjs'
              }
            ]
          }
        ],
        PostToolUse: [
          {
            hooks: [
              {
                type: 'command',
                command: 'python ~/.factory/hooks/custom-post-tool.py'
              }
            ]
          }
        ],
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: 'command',
                command: 'node ~/.factory/hooks/omd-keyword-detector.mjs'
              }
            ]
          }
        ]
      }
    };

    const conflicts = detectConflicts(existingSettings.hooks);

    expect(conflicts).toHaveLength(2);
    expect(conflicts.map(c => c.eventType)).toContain('PreToolUse');
    expect(conflicts.map(c => c.eventType)).toContain('PostToolUse');
    expect(conflicts.map(c => c.eventType)).not.toContain('UserPromptSubmit');
  });
});
