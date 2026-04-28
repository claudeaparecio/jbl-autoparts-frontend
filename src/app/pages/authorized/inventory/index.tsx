import {
  useDeleteProductMutation,
  useLazyGetProductsQuery,
} from "store/apis/productsApi";
import StatisticCards from "../shared/statistic-cards";
import Table from "../shared/inventory-table";
import { useCallback, useEffect, useState } from "react";
import Modal from "../shared/modal";
import { ProductDetails } from "types/inventory";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import {
  setGlobalFilter,
  setPageIndex,
  setPageSize,
  setStatus,
  setTotal,
} from "store/slices/inventorySlice";
import * as Sentry from '@sentry/react';

const Inventory = () => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state);

  const app = state.app;
  const isMobile = app.isMobile;
  const user = state.user;
  const isAdmin = user.role === 'admin'

  const { globalFilter, pageIndex, pageSize, status, total } = state.inventory;

  const [trigger, productsResponse] = useLazyGetProductsQuery();
  const [deleteProduct, deleteResponse] = useDeleteProductMutation();
  const [withVaraint, setWithVariant] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [productToDelete, setProductToDelete] = useState<
    ProductDetails | undefined
  >();

  const _setPageIndex = (val: number) => {
    dispatch(setPageIndex(val));
  };

  const _setPageSize = (val: number) => {
    dispatch(setPageSize(val));
  };

  const _setTotal = (val: number) => {
    dispatch(setTotal(val));
  };

  const _setGlobalFilter = (val: string) => {
    dispatch(setGlobalFilter(val));
  };

  const _setStatus = (val: any) => {
    dispatch(setStatus(val));
  };

  const refreshTable = useCallback(async (withVaraint?: boolean) => {
    setIsLoading(true);
    try {
      const response = await trigger({
        page: pageIndex,
        limit: pageSize,
        search: globalFilter,
        status: status.value,
        noVariant: !withVaraint,
      });
      _setTotal(response.data?.data?.pagination?.total ?? 0);
      setProducts(response.data?.data.products ?? []);
      setIsLoading(false);
    } catch (error) {
      toast.error("Something went wrong, try again later.");
      setIsLoading(false);
      Sentry.captureException(error);
    }
  }, [pageIndex, pageSize, globalFilter, status.value, withVaraint]);

  useEffect(() => {
    refreshTable(withVaraint);
  }, [pageIndex, pageSize, globalFilter, status.value, withVaraint]);

  const resetDeleteProduct = () => {
    setProductToDelete(undefined);
  };

  const _deleteProduct = async () => {
    await deleteProduct(productToDelete?._id ?? "");
    resetDeleteProduct();
    refreshTable(withVaraint);
    toast.success("Delete Success");
  };

  const toggleWithVariant = () => {
    refreshTable(!withVaraint);
    setWithVariant((prev) => !prev);
  };

  const loading = isLoading || productsResponse.isFetching || productsResponse.isLoading;

  return (
    <div className="flex flex-col p-5 py-4 w-full">
      <p className="text-primary font-semibold text-4xl">Inventory</p>
      {isAdmin && <StatisticCards />}
      <div className="flex flex-row mt-2">
        <div className="w-full flex items-center">
          <p className="text-primary font-semibold text-2xl">Products</p>
          <button className="items-center ml-2" onClick={() => refreshTable(withVaraint)}>
            <img
              className="h-[15px] w-[15px]"
              src="/images/refresh.svg"
              alt="refresh"
            />
          </button>
        </div>
        <div className="w-full flex items-center justify-end">
          <input
            type="checkbox"
            id="noVariant"
            name="noVariant"
            value={withVaraint ? "true" : "false"}
            defaultChecked
            onClick={toggleWithVariant}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="noVariant" className="text-sm ml-2 font-semibold text-primary">
            With Variant
          </label>
        </div>
      </div>
      <Table
        isAdmin={isAdmin}
        globalFilter={globalFilter}
        setGlobalFilter={_setGlobalFilter}
        isLoading={loading}
        total={total ?? 0}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageIndex={_setPageIndex}
        setPageSize={_setPageSize}
        isMobile={isMobile}
        products={products}
        setProductToDelete={setProductToDelete}
        status={status}
        setStatus={_setStatus}
      />
      <Modal
        isOpen={!!productToDelete?._id}
        onSubmit={_deleteProduct}
        onClose={resetDeleteProduct}
        title="Delete Product?"
      >
        {deleteResponse.isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-solid" />
          </div>
        ) : (
          <>
            <p className="text-primary text-md">
              Product Name:
              <span className="block font-semibold text-xl">{productToDelete?.name}</span>
            </p>
            <p className="text-primary text-md">
              Part Number:
              <span className="block font-semibold text-xl">{productToDelete?.partNumber}</span>
            </p>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
