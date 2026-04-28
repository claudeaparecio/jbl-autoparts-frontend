import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthHandler } from "../rtk-base-query";
import { SKU } from "types/sku";

type GetSKUsResponse = {
  data: {
    skus: SKU[];
  };
  meta?: any;
};

type CreateSKUsRequest = {
  skus: string[];
};

type GetCheckSKUResponse = {
  status: string;
  exists: boolean;
};

type DeleteSKUResponse = {
  status: "success";
  message: "SKU deleted successfully.";
};

export const skusApi = createApi({
  reducerPath: "skusApi",
  baseQuery: baseQueryWithAuthHandler,
  tagTypes: ["SKUs"],
  endpoints: (builder) => ({
    getSKUs: builder.query<GetSKUsResponse, void>({
      query: () => `api/v1/skus`,
      providesTags: ["SKUs"],
    }),
    checkSKU: builder.query<GetCheckSKUResponse, string>({
      query: (sku) => `api/v1/skus/checker/${sku}`,
    }),
    createSKUs: builder.mutation<void, CreateSKUsRequest>({
      query: (skus) => ({
        url: "api/v1/skus/bulk",
        method: "POST",
        body: skus,
      }),
      invalidatesTags: ["SKUs"],
    }),
    deleteSKU: builder.mutation<DeleteSKUResponse, string>({
      query: (skuId) => ({
        url: `api/v1/skus/${skuId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SKUs"],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetSKUsQuery,
  useGetSKUsQuery,
  useCreateSKUsMutation,
  useLazyCheckSKUQuery,
  useDeleteSKUMutation,
} = skusApi;
