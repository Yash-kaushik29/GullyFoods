import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaMoneyBillWave,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaUser,
} from "react-icons/fa";
import { IoFastFoodSharp } from "react-icons/io5";
import { MdDeliveryDining } from "react-icons/md";
import DeliveryBoyHeader from "../../components/DeliveryBoyHeader";
import api from "../../utils/axiosInstance";

const DeliveryBoyOrder = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("GullyFoodsDeliveryToken");

  if (!token) {
    navigate("/delivery/login");
  }

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/api/delivery/order/${orderId}`, {
          withCredentials: true,
        });
        setOrder(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const markAsOutForDelivery = async () => {
    if (
      order?.deliveryStatus === "Out For Delivery" ||
      order?.deliveryStatus === "Delivered"
    ) {
      toast.info("Order already picked up or delivered");
      return;
    }

    try {
      setUpdating(true);

      await api.put(
        `/api/delivery/order/confirm-pickup`,
        { orderId },
        { withCredentials: true },
      );

      toast.success("Order marked as Out For Delivery ✅");

      setOrder((prev) => ({
        ...prev,
        deliveryStatus: "Out For Delivery",
      }));
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelivery = async () => {
    if (order?.deliveryStatus === "Delivered") {
      toast.info("This order is already delivered ✅");
      return;
    }

    try {
      setUpdating(true);

      await api.put(
        `/api/delivery/order/confirm-delivery/${orderId}`,
        {},
        { withCredentials: true },
      );

      toast.success("Order marked as Delivered 🎉");

      setOrder((prev) => ({
        ...prev,
        deliveryStatus: "Delivered",
        paymentStatus: "Paid",
      }));
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast.error("Failed to confirm delivery");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div>
      <DeliveryBoyHeader />
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="min-h-screen p-4 bg-gray-100 dark:bg-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Order Details
        </h1>

        {/* Order Info Section */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <IoFastFoodSharp className="text-green-500" /> Order Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <MdDeliveryDining className="text-blue-500" />
                <span className="font-semibold">Order ID:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  #{order.id}
                </span>
              </p>

              <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <FaMoneyBillWave className="text-green-500" />
                <span className="font-semibold">Amount:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  ₹{order?.totalAmount}
                </span>
              </p>

              <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Payment:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    order?.paymentStatus === "Paid"
                      ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-white"
                      : "bg-red-100 text-red-700 dark:bg-red-700 dark:text-white"
                  }`}
                >
                  {order?.paymentStatus}
                </span>
              </p>

              <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    order?.deliveryStatus === "Delivered"
                      ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-white"
                      : order?.deliveryStatus === "Out For Delivery"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-white"
                        : order?.deliveryStatus === "Processing"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white"
                          : order?.deliveryStatus === "Cancelled"
                            ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-white"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {order?.deliveryStatus}
                </span>
              </p>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <FaUser className="text-purple-500" />
                <span className="font-semibold">Customer:</span>{" "}
                {order?.shippingAddress?.fullName}
              </p>

              <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <FaPhoneAlt className="text-indigo-500" />
                <span className="font-semibold">Phone:</span>{" "}
                <a
                  href={`tel:${order?.shippingAddress?.phone}`}
                  className="text-blue-500 hover:underline"
                >
                  {order?.shippingAddress?.phone}
                </a>
              </p>

              <p className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
                <FaMapMarkerAlt className="text-red-500 mt-1" />
                <span className="font-semibold">Address:</span>{" "}
                <span>
                  {order?.shippingAddress?.addressLine},{" "}
                  {order?.shippingAddress?.area},{" "}
                  {order?.shippingAddress?.landMark}
                </span>
              </p>

              {order?.shippingAddress?.lat && order?.shippingAddress?.long && (
                <a
                  href={`https://www.google.com/maps?q=${order.shippingAddress.lat},${order.shippingAddress.long}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center mt-3 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition w-full sm:w-auto"
                >
                  <FaMapMarkerAlt className="mr-2" /> Open in Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <MdDeliveryDining className="text-orange-500" /> Pickup From
          </h2>

          <p className="text-gray-700 dark:text-gray-200 mb-2">
            <span className="font-semibold">Shop Name:</span>{" "}
            {order?.items?.[0]?.product?.shopName || "GullyFoods Main Outlet"}
          </p>

          {order?.shopAddress && (
            <p className="text-gray-700 dark:text-gray-200 mb-2">
              <span className="font-semibold">Address:</span>{" "}
              {order.shopAddress}
            </p>
          )}

          {order?.shopPhone && (
            <p className="text-gray-700 dark:text-gray-200 mb-2">
              <span className="font-semibold">Phone:</span>{" "}
              <a
                href={`tel:${order.shopPhone}`}
                className="text-blue-500 hover:underline"
              >
                {order.shopPhone}
              </a>
            </p>
          )}

          {order?.shop?.lat && order?.shop?.long && (
            <a
              href={`https://www.google.com/maps?q=${order.shop.lat},${order.shop.long}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition w-full sm:w-auto"
            >
              <FaMapMarkerAlt className="mr-2" /> View Shop on Map
            </a>
          )}
        </div>

        {/* Product List */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Products
        </h2>
        <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-4 mb-8">
          {order?.items?.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 py-2"
            >
              <span className="text-gray-800 dark:text-gray-100">
                {item.product.name}
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            {!showQR ? (
              <button
                onClick={() => setShowQR(true)}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:scale-[1.02] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                  🔒
                </div>

                <div className="text-left">
                  <p className="font-semibold text-lg">Unlock QR</p>
                  <p className="text-sm text-gray-300">
                    Generate payment QR for customer
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      `upi://pay?pa=8527922909@pthdfc&pn=GullyFoods&am=${order.totalAmount}&cu=INR`,
                    )}`}
                    alt="UPI QR"
                    className="rounded-2xl border border-gray-200 shadow-md"
                  />

                  <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                    Ready
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-lg">
                    Scan to Pay ₹{order.totalAmount}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    UPI payment before pickup confirmation
                  </p>
                </div>

                <button
                  onClick={() => setShowQR(false)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Hide QR
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {(order.deliveryStatus === "Processing" ||
            order.deliveryStatus === "Preparing") && (
            <button
              onClick={markAsOutForDelivery}
              disabled={updating}
              className={`px-6 py-3 rounded-lg text-white ${
                updating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {updating ? "Updating..." : "Confirm Pickup"}
            </button>
          )}

          {order.deliveryStatus === "Out For Delivery" && (
            <button
              onClick={confirmDelivery}
              disabled={updating}
              className={`px-6 py-3 rounded-lg text-white ${
                updating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {updating ? "Confirming..." : "Confirm Delivered"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyOrder;
