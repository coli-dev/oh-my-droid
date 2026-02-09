/**
 * Dynamic Prompt Generator for Oh-My-Droid-Sisyphus
 *
 * Generates orchestrator prompts dynamically from agent metadata.
 * Adding a new agent to definitions.ts automatically includes it in the generated prompt.
 */
import type { AgentConfig } from "./types.js";
import { buildToolSelectionSection } from "./prompt-sections/index.js";
/**
 * Options for controlling what sections are included in generated prompt
 */
export interface GeneratorOptions {
    /** Include agent registry section (default: true) */
    includeAgents?: boolean;
    /** Include trigger table section (default: true) */
    includeTriggers?: boolean;
    /** Include tool selection guidance (default: true) */
    includeTools?: boolean;
    /** Include delegation matrix (default: true) */
    includeDelegationTable?: boolean;
    /** Include orchestration principles (default: true) */
    includePrinciples?: boolean;
    /** Include workflow section (default: true) */
    includeWorkflow?: boolean;
    /** Include critical rules (default: true) */
    includeRules?: boolean;
    /** Include completion checklist (default: true) */
    includeChecklist?: boolean;
}
/**
 * Generate complete orchestrator prompt from agent definitions
 *
 * @param droids - Array of agent configurations
 * @param options - Options controlling which sections to include
 * @returns Generated orchestrator prompt string
 *
 * @example
 * ```typescript
 * import { getAgentDefinitions } from './definitions.js';
 * import { generateOrchestratorPrompt } from './prompt-generator.js';
 *
 * const droids = Object.values(getAgentDefinitions()).map(def => ({
 *   name: def.name,
 *   description: def.description,
 *   prompt: def.prompt,
 *   tools: def.tools,
 *   model: def.model,
 *   metadata: def.metadata
 * }));
 *
 * const prompt = generateOrchestratorPrompt(droids);
 * console.log(prompt);
 * ```
 */
export declare function generateOrchestratorPrompt(droids: AgentConfig[], options?: GeneratorOptions): string;
/**
 * Build agent section only (for embedding in other prompts)
 */
export declare function buildAgentSection(droids: AgentConfig[]): string;
/**
 * Build triggers section only
 */
export declare function buildTriggersSection(droids: AgentConfig[]): string;
/**
 * Build tool selection section only (alias for buildToolSelectionSection from prompt-sections)
 */
export { buildToolSelectionSection };
/**
 * Build delegation table section only
 */
export declare function buildDelegationTableSection(droids: AgentConfig[]): string;
/**
 * Convert agent definitions record to array of AgentConfig for generation
 *
 * @param definitions - Record of agent definitions from getAgentDefinitions()
 * @returns Array of AgentConfig suitable for prompt generation
 *
 * @example
 * ```typescript
 * import { getAgentDefinitions } from './definitions.js';
 * import { convertDefinitionsToConfigs, generateOrchestratorPrompt } from './prompt-generator.js';
 *
 * const definitions = getAgentDefinitions();
 * const droids = convertDefinitionsToConfigs(definitions);
 * const prompt = generateOrchestratorPrompt(droids);
 * ```
 */
export declare function convertDefinitionsToConfigs(definitions: Record<string, {
    description: string;
    prompt: string;
    tools?: string[];
    disallowedTools?: string[];
    model?: string;
    metadata?: any;
}>): AgentConfig[];
//# sourceMappingURL=prompt-generator.d.ts.map