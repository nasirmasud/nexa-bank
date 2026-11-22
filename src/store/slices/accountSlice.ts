import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AccountState = {
  activeAccountId: string | null;
};

const initialState: AccountState = {
  activeAccountId: null,
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setActiveAccountId(state, action: PayloadAction<string | null>) {
      state.activeAccountId = action.payload;
    },
  },
});

export const { setActiveAccountId } = accountSlice.actions;
export default accountSlice.reducer;
