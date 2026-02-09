/**
 * Tests for delegation enforcer middleware
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { enforceModel, isAgentCall, processPreToolUse, getModelForAgent, } from "../features/delegation-enforcer.js";
describe("delegation-enforcer", () => {
    let originalDebugEnv;
    beforeEach(() => {
        originalDebugEnv = process.env.OMD_DEBUG;
    });
    afterEach(() => {
        if (originalDebugEnv === undefined) {
            delete process.env.OMD_DEBUG;
        }
        else {
            process.env.OMD_DEBUG = originalDebugEnv;
        }
    });
    describe("enforceModel", () => {
        it("preserves explicitly specified model", () => {
            const input = {
                description: "Test task",
                prompt: "Do something",
                subagent_type: "oh-my-droid:executor",
                model: "haiku",
            };
            const result = enforceModel(input);
            expect(result.injected).toBe(false);
            expect(result.modifiedInput.model).toBe("haiku");
            expect(result.modifiedInput).toEqual(input);
        });
        it("injects model from agent definition when not specified", () => {
            const input = {
                description: "Test task",
                prompt: "Do something",
                subagent_type: "oh-my-droid:executor",
            };
            const result = enforceModel(input);
            expect(result.injected).toBe(true);
            expect(result.modifiedInput.model).toBe("custom:gpt-5.2-codex-2"); // executor defaults to gpt-5.2 codex
            expect(result.originalInput.model).toBeUndefined();
        });
        it("handles agent type without prefix", () => {
            const input = {
                description: "Test task",
                prompt: "Do something",
                subagent_type: "debugger",
            };
            const result = enforceModel(input);
            expect(result.injected).toBe(true);
            expect(result.modifiedInput.model).toBe("custom:gpt-5.3-codex-3"); // debugger defaults to gpt-5.3 codex
        });
        it("throws error for unknown agent type", () => {
            const input = {
                description: "Test task",
                prompt: "Do something",
                subagent_type: "unknown-agent",
            };
            expect(() => enforceModel(input)).toThrow("Unknown agent type");
        });
        it("logs warning only when OMD_DEBUG=true", () => {
            const input = {
                description: "Test task",
                prompt: "Do something",
                subagent_type: "executor",
            };
            // Without debug flag
            delete process.env.OMD_DEBUG;
            const resultWithoutDebug = enforceModel(input);
            expect(resultWithoutDebug.warning).toBeUndefined();
            // With debug flag
            process.env.OMD_DEBUG = "true";
            const resultWithDebug = enforceModel(input);
            expect(resultWithDebug.warning).toBeDefined();
            expect(resultWithDebug.warning).toContain("Auto-injecting model");
            expect(resultWithDebug.warning).toContain("custom:gpt-5.2-codex-2");
            expect(resultWithDebug.warning).toContain("executor");
        });
        it("does not log warning when OMD_DEBUG is false", () => {
            const input = {
                description: "Test task",
                prompt: "Do something",
                subagent_type: "executor",
            };
            process.env.OMD_DEBUG = "false";
            const result = enforceModel(input);
            expect(result.warning).toBeUndefined();
        });
        it("works with all droids", () => {
            const testCases = [
                { agent: "architect", expectedModel: "custom:claude-opus-4.5-6" },
                { agent: "executor", expectedModel: "custom:gpt-5.2-codex-2" },
                { agent: "explore", expectedModel: "custom:gpt-5.2-codex-mini-0" },
                { agent: "designer", expectedModel: "custom:gemini-3-pro-8" },
                { agent: "debugger", expectedModel: "custom:gpt-5.3-codex-3" },
                { agent: "verifier", expectedModel: "custom:gpt-5.3-codex-3" },
                { agent: "style-reviewer", expectedModel: "custom:claude-haiku-4.5-4" },
                {
                    agent: "quality-reviewer",
                    expectedModel: "custom:claude-sonnet-4.5-5",
                },
                { agent: "api-reviewer", expectedModel: "custom:claude-sonnet-4.5-5" },
                {
                    agent: "performance-reviewer",
                    expectedModel: "custom:claude-sonnet-4.5-5",
                },
                { agent: "dependency-expert", expectedModel: "custom:gpt-5.2-1" },
                { agent: "test-engineer", expectedModel: "custom:claude-sonnet-4.5-5" },
            ];
            for (const testCase of testCases) {
                const input = {
                    description: "Test",
                    prompt: "Test",
                    subagent_type: testCase.agent,
                };
                const result = enforceModel(input);
                expect(result.modifiedInput.model).toBe(testCase.expectedModel);
                expect(result.injected).toBe(true);
            }
        });
    });
    describe("isAgentCall", () => {
        it("returns true for Agent tool with valid input", () => {
            const toolInput = {
                description: "Test",
                prompt: "Test",
                subagent_type: "executor",
            };
            expect(isAgentCall("Agent", toolInput)).toBe(true);
        });
        it("returns true for Task tool with valid input", () => {
            const toolInput = {
                description: "Test",
                prompt: "Test",
                subagent_type: "executor",
            };
            expect(isAgentCall("Task", toolInput)).toBe(true);
        });
        it("returns false for non-agent tools", () => {
            const toolInput = {
                description: "Test",
                prompt: "Test",
                subagent_type: "executor",
            };
            expect(isAgentCall("Bash", toolInput)).toBe(false);
            expect(isAgentCall("Read", toolInput)).toBe(false);
        });
        it("returns false for invalid input structure", () => {
            expect(isAgentCall("Agent", null)).toBe(false);
            expect(isAgentCall("Agent", undefined)).toBe(false);
            expect(isAgentCall("Agent", "string")).toBe(false);
            expect(isAgentCall("Agent", { description: "test" })).toBe(false); // missing prompt
            expect(isAgentCall("Agent", { prompt: "test" })).toBe(false); // missing description
        });
    });
    describe("processPreToolUse", () => {
        it("returns original input for non-agent tools", () => {
            const toolInput = { command: "ls -la" };
            const result = processPreToolUse("Bash", toolInput);
            expect(result.modifiedInput).toEqual(toolInput);
            expect(result.warning).toBeUndefined();
        });
        it("enforces model for agent calls", () => {
            const toolInput = {
                description: "Test",
                prompt: "Test",
                subagent_type: "executor",
            };
            const result = processPreToolUse("Agent", toolInput);
            expect(result.modifiedInput).toHaveProperty("model", "custom:gpt-5.2-codex-2");
        });
        it("does not modify input when model already specified", () => {
            const toolInput = {
                description: "Test",
                prompt: "Test",
                subagent_type: "executor",
                model: "haiku",
            };
            const result = processPreToolUse("Agent", toolInput);
            expect(result.modifiedInput).toEqual(toolInput);
            expect(result.warning).toBeUndefined();
        });
        it("logs warning only when OMD_DEBUG=true and model injected", () => {
            const toolInput = {
                description: "Test",
                prompt: "Test",
                subagent_type: "executor",
            };
            // Without debug
            delete process.env.OMD_DEBUG;
            const resultWithoutDebug = processPreToolUse("Agent", toolInput);
            expect(resultWithoutDebug.warning).toBeUndefined();
            // With debug
            process.env.OMD_DEBUG = "true";
            const resultWithDebug = processPreToolUse("Agent", toolInput);
            expect(resultWithDebug.warning).toBeDefined();
        });
    });
    describe("getModelForAgent", () => {
        it("returns correct model for agent with prefix", () => {
            expect(getModelForAgent("oh-my-droid:executor")).toBe("custom:gpt-5.2-codex-2");
            expect(getModelForAgent("oh-my-droid:debugger")).toBe("custom:gpt-5.3-codex-3");
            expect(getModelForAgent("oh-my-droid:architect")).toBe("custom:claude-opus-4.5-6");
        });
        it("returns correct model for agent without prefix", () => {
            expect(getModelForAgent("executor")).toBe("custom:gpt-5.2-codex-2");
            expect(getModelForAgent("debugger")).toBe("custom:gpt-5.3-codex-3");
            expect(getModelForAgent("architect")).toBe("custom:claude-opus-4.5-6");
        });
        it("throws error for unknown agent", () => {
            expect(() => getModelForAgent("unknown")).toThrow("Unknown agent type");
        });
    });
});
//# sourceMappingURL=delegation-enforcer.test.js.map