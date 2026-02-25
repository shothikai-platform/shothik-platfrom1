// sheetApiSlice.js - Updated to use new Sheet Service Backend (Port 3003)
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const SHEET_SERVICE_URL = process.env.NEXT_PUBLIC_SHEET_SERVICE_URL || 'http://localhost:3003';

export const sheetApiSlice = createApi({
  reducerPath: "sheetApi",
  baseQuery: fetchBaseQuery({
    baseUrl: SHEET_SERVICE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["SheetJob", "MySheets"],
  endpoints: (builder) => ({
    // Create new sheet generation job
    createSheet: builder.mutation({
      query: (body) => ({
        url: '/sheets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ["SheetJob"],
    }),

    // Get sheet job status
    getSheetJob: builder.query({
      query: (jobId) => `/sheets/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: "SheetJob", id: jobId }],
    }),

    // Get my sheets (placeholder - would need backend endpoint)
    getMySheets: builder.query({
      query: () => "/sheets", // This would need to be implemented in backend
      providesTags: ["MySheets"],
    }),

    // Export sheet
    exportSheet: builder.query({
      query: ({ jobId, format }) => `/sheets/${jobId}/export/${format}`,
    }),
  }),
});

export const {
  useCreateSheetMutation,
  useGetSheetJobQuery,
  useGetMySheetsQuery,
  useExportSheetQuery,
} = sheetApiSlice;

export default sheetApiSlice;
