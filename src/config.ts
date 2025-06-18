// API Configuration
export const API_CONFIG = {
  apiKey: 'pmp_service_key_2024',
  baseUrl: 'http://localhost:3030',
  endpoints: {
    questions: '/api/pmp-questions'
  }
};

/**
 * Get the full API URL for a given endpoint
 * @param endpoint The API endpoint path
 * @returns The complete API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseUrl}${endpoint}`;
} 