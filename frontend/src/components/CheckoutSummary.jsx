import React from "react";

const CheckoutSummary = ({
  cartTotalPrice,
  deliveryCharge,
  distance,
  taxes,
  convenienceFees,
  selectedCoupon,
  totalAmount,
  walletApplied,
  finalPayableAmount,
  isFoodOrder,
  discount,
  getGroceryServiceCharge,
  walletBalance,
  useWallet,
  setUseWallet,
}) => {

  return (
    <div className="mb-6 space-y-2">
      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
        Order Summary 🛒
      </h3>

      <div className="flex justify-between">
        <span>Cart Total:</span>
        <span className="text-green-500 font-semibold">
          ₹{cartTotalPrice.toFixed(2)}
        </span>
      </div>

      {isFoodOrder ? (
        <>
          <div className="flex justify-between">
            <span>Delivery Fee {distance > 0 && (<span>({distance.toFixed(2)} Km)</span>)} 🚚:</span>
            <span className="text-green-500 font-semibold">{deliveryCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (5%) 💰:</span>
            <span className="text-green-500 font-semibold">
              ₹{taxes.toFixed(2)}
            </span>
          </div>
          {convenienceFees > 0 && (
            <div className="flex justify-between">
              <span>Multi-store Fee ⚡:</span>
              <span className="text-green-500 font-semibold">
                ₹{convenienceFees.toFixed(2)}
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between">
            <span>Service Charge 📝:</span>
            <span className="text-green-500 font-semibold">
              {getGroceryServiceCharge(cartTotalPrice).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee {distance > 0 && (<span>({distance.toFixed(2)} Km)</span>)} 🚚:</span>
            <span className="text-green-500 font-semibold">{deliveryCharge.toFixed(2)}</span>
          </div>
        </>
      )}


      {selectedCoupon && discount > 0 && (
        <div className="flex justify-between text-green-600 font-semibold">
          <span>Coupon ({selectedCoupon.coupon.name}) 🎟️:</span>
          <span>- ₹{discount.toFixed(2)}</span>
        </div>
      )}

      <div className="h-[1px] bg-gray-300 dark:bg-gray-600 my-2"></div>
      <div className="flex justify-between text-lg font-bold">
        <span>Order Total:</span>
        <span className="text-gray-800 dark:text-gray-100">
          ₹{totalAmount.toFixed(2)}
        </span>
      </div>

      {walletApplied > 0 && (
        <div className="flex justify-between text-green-600 font-semibold py-1">
          <span>Wallet Balance Applied 💳:</span>
          <span>- ₹{walletApplied.toFixed(2)}</span>
        </div>
      )}

      {walletBalance > 0 && (
        <div className="flex items-center gap-2 mt-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer transition hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setUseWallet(!useWallet)}>
          <input
            type="checkbox"
            checked={useWallet}
            onChange={(e) => setUseWallet(e.target.checked)}
            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
          />
          <span className="text-gray-800 dark:text-gray-200 font-medium select-none">
            Use Wallet Balance (₹{walletBalance.toFixed(2)} available)
          </span>
        </div>
      )}

      <div className="h-[1px] bg-gray-300 dark:bg-gray-600 my-2"></div>
      <div className="flex justify-between text-xl font-extrabold">
        <span>Amount To Pay:</span>
        <span className="text-green-600">
          ₹{finalPayableAmount.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default CheckoutSummary;
