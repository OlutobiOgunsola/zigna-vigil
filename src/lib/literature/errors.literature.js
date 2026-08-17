module.exports = {
  AUTH_ERROR_MESSAGES: {
    NOT_AUTHENTICATED: 'Not authenticated. Please log in.',
    INVALID_CREDENTIALS: 'Invalid credentials provided.',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    TOKEN_INVALID: 'Invalid authentication token.',
  },

  BUSINESS_ENTITY_ERROR_MESSAGES: {
    NO_CONTEXT:
      'No business context provided. Include an X-Gym-Id or X-Hotel-Id header.',
    GYM_NOT_FOUND: 'The specified gym was not found.',
    HOTEL_NOT_FOUND: 'The specified hotel was not found.',
    NO_MEMBERSHIP: 'You are not a member of this business entity.',
    SUSPENDED: 'This business entity has been suspended.',
  },

  TOOL_ERROR_MESSAGES: {
    NOT_FOUND: 'The requested tool does not exist.',
    UNAUTHORIZED: 'You do not have permission to use this tool.',
    INCOMPATIBLE_BUSINESS_TYPE:
      'This tool is not available for the current business type.',
    EXECUTION_FAILED: 'The tool failed to execute. Please try again.',
    NO_AI_PROVIDER: 'AI provider is not configured. Check AI_PROVIDER env var.',
    AI_PROVIDER_FAILED: 'The AI provider is currently unavailable.',
    AI_NO_TOOL_RESOLVED: 'The AI could not determine an action for your request.',
  },

  SERVER_ERROR_MESSAGES: {
    GENERIC_ERROR: 'An unknown error occurred. Please try again later.',
  },
};
