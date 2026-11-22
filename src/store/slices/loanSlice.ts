import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LoanFilters = {
  status?: string;
  page: number;
  pageSize: number;
};

type LoanState = {
  filters: LoanFilters;
  wizardDraft: Record<string, unknown> | null;
};

const initialState: LoanState = {
  filters: {
    page: 1,
    pageSize: 10,
  },
  wizardDraft: null,
};

const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    setLoanFilters(state, action: PayloadAction<Partial<LoanFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setLoanWizardDraft(state, action: PayloadAction<Record<string, unknown> | null>) {
      state.wizardDraft = action.payload;
    },
    resetLoanState(state) {
      state.filters = initialState.filters;
      state.wizardDraft = null;
    },
  },
});

export const { setLoanFilters, setLoanWizardDraft, resetLoanState } = loanSlice.actions;
export default loanSlice.reducer;
