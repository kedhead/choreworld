// API Configuration
const API_CONFIG = {
  // Development API URL (local server)
  development: 'http://localhost:3001',
  
  // Production API URL - Your deployed backend on Render
  production: import.meta.env.VITE_API_URL || 'https://choreworld.onrender.com',
  
  // Current environment
  environment: import.meta.env.MODE || 'development'
};

// Get the appropriate API base URL
export const getApiUrl = () => {
  return API_CONFIG[API_CONFIG.environment];
};

// Export the base URL for axios configuration
export const API_BASE_URL = getApiUrl();

console.log('🔗 API Configuration:', {
  environment: API_CONFIG.environment,
  apiUrl: API_BASE_URL
});