import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'quincaillerie_auth';

const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const stored = typeof window !== 'undefined' ? readStoredSession() : null;

const initialState = {
  token: stored?.token || null,
  user: stored?.user || null,
  isAuthenticated: Boolean(stored?.token),
};

const persistSession = ({ token, user }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  localStorage.setItem('token', token);
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('token');
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      persistSession(action.payload);
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      clearSession();
    },
    setUser(state, action) {
      state.user = action.payload;
      if (state.token) persistSession({ token: state.token, user: action.payload });
    },
    restoreSession(state) {
      const session = readStoredSession();
      state.token = session?.token || null;
      state.user = session?.user || null;
      state.isAuthenticated = Boolean(session?.token);
    },
  },
});

export const { loginSuccess, logout, setUser, restoreSession } = authSlice.actions;
export default authSlice.reducer;
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectUserRole = (state) => state.auth.user?.role;
