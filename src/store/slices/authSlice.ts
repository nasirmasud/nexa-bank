import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  user: { id: string; name: string; email: string; role: "ADMIN" | "STAFF" | "CUSTOMER" } | null;
};

const initialState: AuthState = { user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthState["user"]>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.user = null;
    },
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
