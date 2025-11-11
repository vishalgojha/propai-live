/**
 * Feature Flags System
 * 
 * Allows toggling features between client-side and backend implementations
 * with localStorage override support for testing/debugging
 */

const DEFAULT_FEATURES = {
  // AI Enrichment: Use client-side AI generation vs backend
  useClientAI: true,
  
  // Parity Logging: Track client-side AI quality for monitoring
  enableParityLogging: false,
  
  // Debounce time for AI enrichment (ms)
  debounceEnrichmentMs: 500,
};

/**
 * Get feature flag value with localStorage override support
 * 
 * Usage:
 * - To override in browser console:
 *   localStorage.setItem('feature_useClientAI', JSON.stringify({ value: false, expiresAt: Date.now() + 86400000 }))
 * 
 * - To clear override:
 *   localStorage.removeItem('feature_useClientAI')
 */
export function getFeatureWithOverride(featureName) {
  // Check localStorage for override
  const overrideKey = `feature_${featureName}`;
  const override = localStorage.getItem(overrideKey);
  
  if (override) {
    try {
      const parsed = JSON.parse(override);
      
      // Check if override has expired
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        localStorage.removeItem(overrideKey);
        return DEFAULT_FEATURES[featureName];
      }
      
      return parsed.value;
    } catch (error) {
      console.warn(`Invalid feature override for ${featureName}:`, error);
      localStorage.removeItem(overrideKey);
    }
  }
  
  // Return default value
  return DEFAULT_FEATURES[featureName];
}

/**
 * Get all feature flags (for debugging)
 */
export function getAllFeatures() {
  const features = {};
  
  for (const key in DEFAULT_FEATURES) {
    features[key] = getFeatureWithOverride(key);
  }
  
  return features;
}

/**
 * Set feature override (for testing)
 */
export function setFeatureOverride(featureName, value, durationMs = 86400000) {
  const override = {
    value,
    expiresAt: Date.now() + durationMs
  };
  
  localStorage.setItem(`feature_${featureName}`, JSON.stringify(override));
}

/**
 * Clear feature override
 */
export function clearFeatureOverride(featureName) {
  localStorage.removeItem(`feature_${featureName}`);
}

/**
 * Clear all feature overrides
 */
export function clearAllFeatureOverrides() {
  Object.keys(localStorage)
    .filter(key => key.startsWith('feature_'))
    .forEach(key => localStorage.removeItem(key));
}