const BASE_URL = 'http://localhost:8000/api';

let _token = null;

export function setToken(token) {
  _token = token;
  if (token) localStorage.setItem('artha_token', token);
}

export function setUser(user) {}

export function getToken() {
  return _token || localStorage.getItem('artha_token');
}

export function clearAuth() {
  _token = null;
  localStorage.removeItem('artha_token');
}

export async function checkBackend() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch (e) {
    return false;
  }
}

export const api = {
  async post(path, body) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(err.detail || 'Request failed');
      }
      return res.json();
    } catch (e) {
      if (e.message === 'Failed to fetch') throw new Error('Backend offline');
      throw e;
    }
  },

  async get(path) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
};
