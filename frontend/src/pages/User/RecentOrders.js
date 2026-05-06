import axios from "axios";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom";
import { MdOutlineArrowOutward, MdAccessTimeFilled, MdRefresh } from "react-icons/md";
import api from "../../utils/axiosInstance";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { toast } from "react-toastify";

const OrderCard = ({ order }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "text-green-500";
      case "Processing":
        return "text-blue-500";
      case "Cancelled":
        return "text-red-500";
      case "Out for Delivery":
      case "Preparing":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 p-4 overflow-hidden">
      {/* Decorative Gradient Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors" />
      
      <h2 className="text-lg font-semibold mb-3 flex items-center justify-between">
        <span className="text-gray-500 dark:text-gray-400 text-xs">Order ID</span>
        <Link
          to={`/order/${order._id}`}
          className="text-blue-500 hover:text-blue-600 transition flex items-center gap-1 hover:underline"
        >
          #{order.id}
          <MdOutlineArrowOutward className="text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </h2>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">Total</span>
          <span className="font-bold text-green-600 dark:text-green-400">
            ₹{order.totalAmount}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">Status</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-50/50 dark:bg-gray-900/30 ${getStatusColor(order.deliveryStatus)}`}>
            {order.deliveryStatus}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <MdAccessTimeFilled className="text-gray-300 dark:text-gray-600" />
              <span>{formatDate(order.createdAt)}</span>
            </div>
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                toast.info("Reordering your items...");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold transition-all active:scale-95 shadow-sm hover:shadow-green-500/20"
            >
              <MdRefresh className="text-base" />
              REORDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async (page = 1) => {
      try {
        setLoading(true);

        const { data } = await api.get(
          `/api/order/getUserOrders?page=${page}&limit=6`,
          {
            withCredentials: true,
          }
        );

        if (!isMounted) return;

        if (data.success) {
          setOrders(data.orders);
          setCurrentPage(data.currentPage);
          setTotalPages(data.totalPages);
          setError("");
        } else {
          setError("Failed to get your Orders!");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Failed to load orders. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders(currentPage);

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => paginate(currentPage - 1)}
          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          Prev
        </button>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`px-4 py-2 rounded-lg ${
            currentPage === i
              ? "bg-green-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
          aria-label={`Go to page ${i}`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => paginate(currentPage + 1)}
          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          Next
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 pb-16 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-green-400/10 dark:bg-green-600/5 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />
      
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-30 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-b border-white/20 dark:border-gray-800/50 shadow-sm mb-4">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-center text-gray-900 dark:text-white">
            Recent Orders
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 relative z-10">

        {loading ? (
          <div className="flex flex-col justify-center items-center py-6 space-y-5">
            <DotLottieReact
              src="/lottie/Glass.lottie"
              loop
              autoplay
              className="w-64 h-64"
            />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 flex flex-col gap-4">
            <p>{error}</p>
            <button
              onClick={() => paginate(currentPage)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No recent orders found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center space-x-2">
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrders;
