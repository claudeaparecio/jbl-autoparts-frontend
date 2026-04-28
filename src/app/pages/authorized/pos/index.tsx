import React, { useCallback, useEffect, useState } from "react";
import DebouncedInput from "app/pages/shared/debounced-input";
import POSResults from "./components/pos-results";
import { useLazyGetProductsQuery } from "store/apis/productsApi";
import toast from "react-hot-toast";
import { CartItem } from "types/pos";
import CheckoutCart from "./components/checkout-cart";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import {
  clearCart,
  setCartItems,
  setResults,
  setGlobalFilter,
  setPartsman,
  setTransactionid,
  setTransaction,
  setDiscountAmount,
  setActiveTab,
} from "store/slices/posSlice";
import DeleteCartModal from "./components/delete-cart.modal";
import ReserveItemsModal from "./components/reserve.items.modal";
import InvoicingHistoryTab from "./components/invoicing-history";
import { useLazyGetUsersQuery } from "store/apis/userApi";
import { User } from "types/user";
import PartsmanModal from "./components/partsman.modal";
import {
  useCancelTransactionMutation,
  useCreateTransactionMutation,
  useLazyGetMyStatisticsQuery,
  useLazyGetMyTransactionsQuery,
  useReturnTransactionMutation,
  useUpdateTransactionMutation,
} from "store/apis/transactionsApi";
import { setIsAppLoading } from "store/slices/appSlice";
import UpdateTransactionModal from "./components/update-transaction.modal";
import { Transaction } from "types/transaction";
import ViewInvoiceModal from "../shared/view-invoice.modal";
import * as Sentry from '@sentry/react';

const tabs = ["invoicing", "history"];

const POSPage = () => {
  const dispatch = useDispatch();

  const [trigger, productsResponse] = useLazyGetProductsQuery();
  const [getUsers, usersResponse] = useLazyGetUsersQuery();
  const [createTransaction] = useCreateTransactionMutation();
  const [getMyTransactions, transactionsResponse] =
    useLazyGetMyTransactionsQuery();
  const [getMyStatistics, statisticsResponse] = useLazyGetMyStatisticsQuery();
  const [cancelTransaction, cancelResponse] = useCancelTransactionMutation();
  const [updateTransaction, updateResponse] = useUpdateTransactionMutation();
  const [returnTransaction, returnResponse] = useReturnTransactionMutation();

  const state = useSelector((state: RootState) => state);
  const pos = state.pos;
  const user = state.user;
  const isAdmin = user.role === "admin";
  const filter = pos.globalFilter;
  const searchResult = pos.results;
  const cartItems = pos.cartItems;
  const selectedPartsman = pos.partsman;
  const id = pos.transactionId;
  const discountAmount = pos.discountAmount;
  const activeTab = pos.activeTab;
  const transactionItems = pos.transactionItems;

  const statistics = statisticsResponse.data?.data;

  const [transactions, setTransactions] = useState();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 0,
    limit: 10,
    totalPages: 0,
  });
  const [transactionFilter, setTransactionFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteCart, setShowDeleteCart] = useState(false);
  const [showReserveItemsModal, setShowReserveItemsModal] = useState(false);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [showPartsmanModal, setShowPartsmanModal] = useState(false);
  const [partsmanUsers, setPartsmanUsers] = useState<User[]>([]);
  const [updateTransactionStatusModal, setUpdateTransactionStatusModal] =
    useState(false);
  const [selectedTransactionToUpdate, setSelectedTransactionToUpdate] =
    useState<Transaction>();

  const [viewTransaction, setViewTransaction] = useState<Transaction>();

  const fetchTransactions = useCallback(
    async (page = pagination.page, limit = pagination.limit) => {
      try {
        const response: any = await getMyTransactions({
          isAdmin,
          page,
          limit,
          search: transactionFilter,
        });
        setTransactions(response?.data?.data);
        setPagination(response?.data?.pagination);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        Sentry.captureException(err);
      }
    },
    [pagination.page, pagination.limit, transactionFilter]
  );

  const _setActiveTab = (val: string) => {
    dispatch(setActiveTab(val));
  };

  const _setDiscountAmount = (val: number) => {
    dispatch(setDiscountAmount(val));
  };

  const toggleUpdateTransactionStatusModal = () => {
    setUpdateTransactionStatusModal((val) => !val);
  };

  const viewTransactionDetails = (txn: Transaction) => {
    setViewTransaction(txn);
    toggleShowViewInvoiceModal();
  };

  const onCloseViewInvoiceModal = () => {
    setViewTransaction(undefined);
    toggleShowViewInvoiceModal();
  };

  const toggleShowViewInvoiceModal = () => {
    setShowViewInvoiceModal((val) => !val);
  };

  const toggleDeleteCartModal = () => {
    setShowDeleteCart((val) => !val);
  };

  const onSelectPartsman = (partsman: User) => {
    dispatch(setPartsman(partsman));
    toggleShowPartsmanModal();
  };

  const onRemovePartsman = () => {
    dispatch(setPartsman({}));
  };

  const toggleShowReservedItemsModal = () => {
    setShowReserveItemsModal((val) => !val);
  };

  const toggleShowPartsmanModal = () => {
    setShowPartsmanModal((val) => !val);
  };

  const _clearCart = (hideModal?: boolean) => {
    dispatch(clearCart());
    onRemovePartsman();
    if (!hideModal) {
      toggleDeleteCartModal();
    }
  };

  const getTotalAmount = useCallback(() => {
    const totalAmount = cartItems?.reduce((total, item) => {
      return total + Number(item.count) * Number(item.price);
    }, 0);
    return totalAmount;
  }, [cartItems]);

  const updateTransactionStatus = (txn: Transaction) => {
    setSelectedTransactionToUpdate(txn);
    toggleUpdateTransactionStatusModal();
  };

  const onCloseUpdateTransaction = () => {
    toggleUpdateTransactionStatusModal();
    setSelectedTransactionToUpdate(undefined);
  };

  const onProcessTransaction = useCallback(async () => {
    dispatch(setIsAppLoading(true));
    const items = selectedTransactionToUpdate?.items?.map((item: any) => ({
      _id: item?.product?._id,
      count: item?.count,
    }));

    let transactionDetails = {
      items,
      status: "completed",
    };

    try {
      const response: any = await updateTransaction({
        id: selectedTransactionToUpdate?._id ?? "",
        payload: transactionDetails,
      });
      if (response?.error) {
        toast.error(response.error?.data?.message ?? "");
        dispatch(setIsAppLoading(false));
        return;
      }
      toast.success("Transaction completed!");
      await fetchTransactions();
      toggleUpdateTransactionStatusModal();
      dispatch(setIsAppLoading(false));
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong, try again later.");
      dispatch(setIsAppLoading(false));
      Sentry.captureException(error);
    }
  }, [selectedTransactionToUpdate]);

  const onReturnTransaction = useCallback(async () => {
    dispatch(setIsAppLoading(true));
    try {
      const response: any = await returnTransaction(
        selectedTransactionToUpdate?._id ?? ""
      );
      if (response?.error) {
        toast.error(response.error?.data?.message ?? "");
        dispatch(setIsAppLoading(false));
        return;
      }
      toast.success("Transaction returned!");
      await fetchTransactions();
      toggleUpdateTransactionStatusModal();
      dispatch(setIsAppLoading(false));
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong, try again later.");
      dispatch(setIsAppLoading(false));
      Sentry.captureException(error);
    }
  }, [selectedTransactionToUpdate]);

  const onCancelTransaction = useCallback(async () => {
    dispatch(setIsAppLoading(true));

    try {
      const response: any = await cancelTransaction(
        selectedTransactionToUpdate?._id ?? ""
      );
      if (response?.error) {
        toast.error(response.error?.data?.message ?? "");
        dispatch(setIsAppLoading(false));
        return;
      }

      toast.success(response.data?.message ?? "Transaction cancelled");
      await fetchTransactions();
      refreshResults();
      toggleUpdateTransactionStatusModal();
      dispatch(setIsAppLoading(false));
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong, try again later.");
      dispatch(setIsAppLoading(false));
      Sentry.captureException(error);
    }
  }, [selectedTransactionToUpdate]);

  const onReserve = async () => {
    dispatch(setIsAppLoading(true));
    const items = cartItems.map((item) => ({
      _id: item._id,
      count: item.count,
    }));

    let transactionDetails = {
      items,
      cashier: user.id,
      total: getTotalAmount() - discountAmount,
      discount: discountAmount,
      status: "reserved",
      partsman: selectedPartsman?._id ?? undefined,
    };

    try {
      if (id) {
        const response: any = await updateTransaction({
          id,
          payload: transactionDetails,
        });
        if (response?.error) {
          toast.error(response.error?.data?.message ?? "");
          dispatch(setIsAppLoading(false));
          return;
        }
        toast.success("Reservation updated!");
      } else {
        const response: any = await createTransaction(transactionDetails);
        if (response?.error) {
          toast.error(response.error?.data?.message ?? "");
          dispatch(setIsAppLoading(false));
          return;
        }
        toast.success("Transaction reserved!");
      }
      _clearCart(true);
      await fetchTransactions();
      toggleShowReservedItemsModal();
      refreshResults();
      dispatch(setIsAppLoading(false));
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong, try again later.");
      dispatch(setIsAppLoading(false));
      Sentry.captureException(error);
    }
  };

  const onPay = async () => {
    dispatch(setIsAppLoading(true));
    const items = cartItems.map((item) => ({
      _id: item._id,
      count: item.count,
    }));

    let transactionDetails = {
      items,
      cashier: user.id,
      total: getTotalAmount() - discountAmount,
      discount: discountAmount,
      status: "completed",
      partsman: selectedPartsman?._id ?? undefined,
    };

    try {
      let response: any;
      if (id) {
        response = await updateTransaction({
          id,
          payload: transactionDetails,
        });
      } else {
        response = await createTransaction(transactionDetails);
      }

      if (response?.error) {
        toast.error(response.error?.data?.message ?? "");
        dispatch(setIsAppLoading(false));
        return;
      }
      _clearCart(true);
      toast.success("Transaction complete!");
      await fetchTransactions();
      await getMyStatistics();
      refreshResults();
      dispatch(setIsAppLoading(false));
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong, try again later.");
      dispatch(setIsAppLoading(false));
      Sentry.captureException(error);
    }
  };

  const _setCartItems = (items: CartItem[]) => {
    dispatch(setCartItems(items));
  };
  const setFilter = (value: any) => {
    dispatch(setGlobalFilter(value));
  };

  const refreshResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await trigger({
        page: 0,
        limit: 30,
        search: filter,
        status: "",
      });
      dispatch(setResults(response.data?.data.products ?? []));
      setIsLoading(false);
    } catch (error) {
      toast.error("Something went wrong, try again later.");
      setIsLoading(false);
      Sentry.captureException(error);
    }
  }, [filter]);

  useEffect(() => {
    refreshResults();
  }, [filter]);

  const fetchPartsmanUsers = async () => {
    const response = await getUsers({ role: "partsman" });
    setPartsmanUsers(response.data?.data.users ?? []);
  };

  useEffect(() => {
    fetchPartsmanUsers();
    fetchTransactions();
    getMyStatistics();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [transactionFilter]);

  const addToCart = (item: CartItem) => {
    const cartIndex = cartItems.findIndex(
      (cartItem) => cartItem._id === item._id
    );
    const existingCount = cartIndex !== -1 ? cartItems[cartIndex].count : 0;

    if (existingCount && existingCount >= item.quantityRemaining) {
      toast.error("Cannot exceed stock quantity.", {
        position: "top-center",
      });
      return;
    }

    if (cartIndex !== -1) {
      _setCartItems(
        cartItems.map((i, index) =>
          cartIndex === index
            ? {
                ...i,
                count: (i?.count ?? 0) + 1,
              }
            : i
        )
      );
    } else {
      _setCartItems([
        ...cartItems,
        {
          ...item,
          count: 1,
        },
      ]);
    }
  };

  const removeCartItem = (itemId: string) => {
    _setCartItems(cartItems.filter((item) => item._id !== itemId));
  };

  const renderEmptyCart = () => {
    return (
      <div className="flex items-center justify-center h-full flex-col">
        <p className="font-semibold text-2xl text-center">
          Ready for next customer
        </p>
        <p className="font-medium text-md text-center px-10 text-gray-500">
          To start, select items to be added to cart.
        </p>
      </div>
    );
  };

  const renderInvoicing = () => (
    <>
      <div className="basis-3/5 flex-col shadow-lg rounded-md col-span-2 px-2 pb-2 overflow-scroll">
        <div className="sticky top-0 z-10 bg-white py-2">
          <DebouncedInput
            value={filter}
            onChange={(value) => setFilter(String(value))}
            className="w-full p-2 font-lg shadow border border-block"
            placeholder="Search here..."
            containerWidth="w-full"
            width="w-full"
          />
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          <POSResults
            loading={isLoading}
            cartItems={cartItems}
            results={searchResult}
            addToCart={addToCart}
            removeCartItem={removeCartItem}
          />
        </div>
      </div>
      <div className="basis-2/5 flex-col shadow-lg rounded-md col-span-1 p-2 overflow-scroll">
        {cartItems.length > 0 ? (
          <CheckoutCart
            onPay={onPay}
            setCartItems={_setCartItems}
            removeCartItem={removeCartItem}
            cartItems={cartItems}
            discountAmount={discountAmount}
            setDiscountAmount={_setDiscountAmount}
            toggleDeleteCartModal={toggleDeleteCartModal}
            toggleShowReservedItemsModal={toggleShowReservedItemsModal}
            toggleShowPartsmanModal={toggleShowPartsmanModal}
            partsman={selectedPartsman}
            onRemovePartsman={onRemovePartsman}
            hasTransactionId={!!id}
          />
        ) : (
          renderEmptyCart()
        )}
      </div>
    </>
  );

  const renderHistory = () => (
    <InvoicingHistoryTab
      updateTransactionStatus={updateTransactionStatus}
      statistics={statistics}
      transactions={transactions}
      statisticsLoading={statisticsResponse.isLoading}
      transactionsLoading={transactionsResponse.isFetching}
      viewTransactionDetails={viewTransactionDetails}
      transactionFilter={transactionFilter}
      setTransactionFilter={setTransactionFilter}
    />
  );

  const renderPagination = () => (
    <div className="flex items-center justify-end gap-2 mt-2 text-primary font-medium mb-2">
      <button
        className="border rounded p-1"
        onClick={() => fetchTransactions(1)}
        disabled={pagination.page === 1}
      >
        {"<<"}
      </button>
      <button
        className="border rounded p-1"
        onClick={() => fetchTransactions(pagination.page - 1)}
        disabled={pagination.page === 1}
      >
        {"<"}
      </button>
      <button
        className="border rounded p-1"
        onClick={() => fetchTransactions(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages}
      >
        {">"}
      </button>
      <button
        className="border rounded p-1"
        onClick={() => fetchTransactions(pagination.totalPages)}
        disabled={pagination.page === pagination.totalPages}
      >
        {">>"}
      </button>
      <span className="flex items-center gap-1">
        <div>Page</div>
        <strong>
          {pagination.page} of {pagination.totalPages}
        </strong>
      </span>
      <select
        value={pagination.limit}
        onChange={(e) => {
          const newLimit = Number(e.target.value);
          fetchTransactions(1, newLimit); // Reset to page 1 on page size change
        }}
      >
        {[10, 20, 30, 40, 50, 100].map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex flex-col p-5 w-full h-screen">
      <p className="text-primary font-semibold text-4xl">Point of Sale</p>
      <div className="flex space-x-4 border-b justify-between">
        <div>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`py-2 px-4 text-sm font-medium capitalize ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => _setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "history" && renderPagination()}
      </div>
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "invoicing" && renderInvoicing()}
        {activeTab === "history" && renderHistory()}
      </div>
      <DeleteCartModal
        isOpen={showDeleteCart}
        onClose={toggleDeleteCartModal}
        onDelete={_clearCart}
      />
      <ReserveItemsModal
        isOpen={showReserveItemsModal}
        onClose={toggleShowReservedItemsModal}
        onReserve={onReserve}
      />
      <UpdateTransactionModal
        isOpen={updateTransactionStatusModal}
        onCancel={onCancelTransaction}
        onReturn={onReturnTransaction}
        onCloseUpdateTransaction={onCloseUpdateTransaction}
        onProcess={onProcessTransaction}
        invoice={selectedTransactionToUpdate}
      />
      <PartsmanModal
        isOpen={showPartsmanModal}
        partsmanUsers={partsmanUsers}
        onClose={toggleShowPartsmanModal}
        onSelect={onSelectPartsman}
      />
      <ViewInvoiceModal
        onCancelTransaction={onCancelTransaction}
        onProcessTransaction={onProcessTransaction}
        onReturnTransaction={onReturnTransaction}
        isOpen={showViewInvoiceModal}
        onClose={onCloseViewInvoiceModal}
        invoice={viewTransaction}
      />
    </div>
  );
};

export default POSPage;
