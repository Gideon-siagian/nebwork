// Centralized API Configuration
// Update BASE_URL here to change all API endpoints globally

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5001';

// AUTH ENDPOINTS
export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/auth/login`,
  LOGOUT: `${BASE_URL}/api/auth/logout`,
  PROFILE: `${BASE_URL}/api/auth/profile`,
  FORGOT_PASSWORD: `${BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/api/auth/reset-password`,
  CHANGE_PASSWORD: `${BASE_URL}/api/auth/change-password`,
  REQUEST_RESET: `${BASE_URL}/api/auth/request-reset`,
  RESET_STATUS: (requestId) => `${BASE_URL}/api/auth/reset-status/${requestId}`,
};

// WORKLOG ENDPOINTS
export const WORKLOG_ENDPOINTS = {
  LIST: `${BASE_URL}/api/worklogs`,                    // GET all, POST create
  ONE: (id) => `${BASE_URL}/api/worklogs/${id}`,       // GET, PUT, DELETE single
  FILTER: `${BASE_URL}/api/worklogs/filter`,          // GET user logs
  VERSIONS: (id) => `${BASE_URL}/api/worklogs/${id}/versions`, // GET, POST versions
  LOGHISTORY_ONE: (id) => `${BASE_URL}/api/worklogs/loghistory/${id}`, // GET Single Log
  COLLABORATORS: (id) => `${BASE_URL}/api/worklogs/${id}/collaborators`,
  VIDEO_MEETING: (id) => `${BASE_URL}/api/worklogs/${id}/video-meeting`,
  MY_STATS: `${BASE_URL}/api/worklogs/my-stats`,      // GET user stats
};

// ADMIN ENDPOINTS
export const ADMIN_ENDPOINTS = {
  EMPLOYEES: `${BASE_URL}/api/admin/employees`,                // GET all, DELETE user
  EMPLOYEE: (id) => `${BASE_URL}/api/admin/employees/${id}`,   // GET single user
  TOGGLE_STATUS: (id) => `${BASE_URL}/api/admin/employees/${id}/toggle-status`, // PATCH toggle block/unblock
  VERSION: (id) => `${BASE_URL}/api/admin/employees/${id}/versions`,  // GET single user
  ANALYTICS: `${BASE_URL}/api/admin/analytics`,
  RESET_REQUESTS: `${BASE_URL}/api/admin/reset-requests`,
  APPROVE_RESET: (id) => `${BASE_URL}/api/admin/reset-requests/${id}/approve`,
  REJECT_RESET: (id) => `${BASE_URL}/api/admin/reset-requests/${id}/reject`,
};

// CHATBOT ENDPOINTS
export const CHATBOT_ENDPOINTS = {
  SEND_MESSAGE: `${BASE_URL}/api/chatbot`,
  GET_MESSAGES: (sessionId) => `${BASE_URL}/api/chatbot/session/${sessionId}`,
  DELETE_SESSION: (sessionId) => `${BASE_URL}/api/chatbot/session/${sessionId}`,
  GET_HISTORY: `${BASE_URL}/api/chatbot/history`,
};

export const ASSISTANT_ENDPOINTS = {
  SEND_MESSAGE: `${BASE_URL}/api/assistant/chat`,
  GET_MESSAGES: (sessionId) => `${BASE_URL}/api/assistant/sessions/${sessionId}`,
  DELETE_SESSION: (sessionId) => `${BASE_URL}/api/assistant/sessions/${sessionId}`,
  GET_HISTORY: `${BASE_URL}/api/assistant/history`,
};

export const NOTIFICATION_ENDPOINTS = {
  LIST: `${BASE_URL}/api/notifications`,
  ACCEPT: (id) => `${BASE_URL}/api/notifications/${id}/accept`,
  REJECT: (id) => `${BASE_URL}/api/notifications/${id}/reject`,
};

// UPLOAD ENDPOINTS
export const UPLOAD_ENDPOINTS = {
  SINGLE: `${BASE_URL}/api/upload`,
  MULTIPLE: `${BASE_URL}/api/upload/multiple`,
  DELETE: `${BASE_URL}/api/upload`,
  DELETE_MULTIPLE: `${BASE_URL}/api/upload/multiple`,
};

// Export base URL for direct use
export default BASE_URL;

