import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuthHandler } from '../rtk-base-query'
import { User } from 'types/user';

type GetUsersResponse = {
  data: {
    users: User[];
  }
};

export type GetUserResponse = {
  data: User;
};

type GetUsersRequest = {
  role?: string;
};

// type PostUserRequest = {
//   username: string;
//   password: string;
//   role: string;
//   name: string
// }

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithAuthHandler,
  tagTypes: ["Users", "UserDetails"],
  endpoints: (builder) => ({
    signIn: builder.mutation<any, { username: string; password: string }>({
      query: ({ username, password }) => ({
        url: 'api/v1/users/login',
        method: 'POST',
        body: { username, password },
      }),
    }),
    signOut: builder.mutation<any, void>({
      query: () => ({
        url: 'api/v1/users/logout',
        method: 'POST',
      }),
    }),
    signUp: builder.mutation<any, User>({
      query: (user) => ({
        url: 'api/v1/users/signup',
        method: 'POST',
        body: user,
      }),
    }),
    activateUser: builder.mutation<any, string>({
      query: (userId) => ({
        url: `api/v1/users/activate/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: ["Users"],
    }),
    deactivateUser: builder.mutation<any, string>({
      query: (userId) => ({
        url: `api/v1/users/deactivate/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: ["Users"],
    }),
    changePassword: builder.mutation<any, {userId: string; newPassword: string; }>({
      query: ({userId, newPassword}) => ({
        url: `api/v1/users/change-password/${userId}`,
        method: 'POST',
        body: {
          newPassword
        }
      }),
    }),
    updateUserDetails: builder.mutation<any, {userId: string; name: string; username: string}>({
      query: ({userId, name, username}) => ({
        url: `api/v1/users/update-details/${userId}`,
        method: 'POST',
        body: {
          name,
          username,
        }
      }),
      invalidatesTags: ["Users", "UserDetails"],
    }),
    getUsers: builder.query<GetUsersResponse, GetUsersRequest>({
      query: ({ role }) => ({
        url: `api/v1/users?${role ? 'role='+ role : ""}`,
        method: 'GET',
      }),
      providesTags: ["Users"],
    }),
    getUserDetails: builder.query<GetUserResponse, void>({
      query: () => ({
        url: `api/v1/users/details`,
        method: 'GET',
      }),
      providesTags: ["UserDetails"],
    }),
  }),
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
  useLazyGetUsersQuery,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useChangePasswordMutation,
  useUpdateUserDetailsMutation,
  useLazyGetUserDetailsQuery,
} = userApi;
