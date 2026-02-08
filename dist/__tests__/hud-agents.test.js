/**
 * Sisyphus HUD - Agents Element Tests
 *
 * Tests for agent visualization with different formats.
 */
import { describe, it, expect } from 'vitest';
import { renderAgents, renderAgentsCoded, renderAgentsCodedWithDuration, renderAgentsDetailed, renderAgentsByFormat, renderAgentsMultiLine, } from '../hud/elements/droids.js';
// ANSI color codes for verification
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
// Helper to create mock droids
function createAgent(type, model, startTime) {
    return {
        id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        model,
        status: 'running',
        startTime: startTime || new Date(),
    };
}
describe('Agents Element', () => {
    describe('renderAgents (count format)', () => {
        it('should return null for empty array', () => {
            expect(renderAgents([])).toBeNull();
        });
        it('should return null when no droids are running', () => {
            const droids = [
                { ...createAgent('architect'), status: 'completed' },
            ];
            expect(renderAgents(droids)).toBeNull();
        });
        it('should show count of running droids', () => {
            const droids = [
                createAgent('architect'),
                createAgent('explore'),
            ];
            const result = renderAgents(droids);
            expect(result).toBe(`droids:${CYAN}2${RESET}`);
        });
    });
    describe('renderAgentsCoded (codes format)', () => {
        it('should return null for empty array', () => {
            expect(renderAgentsCoded([])).toBeNull();
        });
        it('should show single-character codes for known droids', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus'),
            ];
            const result = renderAgentsCoded(droids);
            // Architect with opus should be uppercase A in magenta
            expect(result).toContain('droids:');
            expect(result).toContain('A');
        });
        it('should use lowercase for sonnet/haiku tiers', () => {
            const droids = [
                createAgent('oh-my-droid:explore', 'haiku'),
            ];
            const result = renderAgentsCoded(droids);
            expect(result).toContain('e');
        });
        it('should handle multiple droids', () => {
            const now = Date.now();
            const droids = [
                createAgent('oh-my-droid:architect', 'opus', new Date(now - 2000)),
                createAgent('oh-my-droid:explore', 'haiku', new Date(now - 1000)),
                createAgent('oh-my-droid:executor', 'sonnet', new Date(now)),
            ];
            const result = renderAgentsCoded(droids);
            expect(result).toBeDefined();
            // Should contain codes for all three (freshest first: x, e, A)
            expect(result.replace(/\x1b\[[0-9;]*m/g, '')).toBe('droids:xeA');
        });
        it('should handle droids without model info', () => {
            const droids = [createAgent('oh-my-droid:architect')];
            const result = renderAgentsCoded(droids);
            expect(result).toContain('A');
        });
        it('should use first letter for unknown agent types', () => {
            const droids = [
                createAgent('oh-my-droid:unknown-agent', 'sonnet'),
            ];
            const result = renderAgentsCoded(droids);
            expect(result.replace(/\x1b\[[0-9;]*m/g, '')).toBe('droids:u');
        });
    });
    describe('renderAgentsCodedWithDuration (codes-duration format)', () => {
        it('should return null for empty array', () => {
            expect(renderAgentsCodedWithDuration([])).toBeNull();
        });
        it('should not show duration for very recent droids', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus', new Date()),
            ];
            const result = renderAgentsCodedWithDuration(droids);
            // No duration suffix for <10s
            expect(result.replace(/\x1b\[[0-9;]*m/g, '')).toBe('droids:A');
        });
        it('should show seconds for droids running 10-59s', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus', new Date(Date.now() - 30000)), // 30 seconds ago
            ];
            const result = renderAgentsCodedWithDuration(droids);
            const stripped = result.replace(/\x1b\[[0-9;]*m/g, '');
            expect(stripped).toMatch(/droids:A\(30s\)/);
        });
        it('should show minutes for droids running 1-9 min', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus', new Date(Date.now() - 180000)), // 3 minutes ago
            ];
            const result = renderAgentsCodedWithDuration(droids);
            const stripped = result.replace(/\x1b\[[0-9;]*m/g, '');
            expect(stripped).toMatch(/droids:A\(3m\)/);
        });
        it('should show alert for droids running 10+ min', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus', new Date(Date.now() - 600000)), // 10 minutes ago
            ];
            const result = renderAgentsCodedWithDuration(droids);
            const stripped = result.replace(/\x1b\[[0-9;]*m/g, '');
            expect(stripped).toMatch(/droids:A!/);
        });
    });
    describe('renderAgentsDetailed (detailed format)', () => {
        it('should return null for empty array', () => {
            expect(renderAgentsDetailed([])).toBeNull();
        });
        it('should show full agent names', () => {
            const droids = [createAgent('oh-my-droid:architect')];
            const result = renderAgentsDetailed(droids);
            expect(result).toContain('architect');
        });
        it('should abbreviate common long names', () => {
            const droids = [
                createAgent('oh-my-droid:executor', 'sonnet'),
            ];
            const result = renderAgentsDetailed(droids);
            expect(result).toContain('exec');
        });
        it('should include duration for long-running droids', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus', new Date(Date.now() - 120000)), // 2 minutes
            ];
            const result = renderAgentsDetailed(droids);
            expect(result).toContain('(2m)');
        });
    });
    describe('renderAgentsByFormat (format router)', () => {
        const now = Date.now();
        const droids = [
            createAgent('oh-my-droid:architect', 'opus', new Date(now - 1000)),
            createAgent('oh-my-droid:explore', 'haiku', new Date(now)),
        ];
        it('should route to count format', () => {
            const result = renderAgentsByFormat(droids, 'count');
            expect(result).toBe(`droids:${CYAN}2${RESET}`);
        });
        it('should route to codes format', () => {
            const result = renderAgentsByFormat(droids, 'codes');
            expect(result).toContain('droids:');
            // Freshest first: explore (e), then architect (A)
            expect(result.replace(/\x1b\[[0-9;]*m/g, '')).toBe('droids:eA');
        });
        it('should route to codes-duration format', () => {
            const result = renderAgentsByFormat(droids, 'codes-duration');
            expect(result).toContain('droids:');
        });
        it('should route to detailed format', () => {
            const result = renderAgentsByFormat(droids, 'detailed');
            expect(result).toContain('architect');
        });
        it('should route to descriptions format', () => {
            const agentsWithDesc = [
                {
                    ...createAgent('oh-my-droid:architect', 'opus'),
                    description: 'Analyzing code',
                },
            ];
            const result = renderAgentsByFormat(agentsWithDesc, 'descriptions');
            expect(result).toContain('A');
            expect(result).toContain('Analyzing code');
        });
        it('should route to tasks format', () => {
            const agentsWithDesc = [
                {
                    ...createAgent('oh-my-droid:architect', 'opus'),
                    description: 'Analyzing code',
                },
            ];
            const result = renderAgentsByFormat(agentsWithDesc, 'tasks');
            expect(result).toContain('[');
            expect(result).toContain('Analyzing code');
            expect(result).not.toContain('A:'); // tasks format doesn't show codes
        });
        it('should default to codes for unknown format', () => {
            const result = renderAgentsByFormat(droids, 'unknown');
            // Should fall back to codes format (freshest first: e, A)
            expect(result).toContain('droids:');
            expect(result.replace(/\x1b\[[0-9;]*m/g, '')).toBe('droids:eA');
        });
    });
    describe('Agent type codes', () => {
        const testCases = [
            // Build/Analysis Lane
            { type: 'architect', model: 'opus', expected: 'A' },
            { type: 'explore', model: 'haiku', expected: 'e' },
            { type: 'executor', model: 'sonnet', expected: 'x' },
            { type: 'deep-executor', model: 'opus', expected: 'X' },
            { type: 'debugger', model: 'sonnet', expected: 'g' },
            { type: 'verifier', model: 'sonnet', expected: 'v' },
            // Review Lane
            { type: 'style-reviewer', model: 'haiku', expected: 'y' },
            { type: 'quality-reviewer', model: 'sonnet', expected: 'q' },
            { type: 'api-reviewer', model: 'sonnet', expected: 'i' },
            { type: 'security-reviewer', model: 'sonnet', expected: 'k' },
            { type: 'performance-reviewer', model: 'sonnet', expected: 'o' },
            { type: 'code-reviewer', model: 'opus', expected: 'R' },
            // Domain Specialists
            { type: 'dependency-expert', model: 'sonnet', expected: 'l' },
            { type: 'test-engineer', model: 'sonnet', expected: 't' },
            { type: 'build-fixer', model: 'sonnet', expected: 'b' },
            { type: 'designer', model: 'sonnet', expected: 'd' },
            { type: 'writer', model: 'haiku', expected: 'w' },
            { type: 'qa-tester', model: 'sonnet', expected: 'q' },
            { type: 'scientist', model: 'sonnet', expected: 's' },
            { type: 'git-master', model: 'sonnet', expected: 'm' },
            // Coordination
            { type: 'critic', model: 'opus', expected: 'C' },
            { type: 'analyst', model: 'opus', expected: 'T' },
            { type: 'planner', model: 'opus', expected: 'P' },
            { type: 'vision', model: 'sonnet', expected: 'v' },
            // Backward Compatibility
            { type: 'researcher', model: 'sonnet', expected: 'r' },
        ];
        testCases.forEach(({ type, model, expected }) => {
            it(`should render ${type} (${model}) as '${expected}'`, () => {
                const droids = [
                    createAgent(`oh-my-droid:${type}`, model),
                ];
                const result = renderAgentsCoded(droids);
                const stripped = result.replace(/\x1b\[[0-9;]*m/g, '');
                expect(stripped).toBe(`droids:${expected}`);
            });
        });
    });
    describe('Model tier color coding', () => {
        it('should use magenta for opus tier', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus'),
            ];
            const result = renderAgentsCoded(droids);
            expect(result).toContain(MAGENTA);
        });
        it('should use yellow for sonnet tier', () => {
            const droids = [
                createAgent('oh-my-droid:executor', 'sonnet'),
            ];
            const result = renderAgentsCoded(droids);
            expect(result).toContain(YELLOW);
        });
        it('should use green for haiku tier', () => {
            const droids = [
                createAgent('oh-my-droid:explore', 'haiku'),
            ];
            const result = renderAgentsCoded(droids);
            expect(result).toContain(GREEN);
        });
        it('should use cyan for unknown model', () => {
            const droids = [
                createAgent('oh-my-droid:architect'),
            ];
            const result = renderAgentsCoded(droids);
            expect(result).toContain(CYAN);
        });
    });
    describe('renderAgentsMultiLine (multiline format)', () => {
        it('should return empty for no running droids', () => {
            const result = renderAgentsMultiLine([]);
            expect(result.headerPart).toBeNull();
            expect(result.detailLines).toHaveLength(0);
        });
        it('should return empty for completed droids only', () => {
            const droids = [
                { ...createAgent('oh-my-droid:architect'), status: 'completed' },
            ];
            const result = renderAgentsMultiLine(droids);
            expect(result.headerPart).toBeNull();
            expect(result.detailLines).toHaveLength(0);
        });
        it('should render single agent with tree character (last)', () => {
            const droids = [
                {
                    ...createAgent('oh-my-droid:architect', 'opus'),
                    description: 'analyzing code',
                },
            ];
            const result = renderAgentsMultiLine(droids);
            expect(result.headerPart).toContain('droids:');
            expect(result.headerPart).toContain('1');
            expect(result.detailLines).toHaveLength(1);
            // Single agent should use └─ (last indicator)
            expect(result.detailLines[0]).toContain('└─');
            expect(result.detailLines[0]).toContain('A');
            expect(result.detailLines[0]).toContain('analyzing code');
        });
        it('should render multiple droids with correct tree characters', () => {
            const droids = [
                {
                    ...createAgent('oh-my-droid:architect', 'opus'),
                    description: 'analyzing code',
                },
                {
                    ...createAgent('oh-my-droid:explore', 'haiku'),
                    description: 'searching files',
                },
            ];
            const result = renderAgentsMultiLine(droids);
            expect(result.headerPart).toContain('2');
            expect(result.detailLines).toHaveLength(2);
            // First agent uses ├─
            expect(result.detailLines[0]).toContain('├─');
            expect(result.detailLines[0]).toContain('A');
            // Last agent uses └─
            expect(result.detailLines[1]).toContain('└─');
            expect(result.detailLines[1]).toContain('e');
        });
        it('should limit to maxLines and show overflow indicator', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus'),
                createAgent('oh-my-droid:explore', 'haiku'),
                createAgent('oh-my-droid:executor', 'sonnet'),
                createAgent('oh-my-droid:researcher', 'haiku'),
            ];
            const result = renderAgentsMultiLine(droids, 2);
            // 2 droids + 1 overflow indicator
            expect(result.detailLines).toHaveLength(3);
            expect(result.detailLines[2]).toContain('+2 more');
        });
        it('should include duration for long-running droids', () => {
            const droids = [
                createAgent('oh-my-droid:architect', 'opus', new Date(Date.now() - 120000) // 2 minutes ago
                ),
            ];
            const result = renderAgentsMultiLine(droids);
            expect(result.detailLines).toHaveLength(1);
            expect(result.detailLines[0]).toContain('2m');
        });
        it('should truncate long descriptions', () => {
            const droids = [
                {
                    ...createAgent('oh-my-droid:architect', 'opus'),
                    description: 'This is a very long description that should be truncated to fit in the display',
                },
            ];
            const result = renderAgentsMultiLine(droids);
            expect(result.detailLines).toHaveLength(1);
            expect(result.detailLines[0]).toContain('...');
            // Strip ANSI codes before checking length
            const stripped = result.detailLines[0].replace(/\x1b\[[0-9;]*m/g, '');
            expect(stripped.length).toBeLessThan(80);
        });
        it('should handle droids without descriptions', () => {
            const droids = [createAgent('oh-my-droid:architect', 'opus')];
            const result = renderAgentsMultiLine(droids);
            expect(result.detailLines).toHaveLength(1);
            expect(result.detailLines[0]).toContain('...');
        });
        it('should route to multiline from renderAgentsByFormat', () => {
            const droids = [createAgent('oh-my-droid:architect', 'opus')];
            const result = renderAgentsByFormat(droids, 'multiline');
            // Should return the header part only (backward compatibility)
            expect(result).toContain('droids:');
            expect(result).toContain('1');
        });
    });
});
//# sourceMappingURL=hud-droids.test.js.map