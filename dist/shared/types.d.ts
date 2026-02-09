/**
 * Shared types for Oh-My-Droid-Sisyphus
 */
export type ModelType = "sonnet" | "opus" | "haiku" | "inherit" | "custom:gpt-5.2-codex-mini-0" | "custom:gpt-5.2-1" | "custom:gpt-5.2-codex-2" | "custom:gpt-5.3-codex-3" | "custom:claude-haiku-4.5-4" | "custom:claude-sonnet-4.5-5" | "custom:claude-opus-4.5-6" | "custom:gemini-3-flash-7" | "custom:gemini-3-pro-8";
export interface AgentConfig {
    name: string;
    description: string;
    prompt: string;
    /** Tools the agent can use (optional - all tools allowed by default if omitted) */
    tools?: string[];
    /** Tools explicitly disallowed for this agent */
    disallowedTools?: string[];
    model?: ModelType;
    defaultModel?: ModelType;
}
export interface PluginConfig {
    droids?: {
        omd?: {
            model?: string;
        };
        architect?: {
            model?: string;
            enabled?: boolean;
        };
        researcher?: {
            model?: string;
        };
        explore?: {
            model?: string;
        };
        frontendEngineer?: {
            model?: string;
            enabled?: boolean;
        };
        documentWriter?: {
            model?: string;
            enabled?: boolean;
        };
        multimodalLooker?: {
            model?: string;
            enabled?: boolean;
        };
        critic?: {
            model?: string;
            enabled?: boolean;
        };
        analyst?: {
            model?: string;
            enabled?: boolean;
        };
        orchestratorSisyphus?: {
            model?: string;
            enabled?: boolean;
        };
        sisyphusJunior?: {
            model?: string;
            enabled?: boolean;
        };
        planner?: {
            model?: string;
            enabled?: boolean;
        };
    };
    features?: {
        parallelExecution?: boolean;
        lspTools?: boolean;
        astTools?: boolean;
        continuationEnforcement?: boolean;
        autoContextInjection?: boolean;
    };
    mcpServers?: {
        exa?: {
            enabled?: boolean;
            apiKey?: string;
        };
        context7?: {
            enabled?: boolean;
        };
    };
    permissions?: {
        allowBash?: boolean;
        allowEdit?: boolean;
        allowWrite?: boolean;
        maxBackgroundTasks?: number;
    };
    magicKeywords?: {
        ultrawork?: string[];
        search?: string[];
        analyze?: string[];
        ultrathink?: string[];
    };
    routing?: {
        /** Enable intelligent model routing */
        enabled?: boolean;
        /** Default tier when no rules match */
        defaultTier?: "LOW" | "MEDIUM" | "HIGH";
        /** Enable automatic escalation on failure */
        escalationEnabled?: boolean;
        /** Maximum escalation attempts */
        maxEscalations?: number;
        /** Model mapping per tier */
        tierModels?: {
            LOW?: string;
            MEDIUM?: string;
            HIGH?: string;
        };
        /** Agent-specific tier overrides */
        agentOverrides?: Record<string, {
            tier: "LOW" | "MEDIUM" | "HIGH";
            reason: string;
        }>;
        /** Keywords that force escalation to higher tier */
        escalationKeywords?: string[];
        /** Keywords that suggest lower tier */
        simplificationKeywords?: string[];
    };
}
export interface SessionState {
    sessionId?: string;
    activeAgents: Map<string, AgentState>;
    backgroundTasks: BackgroundTask[];
    contextFiles: string[];
}
export interface AgentState {
    name: string;
    status: "idle" | "running" | "completed" | "error";
    lastMessage?: string;
    startTime?: number;
}
export interface BackgroundTask {
    id: string;
    agentName: string;
    prompt: string;
    status: "pending" | "running" | "completed" | "error";
    result?: string;
    error?: string;
}
export interface MagicKeyword {
    triggers: string[];
    action: (prompt: string) => string;
    description: string;
}
export interface HookDefinition {
    event: "PreToolUse" | "PostToolUse" | "Stop" | "SessionStart" | "SessionEnd" | "UserPromptSubmit";
    matcher?: string;
    command?: string;
    handler?: (context: HookContext) => Promise<HookResult>;
}
export interface HookContext {
    toolName?: string;
    toolInput?: unknown;
    toolOutput?: unknown;
    sessionId?: string;
}
export interface HookResult {
    continue: boolean;
    message?: string;
    modifiedInput?: unknown;
}
//# sourceMappingURL=types.d.ts.map