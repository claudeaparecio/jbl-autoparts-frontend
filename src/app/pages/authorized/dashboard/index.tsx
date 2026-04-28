import { useLazyGetSKUsQuery } from "store/apis/skusApi";
import StatisticCards from "../shared/statistic-cards";
import RecentTransactionsTable from "./components/recent-transactions";
import SalesChart from "./components/sales-chart";
import TopSalesChart from "./components/top-sales-chart";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import {
  useCancelTransactionMutation,
  useLazyGetSalesStatisticsQuery,
  useLazyGetTransactionsQuery,
  useReturnTransactionMutation,
  useUpdateTransactionMutation,
} from "store/apis/transactionsApi";
import {
  setGlobalFilter,
  setPageIndex,
  setPageSize,
  setSalesStatistics,
  setTotal,
} from "store/slices/dashboardSlice";
import ViewInvoiceModal from "../shared/view-invoice.modal";
import { Transaction } from "types/transaction";
import { setIsAppLoading } from "store/slices/appSlice";
import { setTransaction } from "store/slices/posSlice";
import { CartItem } from "types/pos";
import { User } from "types/user";
import { useNavigate } from "react-router";
import * as Sentry from '@sentry/react';

const Dashboard = () => {
  const state = useSelector((state: RootState) => state);
  const app = state.app;
  const role = state.user.role;
  const dashboard = state.dashboard;
  const isMobile = app.isMobile;
  const pageIndex = dashboard.pageIndex;
  const globalFilter = dashboard.globalFilter;
  const pageSize = dashboard.pageSize;
  const total = dashboard.total;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [getSkus, { data, error, isLoading }] = useLazyGetSKUsQuery();
  const [getTransactions, transactionsResponse] = useLazyGetTransactionsQuery();
  const [
    getSalesStatistics,
    statisticsResponse,
  ] = useLazyGetSalesStatisticsQuery();
  const [cancelTransaction, cancelResponse] = useCancelTransactionMutation();
  const [updateTransaction, updateResponse] = useUpdateTransactionMutation();
  const [returnTransaction, returnResponse] = useReturnTransactionMutation();

  const [transactions, setTransactions] = useState<Transaction[]>();
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<Transaction>();

  const onCancelTransaction = async (txn?: Transaction) => {
    dispatch(setIsAppLoading(true));
    try {
      const response: any = await cancelTransaction(txn?._id ?? "");
      if (response?.error) {
        toast.error(response.error?.data?.message ?? "");
        dispatch(setIsAppLoading(false));
        return;
      }

      toast.success(response.data?.message ?? "Transaction cancelled");
      await refreshTransactions();
      onCloseViewInvoiceModal();
      dispatch(setIsAppLoading(false));
    } catch (error) {
      console.log(error);
      Sentry.captureException(error);
      toast.error("Something went wrong, try again later.");
      dispatch(setIsAppLoading(false));
    }
  };

  const onProcessTransaction = (txn?: Transaction) => {
    dispatch(setIsAppLoading(true));
    const items = txn?.items?.map((item: any) => ({
      ...item.product,
      count: item.count,
    }));
    dispatch(
      setTransaction({
        cartItems: items as CartItem[],
        partsman: txn?.partsman as User,
        transactionId: txn?._id,
        globalFilter: "",
        activeTab: "invoicing",
        discountAmount: txn?.discount ?? 0,
      })
    );
    toggleShowViewInvoiceModal();
    dispatch(setIsAppLoading(false));
    navigate(`/${role}/pos`);
  };

  const onReturnTransaction = async (txn?: Transaction) => {
    dispatch(setIsAppLoading(true));
    try {
      const response: any = await returnTransaction(txn?._id ?? '');
      if (response?.error) {
        toast.error(response.error?.data?.message ?? "");
        dispatch(setIsAppLoading(false));
        return;
      }
      toast.success("Transaction returned!");
      await refreshTransactions();
      onCloseViewInvoiceModal();
      dispatch(setIsAppLoading(false));
    } catch (error) {
      console.log(error);
      Sentry.captureException(error);
      toast.error("Something went wrong, try again later.");
      dispatch(setIsAppLoading(false));
    }
  };

  const fetchSalesStatistics = async () => {
    const response = await getSalesStatistics();
    dispatch(setSalesStatistics(response.data?.data));
  };

  const refreshTransactions = useCallback(async () => {
    try {
      const response = await getTransactions({
        page: pageIndex,
        limit: pageSize,
        search: globalFilter,
      });
      dispatch(setTotal(response.data?.data?.pagination?.total ?? 0));
      setTransactions(response.data?.data.transactions);
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Something went wrong, try again later.");
    }
  }, [pageIndex, pageSize, globalFilter]);

  useEffect(() => {
    getSkus();
    fetchSalesStatistics();
  }, []);

  useEffect(() => {
    refreshTransactions();
  }, [pageIndex, pageSize, globalFilter]);

  const toggleShowViewInvoiceModal = () => {
    setShowViewInvoiceModal((val) => !val);
  };

  const onCloseViewInvoiceModal = () => {
    setViewTransaction(undefined);
    toggleShowViewInvoiceModal();
  };

  const viewTransactionDetails = (txn: Transaction) => {
    setViewTransaction(txn);
    toggleShowViewInvoiceModal();
  };

  useEffect(() => {
    if (error) {
      const errMessage = "Something went wrong while fetching SKUs";
      toast.error(errMessage);
    }
  }, [error]);

  const _setGlobalFilter = (val: string) => {
    dispatch(setGlobalFilter(val));
  };

  const _setPageIndex = (val: number) => {
    dispatch(setPageIndex(val));
  };

  const _setPageSize = (val: number) => {
    dispatch(setPageSize(val));
  };

  return (
    <div className="flex flex-col p-5 py-4 max-full">
      <p className="text-primary font-semibold text-4xl">Dashboard</p>
      <StatisticCards
        isLoading={transactionsResponse.isFetching}
        statistics={statisticsResponse.data?.data}
      />
      <div className="flex flex-row max-lg-custom:flex-col gap-4">
        <div className="w-2/3 max-lg-custom:w-full shadow-lg rounded-lg pb-5">
          <SalesChart
            isLoading={transactionsResponse.isFetching}
            statistics={statisticsResponse.data?.data}
          />
        </div>
        <div className="w-1/3 max-lg-custom:w-full shadow-lg rounded-lg">
          <TopSalesChart
            isLoading={transactionsResponse.isFetching}
            topSellingProducts={
              statisticsResponse.data?.data?.top_selling_products_by_period
            }
          />
        </div>
      </div>
      <p className="text-primary font-semibold text-2xl mt-2 mt-5">
        Recent Transactions
      </p>
      <RecentTransactionsTable
        isMobile={isMobile}
        globalFilter={globalFilter}
        isLoading={transactionsResponse.isFetching}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setGlobalFilter={_setGlobalFilter}
        setPageIndex={_setPageIndex}
        setPageSize={_setPageSize}
        total={total}
        transactions={transactions}
        viewTransactionDetails={viewTransactionDetails}
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

export default Dashboard;
