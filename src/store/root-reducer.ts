import { combineReducers } from "@reduxjs/toolkit";

import inventoryReducer from "./slices/inventorySlice";
import skusReducer from "./slices/skusSlice";
import editProductReducer from "./slices/editProductSlice";
import addProductReducer from "./slices/addProductSlice";
import posReducer from "./slices/posSlice";
import viewProductReducer from "./slices/viewProductSlice";
import userReducer from "./slices/userSlice";
import appReducer from "./slices/appSlice";
import searchReducer from "./slices/searchSlice";
import dashboardReducer from "./slices/dashboardSlice";

import { skusApi } from "store/apis/skusApi";
import { userApi } from "./apis/userApi";
import { productsApi } from "./apis/productsApi";

import { persistReducer } from "redux-persist";
import { adminApi } from "./apis/adminApi";
import { transactionsApi } from "./apis/transactionsApi";

import storageSession from "redux-persist/lib/storage/session";

const userPersistConfig = {
  key: "user",
  storage: storageSession,
};

const searchPersistConfig = {
  key: "search",
  storage: storageSession,
};

const appPersistConfig = {
  key: "app",
  storage: storageSession,
};

const editProductPersistConfig = {
  key: "editProduct",
  storage: storageSession,
};

const viewProductPersistConfig = {
  key: "viewProduct",
  storage: storageSession,
};

const addProductPersistConfig = {
  key: "addProduct",
  storage: storageSession,
};

const dashboardPersistConfig = {
  key: "pos",
  storage: storageSession,
};

export default combineReducers({
  // reducers
  app: persistReducer(appPersistConfig, appReducer),
  skus: skusReducer,
  inventory: inventoryReducer,
  editProduct: persistReducer(editProductPersistConfig, editProductReducer),
  addProduct: persistReducer(addProductPersistConfig, addProductReducer),
  pos: posReducer,
  viewProduct: persistReducer(viewProductPersistConfig, viewProductReducer),
  user: persistReducer(userPersistConfig, userReducer),
  search: persistReducer(searchPersistConfig, searchReducer),
  dashboard: persistReducer(dashboardPersistConfig, dashboardReducer),

  // APIs
  [skusApi.reducerPath]: skusApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [productsApi.reducerPath]: productsApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
  [transactionsApi.reducerPath]: transactionsApi.reducer,
});
