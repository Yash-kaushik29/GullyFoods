import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTimeOutline, IoClose, IoDocumentTextOutline } from "react-icons/io5";
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
      return { label: "Arriving soon", time: "Expected Soon" };
    }
    return {
      label: order?.deliveryStatus === "Out For Delivery" ? "Order on its way" : "Preparing your order",
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

  const Badge = ({ bg, text, icon, children }) => (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${bg} ${text}`}
    >
      {icon} {children}
    </div>
  );

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

      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 px-2 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6 mt-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Order #{order?.id}</h2>
              </div>
              <button
                onClick={refreshOrder}
                className="w-fit text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                Refresh Status
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

              {order.deliveryStatus === "Delivered" &&
                order.orderType === "Food" && (
                  <DownloadInvoiceButton orderId={order._id} />
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
          <div className="flex flex-col gap-4 mb-8">
            {order?.deliveryStatus !== "Delivered" &&
              order?.deliveryStatus !== "Cancelled" && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowCancelPopup(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-10 py-3 rounded-2xl font-bold transition shadow-md hover:shadow-lg active:scale-95"
                  >
                    Cancel Order
                  </button>
                </div>
              )}

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Review Section */}
              {order?.deliveryStatus === "Delivered" && (
                <div className="py-6 border-b border-gray-100 dark:border-gray-800">
                  <ReviewSection order={order} />
                </div>
              )}

              {/* Delivery Address Dropdown */}
              <div className="py-2">
                <button
                  onClick={() => setOpenAddress(!openAddress)}
                  className="w-full flex items-center justify-between py-2 transition hover:opacity-70"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-base font-bold text-gray-800 dark:text-gray-200">Address</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">View delivery details</span>
                  </div>
                  <motion.div
                    animate={{ rotate: openAddress ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
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
                      transition={{ duration: 0.3 }}
                    >
                      <div className="py-2 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{order?.shippingAddress?.fullName}</span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span>{order?.shippingAddress?.phone}</span>
                        </p>
                        <p className="text-xs opacity-80">{order?.shippingAddress?.addressLine}, {order?.shippingAddress?.area}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View Items Dropdown */}
              <div className="py-2">
                <button
                  onClick={() => setOpenItems(!openItems)}
                  className="w-full flex items-center justify-between py-2 transition hover:opacity-70"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-base font-bold text-gray-800 dark:text-gray-200">Items</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">View ordered items</span>
                  </div>
                  <motion.div
                    animate={{ rotate: openItems ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
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
                      transition={{ duration: 0.3 }}
                    >
                      <div className="py-2">
                        <ul className="space-y-1.5">
                          {order?.items?.map((item, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{item?.product?.name}</span>
                              <span className="text-gray-400 font-bold">x {item?.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>



          {/* Order Note */}
          {order?.orderNote && (
            <div className="mb-8 relative pl-10 pr-4 py-2 group">
              {/*  Gradient Curved Line */}
              <div className="absolute left-0 top-0 h-full w-8">
                <svg className="h-full w-full" viewBox="0 0 24 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sexyCurve" x1="0%" y1="0%" x2="0%" y2="100%">
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
                  <circle cx="16" cy="20" r="1.5" fill="#10b981" className="animate-pulse" />
                  <circle cx="16" cy="80" r="1.5" fill="#10b981" className="animate-pulse" />
                </svg>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600/60 dark:text-green-400/50">
                  Kitchen Note
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

          {/* Totals */}
          <div className="my-6 text-right flex flex-col gap-1">
            <p>
              Cart Total:{" "}
              <span className="text-green-500 ml-2 font-semibold">
                {formatPrice(totals.amount)}
              </span>
            </p>
            <p>
              Tax:{" "}
              <span className="text-green-500 ml-2 font-semibold">
                {formatPrice(totals.taxes)}
              </span>
            </p>
            <p>
              Delivery Fee:{" "}
              <span className="text-green-500 ml-2 font-semibold">
                {formatPrice(totals.deliveryCharge)}
              </span>
            </p>
            {order?.orderType === "Grocery" && (
              <p>
                Service Charge:{" "}
                <span className="text-green-500 ml-2 font-semibold">
                  {formatPrice(totals.serviceCharge)}
                </span>
              </p>
            )}
            <div className="h-[1px] bg-black dark:bg-white my-2" />
            <p className="font-semibold text-lg">
              Total:
              <span className="text-green-700 dark:text-green-300 ml-2 font-bold">
                {formatPrice(totals.totalAmount)}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {" "}
              Payment Method:{" "}
              <span className="font-medium ml-1">
                {order?.paymentMethod}
              </span>{" "}
            </p>{" "}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {" "}
              Placed On:{" "}
              <span className="font-medium ml-1">
                {" "}
                {new Date(order?.createdAt).toLocaleString()}{" "}
              </span>{" "}
            </p>
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
