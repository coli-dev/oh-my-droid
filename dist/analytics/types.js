/**
 * Fallback pricing when @tokscale/core is unavailable.
 * Prefer lookupPricingWithFallback() from tokscale-adapter.ts for live pricing.
 * @deprecated Use tokscale-adapter.ts lookupPricingWithFallback() instead
 */
export const PRICING = {
    "claude-haiku-4": {
        inputPerMillion: 0.8,
        outputPerMillion: 4.0,
        cacheWriteMarkup: 0.25,
        cacheReadDiscount: 0.9,
    },
    "claude-sonnet-4.5": {
        inputPerMillion: 3.0,
        outputPerMillion: 15.0,
        cacheWriteMarkup: 0.25,
        cacheReadDiscount: 0.9,
    },
    "claude-opus-4.6": {
        inputPerMillion: 15.0,
        outputPerMillion: 75.0,
        cacheWriteMarkup: 0.25,
        cacheReadDiscount: 0.9,
    },
};
//# sourceMappingURL=types.js.map