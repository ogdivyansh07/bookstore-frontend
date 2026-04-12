const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://bookstore-backend-1-qz9s.onrender.com";

export const BOOKS_URL = `${API_BASE_URL}/books`;
export const ADMIN_LOGIN_URL = `${API_BASE_URL}/admin/login`;
export const TOKEN_STORAGE_KEY = "bookstore_admin_jwt";
