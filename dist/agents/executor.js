/**
 * Executor Agent - Focused Task Executor
 *
 * Executes tasks directly without delegation capabilities.
 * Same discipline as Sisyphus, but works alone.
 *
 * Ported from oh-my-opencode's executor agent.
 * Prompt loaded from: droids/executor.md
 */
import { loadAgentPrompt } from "./utils.js";
export const SISYPHUS_JUNIOR_PROMPT_METADATA = {
    category: "specialist",
    cost: "CHEAP",
    promptAlias: "Junior",
    triggers: [
        {
            domain: "Direct implementation",
            trigger: "Single-file changes, focused tasks",
        },
        { domain: "Bug fixes", trigger: "Clear, scoped fixes" },
        { domain: "Small features", trigger: "Well-defined, isolated work" },
    ],
    useWhen: [
        "Direct, focused implementation tasks",
        "Single-file or few-file changes",
        "When delegation overhead isn't worth it",
        "Clear, well-scoped work items",
    ],
    avoidWhen: [
        "Multi-file refactoring (use orchestrator)",
        "Tasks requiring research (use explore/researcher first)",
        "Complex decisions (consult architect)",
    ],
};
export const executorAgent = {
    name: "executor",
    description: "Focused task executor. Execute tasks directly. NEVER delegate or spawn other droids. Same discipline as Sisyphus, no delegation.",
    prompt: loadAgentPrompt("executor"),
    model: "custom:gpt-5.2-codex-2",
    defaultModel: "custom:gpt-5.2-codex-2",
    metadata: SISYPHUS_JUNIOR_PROMPT_METADATA,
};
//# sourceMappingURL=executor.js.map