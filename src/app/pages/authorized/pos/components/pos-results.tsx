import React from "react";
import { ProductDetails } from "types/inventory";
import ProductImage from "../../shared/product-image";
import { CartItem } from "types/pos";
import LoadingComponent from "app/pages/shared/loading.component";
import { useDispatch, useSelector } from "react-redux";
import { setViewProductId } from "store/slices/viewProductSlice";
import { useNavigate } from "react-router";
import { RootState } from "store/store";
import ProductStatus from "../../search-products/components/product-status";
import Status from "./status";
import { formatAmount } from "helpers";

type POSResultsProps = {
  addToCart: (product: CartItem) => void;
  removeCartItem: (productId: string) => void;
  results?: ProductDetails[];
  cartItems?: CartItem[];
  loading: boolean;
};

const POSResults = ({
  results,
  addToCart,
  cartItems = [],
  loading,
  removeCartItem,
}: POSResultsProps) => {
  const role = useSelector((state: RootState) => state.user.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const renderLoadingState = () => <LoadingComponent height="h-[200px]" />;

  const onClickView = (itemId: string, e: any) => {
    e.stopPropagation();
    dispatch(setViewProductId(itemId));
    navigate(`/${role}/view-product`);
  };

  const renderResults = () => {
    return (
      <>
        {results?.map((result) => {
          const isOutOfStock = result.quantityRemaining <= 0;
          const matchingCartItem = cartItems?.find(
            (cartItem) => cartItem._id === result._id
          );
          const hasCount = (matchingCartItem?.count ?? 0) > 0;
          const cartItemIndex = cartItems?.findIndex(
            (item) => item._id === result._id
          );
          return (
            <div
              onClick={() => {
                if (!isOutOfStock) {
                  cartItemIndex > -1
                    ? removeCartItem(result?._id ?? "")
                    : addToCart(result);
                }
              }}
              className={`shadow-sm rounded cursor-pointer border border-gray-200 hover:border-primary ${
                isOutOfStock ? "pointer-events-none opacity-50" : ""
              }`}
              title={isOutOfStock ? "Out of stock" : result?.name}
            >
              <ProductImage
                imageTransform="w_200,h_200,c_thumb"
                product={result}
                height="aspect-square"
                borderRadius="rounded-md"
              >
                {hasCount && (
                  <div className="flex p-2 bg-primary-lightGreen text-primary-green rounded-md text-sm font-semibold justify-center justify-self-end">
                    <img
                      src="/images/check-circle-green.svg"
                      alt="added"
                      className="h-4 w-4"
                    />
                  </div>
                )}
              </ProductImage>
              <div className="flex">
                <div className="p-2 flex flex-col w-full overflow-hidden">
                  <button
                    title="View Details"
                    onClick={(e) => onClickView(result._id ?? "", e)}
                    className="line-clamp-2 font-semibold text-sm text-primary text-left mb-1"
                  >
                    {result.name}
                  </button>
                  <p className="line-clamp-1 font-medium text-primary text-xs text-left mb-1">
                    {result.partNumber ?? "-"}
                  </p>
                  <Status justify="justify-start" status={result?.status} />
                  <p className="line-clamp-1 font-medium text-primary text-xs text-left my-1">
                    {result?.price ? formatAmount(result?.price || 0) : "-"}
                  </p>
                  <div className="flex items-end justify-end mt-1">
                    <p className="font-medium text-primary text-xs">
                      Stock:{" "}
                      <span className="font-semibold">
                        {result.quantityRemaining}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return loading ? (
    renderLoadingState()
  ) : (
    <div className="grid grid-cols-4 gap-4 max-mobile:grid-cols-2 p-2">
      {renderResults()}
    </div>
  );
};

export default POSResults;
