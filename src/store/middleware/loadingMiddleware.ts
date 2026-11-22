import { isFulfilled, isPending, isRejected, type Middleware } from "@reduxjs/toolkit";
import { decrementLoading, incrementLoading } from "@/store/slices/uiSlice";

export const loadingMiddleware: Middleware = (storeApi) => (next) => (action) => {
  if (isPending(action)) {
    storeApi.dispatch(incrementLoading());
  } else if (isFulfilled(action) || isRejected(action)) {
    storeApi.dispatch(decrementLoading());
  }

  return next(action);
};
