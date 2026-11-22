import { baseApi } from "./baseApi";

export type AppSettings = {
  id: number;
  dailyTransferLimit: string;
  maxSingleTransaction: string;
  minAccountBalance: string;
  transferFeePercent: string;
  minTransferFee: string;
  loanIncomeMultiplier: number;
  loanInterestRates: Record<string, number>;
  updatedById: string | null;
  updatedAt: string;
};

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<{ data: AppSettings }, void>({
      query: () => "/admin/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: build.mutation<
      { data: AppSettings },
      Partial<
        Pick<
          AppSettings,
          "dailyTransferLimit" | "maxSingleTransaction" | "minAccountBalance" | "minTransferFee"
        >
      > & { transferFeePercent?: number }
    >({
      query: (body) => ({ url: "/admin/settings", method: "PATCH", body }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
