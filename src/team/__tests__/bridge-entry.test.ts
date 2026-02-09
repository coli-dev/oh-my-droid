import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateConfigPath } from '../bridge-entry.js';

describe('bridge-entry security', () => {
  const source = readFileSync(join(__dirname, '..', 'bridge-entry.ts'), 'utf-8');

  it('does NOT use process.cwd()', () => {
    expect(source).not.toContain('process.cwd()');
  });

  it('has validateBridgeWorkingDirectory function', () => {
    expect(source).toContain('validateBridgeWorkingDirectory');
  });

  it('validates config path is under ~/.factory/ or .omd/', () => {
    expect(source).toContain('.factory/');
    expect(source).toContain('.omd/');
  });

  it('sanitizes team and worker names', () => {
    expect(source).toContain('sanitizeName(config.teamName)');
    expect(source).toContain('sanitizeName(config.workerName)');
  });

  it('uses realpathSync for symlink resolution', () => {
    expect(source).toContain('realpathSync');
  });

  it('checks path is under homedir', () => {
    expect(source).toMatch(/home\s*\+\s*["']\/["']/);
  });

  it('verifies git worktree', () => {
    expect(source).toContain('getWorktreeRoot');
  });

  it('validates working directory exists and is a directory', () => {
    expect(source).toContain('statSync(workingDirectory)');
    expect(source).toContain('isDirectory()');
  });

  it('validates provider is codex or gemini', () => {
    expect(source).toMatch(/config\.provider\s*!==\s*["']codex["']/);
    expect(source).toMatch(/config\.provider\s*!==\s*["']gemini["']/);
  });

  it('has signal handlers for graceful cleanup', () => {
    expect(source).toContain('SIGINT');
    expect(source).toContain('SIGTERM');
    expect(source).toContain('deleteHeartbeat');
    expect(source).toContain('unregisterMcpWorker');
  });

  it('validates required config fields', () => {
    expect(source).toContain('teamName');
    expect(source).toContain('workerName');
    expect(source).toContain('provider');
    expect(source).toContain('workingDirectory');
    expect(source).toContain('Missing required config field');
  });

  it('applies default configuration values', () => {
    expect(source).toContain('pollIntervalMs');
    expect(source).toContain('taskTimeoutMs');
    expect(source).toContain('maxConsecutiveErrors');
    expect(source).toContain('outboxMaxLines');
    expect(source).toContain('maxRetries');
  });
});

describe('validateConfigPath', () => {
  const home = '/home/user';

  it('should reject paths outside home directory', () => {
    expect(validateConfigPath('/tmp/.omd/config.json', home)).toBe(false);
  });

  it('should reject paths without trusted subpath', () => {
    expect(validateConfigPath('/home/user/project/config.json', home)).toBe(false);
  });

  it('should accept paths under ~/.factory/', () => {
    expect(validateConfigPath('/home/user/.factory/teams/foo/config.json', home)).toBe(true);
  });

  it('should accept paths under project/.omd/', () => {
    expect(validateConfigPath('/home/user/project/.omd/state/config.json', home)).toBe(true);
  });

  it('should reject path that matches subpath but not home', () => {
    expect(validateConfigPath('/other/.factory/config.json', home)).toBe(false);
  });

  it('should reject path traversal via ../ that escapes trusted subpath', () => {
    // ~/foo/.factory/../../evil.json resolves to ~/evil.json (no trusted subpath)
    expect(validateConfigPath('/home/user/foo/.factory/../../evil.json', home)).toBe(false);
  });
});
