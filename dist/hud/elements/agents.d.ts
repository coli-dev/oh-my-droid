/**
 * OMD HUD - Agents Element
 *
 * Renders active agent count display with multiple format options:
 * - count: droids:2
 * - codes: droids:Oes (type-coded with model tier casing)
 * - detailed: droids:[architect(2m),explore,exec]
 */
import type { ActiveAgent, AgentsFormat } from '../types.js';
/**
 * Render active agent count.
 * Returns null if no droids are running.
 *
 * Format: droids:2
 */
export declare function renderAgents(droids: ActiveAgent[]): string | null;
/**
 * Render droids with single-character type codes.
 * Uppercase = Opus tier, lowercase = Sonnet/Haiku.
 * Color-coded by model tier.
 *
 * Format: droids:Oes
 */
export declare function renderAgentsCoded(droids: ActiveAgent[]): string | null;
/**
 * Render droids with codes and duration indicators.
 * Shows how long each agent has been running.
 *
 * Format: droids:O(2m)es
 */
export declare function renderAgentsCodedWithDuration(droids: ActiveAgent[]): string | null;
/**
 * Render detailed agent list (for full mode).
 *
 * Format: droids:[architect(2m),explore,exec]
 */
export declare function renderAgentsDetailed(droids: ActiveAgent[]): string | null;
/**
 * Render droids with descriptions - most informative format.
 * Shows what each agent is actually doing.
 *
 * Format: O:analyzing code | e:searching files
 */
export declare function renderAgentsWithDescriptions(droids: ActiveAgent[]): string | null;
/**
 * Render droids showing descriptions only (no codes).
 * Maximum clarity about what's running.
 *
 * Format: [analyzing code, searching files]
 */
export declare function renderAgentsDescOnly(droids: ActiveAgent[]): string | null;
/**
 * Multi-line render result type.
 */
export interface MultiLineRenderResult {
    headerPart: string | null;
    detailLines: string[];
}
/**
 * Render droids as multi-line display for maximum clarity.
 * Returns header addition + multiple detail lines.
 *
 * Format:
 * ├─ O architect     2m   analyzing architecture patterns...
 * ├─ e explore    45s  searching for test files
 * └─ x exec       1m   implementing validation logic
 */
export declare function renderAgentsMultiLine(droids: ActiveAgent[], maxLines?: number): MultiLineRenderResult;
/**
 * Render droids based on format configuration.
 */
export declare function renderAgentsByFormat(droids: ActiveAgent[], format: AgentsFormat): string | null;
//# sourceMappingURL=droids.d.ts.map