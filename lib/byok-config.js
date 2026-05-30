/**
 * BYOK (Bring Your Own Key) Configuration System
 * Manages Modal, Supabase, and Gemini API credentials
 * 
 * This module provides a centralized way to access and validate
 * user-provided API keys and endpoints.
 */

/**
 * Get Modal endpoint for single thumbnail analysis
 * @returns {string} Modal endpoint URL
 * @throws {Error} If endpoint is not configured
 */
export function getModalEndpoint() {
  const endpoint = process.env.NEXT_PUBLIC_MODAL_ENDPOINT_URL || 
                   process.env.MODAL_ENDPOINT_URL;
  
  if (!endpoint) {
    throw new Error(
      'MODAL_ENDPOINT_URL is not configured. ' +
      'Please set it in your .env.local file. ' +
      'See README.md for setup instructions.'
    );
  }
  
  return endpoint;
}

/**
 * Get Modal endpoint for channel analysis
 * If not explicitly set, derives from single thumbnail endpoint
 * @returns {string} Modal channel endpoint URL
 */
export function getModalChannelEndpoint() {
  let endpoint = process.env.NEXT_PUBLIC_MODAL_CHANNEL_ENDPOINT_URL || 
                 process.env.MODAL_CHANNEL_ENDPOINT_URL;
  
  if (!endpoint) {
    // Auto-derive from single thumbnail endpoint
    const baseEndpoint = getModalEndpoint();
    endpoint = baseEndpoint.replace('-analyze.modal.run', '-analyze-channel.modal.run');
  }
  
  return endpoint;
}

/**
 * Get Supabase configuration
 * @returns {Object} Supabase URL and credentials
 * @throws {Error} If Supabase is not configured
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'in your .env.local file. See README.md for setup instructions.'
    );
  }
  
  return { url, anonKey };
}

/**
 * Get Gemini API key (optional)
 * @returns {string|null} Gemini API key or null if not configured
 */
export function getGeminiApiKey() {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
}

/**
 * Check if Gemini is enabled
 * @returns {boolean} True if Gemini API key is configured
 */
export function isGeminiEnabled() {
  return !!getGeminiApiKey();
}

/**
 * Validate all required BYOK configurations
 * @returns {Object} Validation result with status and messages
 */
export function validateByokConfig() {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check Modal
  try {
    getModalEndpoint();
  } catch (error) {
    result.isValid = false;
    result.errors.push(error.message);
  }

  // Check Supabase
  try {
    getSupabaseConfig();
  } catch (error) {
    result.isValid = false;
    result.errors.push(error.message);
  }

  // Check Gemini (optional)
  if (!isGeminiEnabled()) {
    result.warnings.push(
      'Gemini API key is not configured. YouTube Strategist Audit will be disabled.'
    );
  }

  return result;
}

/**
 * Get a sanitized configuration object for debugging
 * (never includes actual secret values)
 * @returns {Object} Configuration status without secrets
 */
export function getConfigStatus() {
  return {
    modal: {
      endpoint: !!process.env.NEXT_PUBLIC_MODAL_ENDPOINT_URL,
      channelEndpoint: !!process.env.NEXT_PUBLIC_MODAL_CHANNEL_ENDPOINT_URL,
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    gemini: {
      enabled: isGeminiEnabled(),
    },
  };
}
