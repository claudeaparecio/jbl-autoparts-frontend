import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthHandler } from "../rtk-base-query";
import { ProductDetails } from "types/inventory";

const apiURL = process.env.REACT_APP_API_BASE_URL;

type GetProductsResponse = {
  data: {
    products: ProductDetails[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};

type GetProductsByStatusResponse = {
  data: ProductDetails[];
};

type GetProductsRequest = {
  search?: string;
  page: number;
  limit: number;
  status?: string;
  noVariant?: boolean;
};

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: baseQueryWithAuthHandler,
  tagTypes: ["Products", "Product"],
  endpoints: (builder) => ({
    createProduct: builder.mutation<any, FormData>({
      query: (product) => ({
        url: "api/v1/products",
        method: "POST",
        body: product,
      }),
      invalidatesTags: ["Products"],
    }),
    getProducts: builder.query<GetProductsResponse, GetProductsRequest>({
      query: ({ limit, page, search, status, noVariant }) => ({
        url: `api/v1/products?page=${page +
          1}&limit=${limit}&search=${search}&status=${status}&noVariant=${noVariant}`,
      }),
      providesTags: ["Products"],
    }),
    editProduct: builder.mutation<any, { productId: string; formData: FormData }>({
      query: ({ formData, productId }) => ({
        url: `api/v1/products/${productId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, arg) => [
        "Products",
        { type: "Product", id: arg.productId },
      ],
    }),
    getProductById: builder.query<any, { productId: string }>({
      query: ({ productId }) => ({
        url: `api/v1/products/${productId}`,
        method: "GET",
      }),
      providesTags: (result, error, arg) => [{ type: "Product", id: arg.productId }],
    }),
    getProductByStatus: builder.query<any, string>({
      query: (status) => ({
        url: `api/v1/products/products-by-status?status=${status}`,
        method: "GET",
      }),
      providesTags: ["Products"],
      transformResponse: (response: GetProductsByStatusResponse) => {
        return {
          ...response,
          data: response.data.map(product => ({
            ...product,
            images: product.images.map(image => `${apiURL}${image}`)
          }))
        };
      },
    }),
    deleteProduct: builder.mutation<any, string>({
      query: (productId) => ({
        url: `api/v1/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useEditProductMutation,
  useDeleteProductMutation,
  useLazyGetProductByIdQuery,
  useLazyGetProductByStatusQuery,
} = productsApi;
