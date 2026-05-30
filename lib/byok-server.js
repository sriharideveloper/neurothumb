/**
 * Server-side BYOK Configuration
 * Handles secure credential management for backend services
 */

/**
 * Get Modal API credentials for backend deployment
 * @returns {Object} Modal token ID and secret
 */
export function getModalCredentials() {
  return {
    tokenId: process.env.MODAL_TOKEN_ID || null,
    tokenSecret: process.env.MODAL_TOKEN_SECRET || null,
  };
}

/**
 * Get Supabase service role key (server-only)
 * @returns {string} Service role key
 * @throws {Error} If not configured
 */
export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
      'This is required for server-side database operations.'
    );
  }
  
  return key;
}

/**
 * Get Supabase URL (server-side)
 * @returns {string} Supabase project URL
 * @throws {Error} If not configured
 */
export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not configured. ' +
      'Please set it in your .env.local file.'
    );
  }
  
  return url;
}

/**
 * Get Gemini API key (server-side)
 * @returns {string|null} Gemini API key or null if not configured
 */
export function getGeminiApiKeyServer() {
  return process.env.GEMINI_API_KEY || null;
}

/**
 * Validate server-side BYOK configuration
 * @returns {Object} Validation result
 */
export function validateServerByokConfig() {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check Supabase
  try {
    getSupabaseUrl();
    getSupabaseServiceRoleKey();
  } catch (error) {
    result.isValid = false;
    result.errors.push(error.message);
  }

  // Check Modal credentials (optional for deployment)
  const modalCreds = getModalCredentials();
  if (!modalCreds.tokenId || !modalCreds.tokenSecret) {
    result.warnings.push(
      'Modal credentials not configured. ' +
      'Programmatic deployment will not be available.'
    );
  }

  // Check Gemini (optional)
  if (!getGeminiApiKeyServer()) {
    result.warnings.push(
      'Gemini API key not configured. ' +
      'Advanced text analysis features will be disabled.'
    );
  }

  return result;
}
