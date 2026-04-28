import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useLazyGetProductsQuery } from "store/apis/productsApi";
import { setGlobalFilter, setPageIndex, setPageSize, setResults, setTotal } from "store/slices/searchSlice";
import { RootState } from "store/store";
import Results from "./components/results";
import * as Sentry from '@sentry/react';

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="flex">
      <div className="flex flex-row border-secondary-light border rounded-md items-center p-2 rounded-xl w-[500px]">
        <img
          src="/images/search.svg"
          alt="search"
          className="h-[20px] w-[20px] mr-2"
        />
        <input
          {...props}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="form-input rounded px-2 py-1.5 focus:outline-none focus:ring-0 w-full"
        />
      </div>
    </div>
  );
}

const SearchProducts = () => {
  const dispatch = useDispatch();
  const search = useSelector((state: RootState) => state.search);
  const { globalFilter, pageIndex, pageSize, total, results } = search;

  const [trigger, productsResponse] = useLazyGetProductsQuery();

  const [isLoading, setIsLoading] = useState(true);

  const refreshTable = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await trigger({
        page: pageIndex,
        limit: pageSize,
        search: globalFilter,
        status: "",
      });
      _setTotal(response.data?.data?.pagination?.total ?? 0);
      dispatch(setResults(response.data?.data.products ?? []));
      setIsLoading(false);
    } catch (error) {
      toast.error("Something went wrong, try again later.");
      setIsLoading(false);
      Sentry.captureException(error);
    }
  }, [pageIndex, pageSize, globalFilter]);

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

    useEffect(() => {
      refreshTable();
    }, [pageIndex, pageSize, globalFilter]);

  return (
    <div className="flex flex-col p-5 py-4 max-full">
      <div className="flex justify-center items-center">
        <DebouncedInput
          value={globalFilter}
          onChange={(value) => _setGlobalFilter(String(value))}
          className="w-full p-2 font-lg shadow border border-block"
          placeholder="Search here..."
        />
      </div>
      <Results
        results={results}
      />
    </div>
  );
};

export default SearchProducts;
