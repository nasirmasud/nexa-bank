import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UiState = { sidebarOpen: boolean; theme: "light" | "dark" | "system" };
const initialState: UiState = { sidebarOpen: false, theme: "system" };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; },
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setTheme(state, action: PayloadAction<UiState["theme"]>) { state.theme = action.payload; },
  },
});

export const { setSidebarOpen, toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
