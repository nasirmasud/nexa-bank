import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  loadingCount: number;
};

const initialState: UiState = {
  sidebarOpen: false,
  theme: "system",
  loadingCount: 0,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme(state, action: PayloadAction<UiState["theme"]>) {
      state.theme = action.payload;
    },
    incrementLoading(state) {
      state.loadingCount += 1;
    },
    decrementLoading(state) {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
    },
  },
});

export const { setSidebarOpen, toggleSidebar, setTheme, incrementLoading, decrementLoading } =
  uiSlice.actions;
export default uiSlice.reducer;
