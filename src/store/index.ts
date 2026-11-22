import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import { loadingMiddleware } from "./middleware/loadingMiddleware";
import accountReducer from "./slices/accountSlice";
import authReducer from "./slices/authSlice";
import loanReducer from "./slices/loanSlice";
import notificationReducer from "./slices/notificationSlice";
import transactionReducer from "./slices/transactionSlice";
import uiReducer from "./slices/uiSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      account: accountReducer,
      auth: authReducer,
      loan: loanReducer,
      notification: notificationReducer,
      transaction: transactionReducer,
      ui: uiReducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware, loadingMiddleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
