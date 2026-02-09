/**
 * Agents Module Exports
 *
 * New modular agent system with individual files and metadata.
 * Maintains backward compatibility with definitions.ts exports.
 */
// Types
export * from "./types.js";
// Utilities
export { createAgentToolRestrictions, mergeAgentConfig, buildDelegationTable, buildUseAvoidSection, createEnvContext, getAvailableAgents, buildKeyTriggersSection, validateAgentConfig, deepMerge, loadAgentPrompt, } from "./utils.js";
// Individual agent exports
export { architectAgent, ARCHITECT_PROMPT_METADATA } from "./architect.js";
export { exploreAgent, EXPLORE_PROMPT_METADATA } from "./explore.js";
export { executorAgent, SISYPHUS_JUNIOR_PROMPT_METADATA } from "./executor.js";
export { designerAgent, FRONTEND_ENGINEER_PROMPT_METADATA, } from "./designer.js";
export { writerAgent, DOCUMENT_WRITER_PROMPT_METADATA } from "./writer.js";
export { visionAgent, MULTIMODAL_LOOKER_PROMPT_METADATA } from "./vision.js";
export { criticAgent, CRITIC_PROMPT_METADATA } from "./critic.js";
export { analystAgent, ANALYST_PROMPT_METADATA } from "./analyst.js";
export { plannerAgent, PLANNER_PROMPT_METADATA } from "./planner.js";
export { qaTesterAgent, QA_TESTER_PROMPT_METADATA } from "./qa-tester.js";
export { scientistAgent, SCIENTIST_PROMPT_METADATA } from "./scientist.js";
export { deepExecutorAgent, DEEP_EXECUTOR_PROMPT_METADATA, } from "./deep-executor.js";
// Backward compatibility: Deprecated researcher export
/** @deprecated Use dependency-expert agent instead */
export { researcherAgent, RESEARCHER_PROMPT_METADATA } from "./researcher.js";
// Reformed droids (Build/Analysis Lane)
export { debuggerAgent, verifierAgent } from "./definitions.js";
// Reformed droids (Review Lane)
export { styleReviewerAgent, qualityReviewerAgent, apiReviewerAgent, performanceReviewerAgent, } from "./definitions.js";
// Reformed droids (Domain Specialists)
export { dependencyExpertAgent, testEngineerAgent, qualityStrategistAgent, } from "./definitions.js";
// Reformed droids (Product Lane)
export { productManagerAgent, uxResearcherAgent, informationArchitectAgent, productAnalystAgent, } from "./definitions.js";
// Specialized droids (Security, Build, Code Review, Git)
export { securityReviewerAgent, buildFixerAgent, codeReviewerAgent, gitMasterAgent, } from "./definitions.js";
// Backward compatibility: Deprecated tiered agent aliases
/** @deprecated Use agent with model parameter instead */
export const architectMediumAgent = undefined;
/** @deprecated Use agent with model parameter instead */
export const architectLowAgent = undefined;
/** @deprecated Use agent with model parameter instead */
export const executorHighAgent = undefined;
/** @deprecated Use agent with model parameter instead */
export const executorLowAgent = undefined;
/** @deprecated Use agent with model parameter instead */
export const exploreHighAgent = undefined;
/** @deprecated Use agent with model parameter instead */
export const designerLowAgent = undefined;
/** @deprecated Use agent with model parameter instead */
export const designerHighAgent = undefined;
/** @deprecated Use agent with model parameter instead */
export const scientistHighAgent = undefined;
/** @deprecated Use security-reviewer agent instead */
export const securityReviewerLowAgent = undefined;
/** @deprecated Use test-engineer agent instead */
export const tddGuideAgent = undefined;
/** @deprecated Use test-engineer agent instead */
export const tddGuideLowAgent = undefined;
// Core exports (getAgentDefinitions and omdSystemPrompt)
export { getAgentDefinitions, omdSystemPrompt } from "./definitions.js";
// Deprecated exports (for backward compatibility)
export { coordinatorAgent, ORCHESTRATOR_SISYPHUS_PROMPT_METADATA, } from "./coordinator-deprecated.js";
//# sourceMappingURL=index.js.map