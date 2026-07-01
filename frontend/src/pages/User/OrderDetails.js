import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoClose,
  IoDocumentTextOutline,
} from "react-icons/io5";
import { FaMotorcycle, FaMapMarkerAlt, FaListUl } from "react-icons/fa";
import Navbar from "../../components/Navbar";
import ReviewSection from "../../components/ReviewSection";
import { ToastContainer, toast } from "react-toastify";
import { IoIosCart, IoIosArrowDown } from "react-icons/io";
import DownloadInvoiceButton from "../../components/DownloadInvoiceButton";
import api from "../../utils/axiosInstance";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import DeliveryTimeline from "../../components/DeliveryTimeline";
import { motion, AnimatePresence } from "framer-motion";
import { HiDocumentCurrencyRupee } from "react-icons/hi2";
import DeliveryAlert from "../../components/DeliveryAlert";

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [openItems, setOpenItems] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/order/getOrderDetails/${orderId}`, {
        withCredentials: true,
      });

      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || "Order not found!");
      }
    } catch (err) {
      setError("Failed to fetch order details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    fetchOrderDetails();

    interval = setInterval(() => {
      if (
        order?.deliveryStatus !== "Delivered" &&
        order?.deliveryStatus !== "Cancelled"
      ) {
        fetchOrderDetails();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [orderId, order?.deliveryStatus]);

  const refreshOrder = async () => {
    await fetchOrderDetails();
    toast.success("Order status updated");
  };

  const getStatusMessage = () => {
    switch (order?.deliveryStatus) {
      case "Processing":
        return "✅ Your order has been placed.";
      case "Preparing":
        return order.orderType === "Food"
          ? "👨‍🍳 Your order is being freshly prepared"
          : "📦 Your order is getting packed nicely.";
      case "Out For Delivery":
        return "🛵 Your order is on the way";
      case "Delivered":
        return "🎉 Delivered successfully — enjoy your meal!";
      case "Cancelled":
        return "❌ This order was cancelled";
      default:
        return "📦 Order received";
    }
  };

  const getETAStatus = () => {
    if (
      !order?.expectedDeliveryTime ||
      order?.deliveryStatus === "Delivered" ||
      order?.deliveryStatus === "Cancelled"
    ) {
      return null;
    }

    const now = new Date();
    const eta = new Date(order?.expectedDeliveryTime);
    const diffMs = eta - now;
    const diffMins = Math.ceil(diffMs / (1000 * 60));

    if (diffMins <= 0) {
      return { label: "Almost There", time: "Expected Soon" };
    }
    return {
      label:
        order?.deliveryStatus === "Out For Delivery"
          ? "Order on its way"
          : "Preparing your order",
      time: `Expected in ${diffMins} mins`,
    };
  };

  const totals = useMemo(() => {
    if (!order) return {};
    return {
      amount: order.amount || 0,
      taxes: order.taxes || 0,
      deliveryCharge: order.deliveryCharge || 0,
      serviceCharge: order.serviceCharge || 0,
      discount: order.discount || 0,
      totalAmount: order.totalAmount || 0,
    };
  }, [order]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);

  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case "Delivered":
        return {
          bg: "bg-green-100 dark:bg-green-700",
          text: "text-green-800 dark:text-green-500",
          icon: <IoCheckmarkCircleOutline className="w-4 h-4" />,
        };
      case "Cancelled":
        return {
          bg: "bg-red-100 dark:bg-red-700",
          text: "text-red-800 dark:text-red-500",
          icon: <IoCloseCircleOutline className="w-4 h-4" />,
        };
      case "Preparing":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-600",
          text: "text-yellow-800 dark:text-yellow-500",
          icon: <IoTimeOutline className="w-4 h-4" />,
        };
      case "Out For Delivery":
        return {
          bg: "bg-blue-100 dark:bg-blue-600",
          text: "text-blue-800 dark:text-blue-400",
          icon: <FaMotorcycle className="w-4 h-4" />,
        };
      default:
        return {
          bg: "bg-blue-100 dark:bg-blue-600",
          text: "text-blue-800 dark:text-blue-400",
          icon: <IoIosCart className="w-4 h-4" />,
        };
    }
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[100vh] dark:bg-gray-900">
        <DotLottieReact
          src="/lottie/Food.lottie"
          loop
          autoplay
          className="w-64 h-64"
        />
        <p className="text-center mt-6 text-gray-500 dark:text-white text-lg">
          Getting your order...
        </p>
      </div>
    );

  if (error)
    return <div className="text-center mt-10 text-red-600">{error}</div>;

  return (
    <div className="mb-16 lg:mb-0">
      <ToastContainer />
      <Navbar />

    <DeliveryAlert deliveryAlert={order?.deliveryAlert || ""} />

      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 -mt-1 py-6 px-2 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Order #{order?.id}
                </h2>
              </div>
              <button
                onClick={refreshOrder}
                className="w-fit text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                Refresh
              </button>
            </div>

            <div className="flex items-center gap-3">
              {getETAStatus() && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-2xl px-4 py-2 text-right shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-green-600 dark:text-green-400 opacity-80">
                    {getETAStatus().label}
                  </p>
                  <p className="text-sm font-black text-green-700 dark:text-green-300">
                    {getETAStatus().time}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <DeliveryTimeline currentStatus={order?.deliveryStatus} />
          </div>

          {/* Status Message */}
          <div className="text-center text-sm font-bold text-blue-600 dark:text-blue-400 mb-8 tracking-tight">
            {getStatusMessage()}
          </div>

          {/* Action Buttons & Dropdowns */}
          <div className="space-y-3">
            {order?.deliveryStatus === 'Delivered' && (
              <ReviewSection order={order} />
            )}

            <div>
              <p className="text-sm font-semibold text-center mb-1" >Ordered from <span className="text-green-600 dark:text-green-500" >{order.items[0]?.product?.shopName}</span></p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-stone-100 dark:bg-zinc-700 overflow-hidden">
              <button
                onClick={() => setOpenAddress(!openAddress)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Delivery Address
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                      Home
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {order?.shippingAddress?.addressLine},{" "}
                    {order?.shippingAddress?.area}
                  </p>
                </div>

                <motion.div
                  animate={{ rotate: openAddress ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <IoIosArrowDown className="text-gray-400 w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openAddress && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {order?.shippingAddress?.fullName}, {order?.shippingAddress?.phone}
                        </span>
                      </div>

                      <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                        {order?.shippingAddress?.addressLine},{" "}
                        {order?.shippingAddress?.area}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Items Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-stone-100 dark:bg-zinc-700 overflow-hidden">
              <button
                onClick={() => setOpenItems(!openItems)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Your Order
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-[10px] font-medium text-green-700 dark:text-green-300">
                      {order?.items?.length} Items
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {order?.items?.[0]?.product?.name}
                    {order?.items?.length > 1 &&
                      ` +${order?.items?.length - 1} more`}
                  </p>
                </div>

                <motion.div
                  animate={{ rotate: openItems ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <IoIosArrowDown className="text-gray-400 w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openItems && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 pt-1 space-y-2">
                      {order?.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {item?.product?.name}
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-gray-400">
                            ×{item?.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Order Note */}
          {order?.orderNote && (
            <div className="my-6 relative pl-10 pr-4 py-2 group">
              {/*  Gradient Curved Line */}
              <div className="absolute left-0 top-0 h-full w-8">
                <svg
                  className="h-full w-full"
                  viewBox="0 0 24 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="sexyCurve"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
                      <stop offset="20%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#059669" />
                      <stop offset="80%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M16 0 C 24 30, 24 70, 16 100"
                    stroke="url(#sexyCurve)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Decorative Dots */}
                  <circle
                    cx="16"
                    cy="20"
                    r="1.5"
                    fill="#10b981"
                    className="animate-pulse"
                  />
                  <circle
                    cx="16"
                    cy="80"
                    r="1.5"
                    fill="#10b981"
                    className="animate-pulse"
                  />
                </svg>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600/60 dark:text-green-400/50">
                  Order Instructions
                </span>
                <p className="text-base font-medium text-gray-800 dark:text-gray-200 leading-relaxed italic tracking-tight">
                  {order.orderNote}
                </p>
              </div>
            </div>
          )}

          {/* Savings Highlight */}
          {totals.discount > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-green-600 text-white font-bold text-center shadow-lg shadow-green-500/20">
              🎉 You saved {formatPrice(totals.discount)} on this order
            </div>
          )}

          {/* Billing Summary */}
          <div className="mt-8 rounded-3xl border border-gray-200/70 dark:border-gray-800 bg-stone-100/70 dark:bg-zinc-700/70 backdrop-blur-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex gap-2 items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1">
                <HiDocumentCurrencyRupee className="text-green-500 text-lg" />
                <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  Billing Summary
                </h3>
              </div>
              {order.orderType === "Food" && (
                <DownloadInvoiceButton orderId={order._id} />
              )}
            </div>

            {/* Billing Rows */}
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Cart Total
                </span>

                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {formatPrice(totals.amount)}
                </span>
              </div>

              {totals.taxes > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Taxes
                  </span>

                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {formatPrice(totals.taxes)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Delivery Fee
                </span>

                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {formatPrice(totals.deliveryCharge)}
                </span>
              </div>

              {order?.orderType === "Grocery" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Service Charge
                  </span>

                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {formatPrice(totals.serviceCharge)}
                  </span>
                </div>
              )}

              {totals.discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Discount
                  </span>

                  <span className="font-bold text-green-600 dark:text-green-400">
                    -{formatPrice(totals.discount)}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300/40 dark:via-gray-700/40 to-transparent my-1" />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  Total Paid
                </span>

                <span className="text-lg font-semibold tracking-tight text-green-600 dark:text-green-400">
                  {formatPrice(totals.totalAmount)}
                </span>
              </div>

              {/* Footer Info */}
              <div className="pt-3 mt-1 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Payment Method
                  </span>

                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {order?.paymentMethod}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Placed On
                  </span>

                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {new Date(order?.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Popup */}
      {showCancelPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in duration-200 text-center">
            <button
              onClick={() => setShowCancelPopup(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <IoClose className="w-6 h-6" />
            </button>
            <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoCloseCircleOutline className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Cancel Order</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Our support team can help you cancel this order via WhatsApp.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() =>
                  window.open(
                    "https://wa.me/917409565977?text=Hi, I’d like to cancel my recent order from GullyFoods.",
                  )
                }
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl w-full font-bold transition flex items-center justify-center gap-2"
              >
                Contact Support
              </button>
              <button
                onClick={() => setShowCancelPopup(false)}
                className="w-full border border-gray-200 dark:border-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
