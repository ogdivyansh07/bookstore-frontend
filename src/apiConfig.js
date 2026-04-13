const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://bookstore-backend-1-qz9s.onrender.com";

console.log("[apiConfig] API_BASE_URL:", API_BASE_URL);

export const BOOKS_URL = `${API_BASE_URL}/books`;
export const ORDERS_URL = `${API_BASE_URL}/orders`;
export const ADMIN_LOGIN_URL = `${API_BASE_URL}/admin/login`;
export const TOKEN_STORAGE_KEY = "bookstore_admin_jwt";
