import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type TransactionFilters = {
  page: number;
  pageSize: number;
  type?: string;
  status?: string;
  search?: string;
};

type TransactionState = {
  filters: TransactionFilters;
};

const initialState: TransactionState = {
  filters: {
    page: 1,
    pageSize: 10,
  },
};

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setTransactionFilters(state, action: PayloadAction<Partial<TransactionFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetTransactionFilters(state) {
      state.filters = initialState.filters;
    },
  },
});

export const { setTransactionFilters, resetTransactionFilters } = transactionSlice.actions;
export default transactionSlice.reducer;
