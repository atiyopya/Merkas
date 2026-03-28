// Centeralized API Configuration for Merkas Business Automation
const isProd = import.meta.env.PROD;

// Set your Render/Cloud backend URL here once deployed
// Example: 'https://merkas-api.onrender.com'
const PROD_API_URL = 'https://merkas.onrender.com'; 

export const API_BASE_URL = isProd && PROD_API_URL 
  ? PROD_API_URL 
  : `http://${window.location.hostname}:5000`;

export const SOCKET_URL = isProd && PROD_API_URL 
  ? PROD_API_URL 
  : `http://${window.location.hostname}:5000`;
