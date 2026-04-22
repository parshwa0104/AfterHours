/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: authClient.js — JWT client helper
=============================================================================
*
* Responsibility:
* - Call auth endpoints
* - Store/retrieve JWT
* - Provide a reusable `authFetch` for protected API routes
*/

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TOKEN_KEY = 'afterhours.jwt';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token) => {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
};

export const authFetch = async (path, options = {}) => {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return response;
};

export const register = async ({ displayName, email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Registration failed.');
  }

  setStoredToken(payload.token);
  return payload;
};

export const login = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Login failed.');
  }

  setStoredToken(payload.token);
  return payload;
};

export const getMe = async () => {
  const response = await authFetch('/api/auth/me');
  if (!response.ok) {
    throw new Error('Not authenticated.');
  }

  return response.json();
};

export const logout = () => setStoredToken(null);
