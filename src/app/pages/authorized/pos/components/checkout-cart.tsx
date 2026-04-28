import { formatAmount } from "helpers";
import React, { useCallback } from "react";
import toast from "react-hot-toast";
import { CartItem } from "types/pos";
import { User } from "types/user";

type CheckoutCartProps = {
  cartItems: CartItem[];
  removeCartItem: (itemId: string) => void;
  setCartItems: (val: any) => void;
  discountAmount: number;
  setDiscountAmount: (val: number) => void;
  toggleDeleteCartModal: () => void;
  toggleShowReservedItemsModal: () => void;
  toggleShowPartsmanModal: () => void;
  onRemovePartsman: () => void;
  onPay: () => void;
  partsman?: User;
  hasTransactionId: boolean;
};

const CheckoutCart = ({
  cartItems,
  removeCartItem,
  setCartItems,
  discountAmount,
  setDiscountAmount,
  toggleDeleteCartModal,
  toggleShowReservedItemsModal,
  toggleShowPartsmanModal,
  onRemovePartsman,
  onPay,
  partsman,
  hasTransactionId,
}: CheckoutCartProps) => {
  const hasPartsman = !!partsman?._id;
  const [tempDiscountAmount, setTempDiscountAmount] = React.useState<
    number | string
  >(discountAmount);

  const getTotalAmount = useCallback(() => {
    const totalAmount = cartItems?.reduce((total, item) => {
      return total + Number(item.count) * Number(item.price);
    }, 0);
    return totalAmount;
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    const totalAmount = cartItems?.reduce((total, item) => {
      return total + Number(item.count);
    }, 0);
    return totalAmount;
  }, [cartItems]);

  const handleIncrement = (index: number) => {
    setCartItems(
      cartItems.map((item, i) => {
        if (i === index) {
          if ((item.count ?? 0) + 1 > item.quantityRemaining) {
            toast.error("Cannot exceed stock quantity.", {
              position: "top-center",
            });
            return item;
          }
          return { ...item, count: (item.count ?? 0) + 1 };
        }
        return item;
      })
    );
  };

  const handleDecrement = (index: number) => {
    setCartItems(
      cartItems?.reduce((acc: CartItem[], item, i) => {
        if (i === index) {
          const newCount = (item.count ?? 0) - 1;
          if (newCount <= 0) {
            return acc; // remove item
          }
          acc.push({ ...item, count: newCount });
          return acc;
        }
        acc.push(item);
        return acc;
      }, [])
    );
  };

  const total = formatAmount(getTotalAmount() - discountAmount);

  const hasDiscount = discountAmount > 0;

  const renderPartsman = () =>
    hasPartsman ? (
      <div className="flex flex-row items-center">
        <p className="text-xs">Partsman:</p>
        <p className="text-xs">{partsman.name}</p>
        <button
          onClick={onRemovePartsman}
          title="Remove"
          className="text-gray-500 hover:text-red-700 text-xs px-2"
        >
          ✕
        </button>
      </div>
    ) : (
      <button onClick={toggleShowPartsmanModal} className="underline text-xs">
        Choose Partsman
      </button>
    );

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable cart list */}
      <div className="flex-1 overflow-y-auto">
        {cartItems.map((item, index) => (
          <div className="flex items-center rounded border-b border-gray-200 hover:bg-gray-50 px-3 py-2">
            <div className="flex items-center w-24 shrink-0">
              <button
                onClick={() => handleDecrement(index)}
                className="bg-primary-lightRed text-primary-red hover:bg-primary-red hover:text-white rounded-l text-sm font-medium px-2 py-1"
              >
                -
              </button>
              <p className="w-10 text-center text-gray-800 font-semibold text-sm border-y py-1">
                {item?.count ?? 0}
              </p>
              <button
                onClick={() => handleIncrement(index)}
                className="bg-primary-lightGreen text-primary-green border hover:bg-primary-green hover:text-white  rounded-r text-sm font-semibold px-2 py-1"
              >
                +
              </button>
            </div>
            <p
              title={item.name}
              className="flex-1 text-sm font-medium text-gray-700 line-clamp-2 px-2"
            >
              {item.name}
            </p>
            <p className="w-20 text-right font-semibold text-sm text-gray-800">
              {formatAmount(item.price ?? 0)}
            </p>
            <button
              onClick={() => removeCartItem(item._id ?? "")}
              className="text-gray-500 hover:text-red-700 text-lg px-2"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Fixed total */}
      <div className="p-3 border-t space-y-3">
        <div className="flex justify-between font-semibold text-sm text-primary">
          <span>{getTotalItems()} items</span>
          {renderPartsman()}
        </div>
        <div className="flex justify-between font-semibold text-md text-primary">
          <span>Sub-total</span>
          <span>{formatAmount(getTotalAmount())}</span>
        </div>
        {hasDiscount && (
          <div className="flex justify-between font-semibold text-sm text-red-700 justify-self-end">
            - {formatAmount(discountAmount)}
          </div>
        )}
        <div className="flex justify-between items-center gap-2">
          <label className="text-sm font-semibold text-primary">
            Discount
            <label className="text-xs text-gray-400 font-semibold ml-1">
              (amount)
            </label>
          </label>
          <div className="flex flex-row items-center space-x-1">
            <input
              value={tempDiscountAmount}
              onChange={(e) => {
                // Allow any raw string (e.g., "-", "", "001") while typing
                setTempDiscountAmount(e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  let value = Number(e.currentTarget.value);

                  // Clamp negative values and invalid entries
                  if (isNaN(value) || value < 0) value = 0;

                  setDiscountAmount(value);
                  setTempDiscountAmount(String(value)); // Sync back the cleaned value
                }
              }}
              onBlur={(e) => {
                let value = Number(e.target.value);

                // Clamp negative values and invalid entries
                if (isNaN(value) || value < 0) value = 0;

                setDiscountAmount(value); // Final numeric discount

                setTempDiscountAmount(String(value)); // Sync back the cleaned value
              }}
              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between font-bold text-xl text-primary px-3 pb-3">
        <span>Total</span>
        <span className="text-primary-green">{total}</span>
      </div>
      <div className="grid grid-rows-2 gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleDeleteCartModal}
            className="bg-primary-lightRed text-primary-red hover:bg-primary-red hover:text-white border font-bold text-xl rounded-md py-2"
          >
            CANCEL
          </button>
          <button
            onClick={toggleShowReservedItemsModal}
            className="bg-primary-lightYellow text-primary-yellow border font-bold text-xl rounded-md py-2 hover:bg-primary-yellow hover:text-white"
          >
            RESERVE
          </button>
        </div>
        <button
          onClick={onPay}
          className="bg-primary-lightGreen text-primary-green border hover:bg-primary-green hover:text-white font-bold text-xl rounded-md py-2"
        >
          PAY
        </button>
      </div>
    </div>
  );
};

export default CheckoutCart;
