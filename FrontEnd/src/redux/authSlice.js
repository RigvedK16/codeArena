// filepath: FrontEnd/src/redux/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Initial state for auth
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Create auth slice with actions
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    // Set user after successful login
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    // Clear user on logout
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    // Set error message
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setUser, clearUser, setError } = authSlice.actions;
export default authSlice.reducer;
