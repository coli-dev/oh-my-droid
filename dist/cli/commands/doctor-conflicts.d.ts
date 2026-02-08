/**
 * Conflict diagnostic command
 * Scans for and reports plugin coexistence issues.
 */
export interface ConflictReport {
    hookConflicts: {
        event: string;
        command: string;
        isOmd: boolean;
    }[];
    agentsMdStatus: {
        hasMarkers: boolean;
        hasUserContent: boolean;
        path: string;
    } | null;
    envFlags: {
        disableOmd: boolean;
        skipHooks: string[];
    };
    configIssues: {
        unknownFields: string[];
    };
    hasConflicts: boolean;
}
/**
 * Check for hook conflicts in ~/.factory/settings.json
 */
export declare function checkHookConflicts(): ConflictReport['hookConflicts'];
/**
 * Check AGENTS.md for OMD markers and user content
 */
export declare function checkAgentsMdStatus(): ConflictReport['agentsMdStatus'];
/**
 * Check environment flags that affect OMD behavior
 */
export declare function checkEnvFlags(): ConflictReport['envFlags'];
/**
 * Check for unknown fields in config files
 */
export declare function checkConfigIssues(): ConflictReport['configIssues'];
/**
 * Run complete conflict check
 */
export declare function runConflictCheck(): ConflictReport;
/**
 * Format report for display
 */
export declare function formatReport(report: ConflictReport, json: boolean): string;
/**
 * Doctor conflicts command
 */
export declare function doctorConflictsCommand(options: {
    json?: boolean;
}): Promise<number>;
//# sourceMappingURL=doctor-conflicts.d.ts.map