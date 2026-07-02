import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { IoLogOut } from "react-icons/io5";
import { FaCrown } from "react-icons/fa";
import { UserContext } from "../../context/userContext";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import {
  MdDescription,
  MdHelp,
  MdInstallMobile,
  MdLocationOn,
  MdNotifications,
  MdPolicy,
  MdShoppingCart,
  MdCameraswitch,
} from "react-icons/md";
import { GiWallet } from "react-icons/gi";
import api from "../../utils/axiosInstance";
import { unregisterPushToken, requestNotificationPermission, registerPushToken } from "../../utils/pushNotifications";

const UserProfile = () => {
  const { user, setUser, ready } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (ready && !user) {
    navigate("/");
  }

  const handleLogout = async () => {
    try {
      const { data } = await api.post(
        "/api/auth/logout",
        {},
        { withCredentials: true }
      );
      
      // ✅ Remove push token from server on logout
      await unregisterPushToken();

      if (data.success) {
        setUser(null);
        toast.success("Logged out successfully!");

        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Failed to log out!");
    }
  };

  const handleRedirect = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/switch-to-seller", {
        phone: user.phone,
      });
      if (res.data.success) {
        toast.success("Moving to your shop!");
        setTimeout(() => {
          window.location.href = "/seller";
        }, 800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to switch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <Navbar />
      {ready === false ? (
        <div className="flex justify-center items-center space-x-2 h-[100vh]">
          <span className="w-3 h-3 mb-4 bg-green-700 rounded-full animate-bounce [animation-delay:0s]"></span>
          <span className="w-3 h-3 mb-4 bg-green-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span className="w-3 h-3 mb-4 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-start p-4 mb-16 lg:mb-0">
          {user && (
            <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              {/* Profile Header */}
              <div className={`relative p-6 text-center text-white ${user?.isPremium ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500' : 'bg-gradient-to-r from-green-400 to-green-600'}`}>
                {/* Avatar (Fallback to initials) */}
                <div className="relative w-20 h-20 mx-auto rounded-full bg-white text-green-600 flex items-center justify-center text-3xl font-bold shadow-md">
                  {user?.isPremium && (
                    <div className="absolute -top-[16px] left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
                      <FaCrown className="text-yellow-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] text-3xl" />
                    </div>
                  )}
                  <span className={user?.isPremium ? "text-orange-500" : "text-green-600"}>
                    {user.username?.charAt(0) || "U"}
                  </span>
                </div>

                {/* Switch to Seller Profile */}
                {user?.isSeller && (
                  <div>
                    {loading ? (
                      <span className="text-white text-sm">
                        Getting Seller Data...
                      </span>
                    ) : (
                      <button
                        onClick={handleRedirect}
                        className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 mt-3 rounded-full text-sm font-medium transition"
                      >
                        <MdCameraswitch className="text-lg" />
                        Switch to Seller Profile
                      </button>
                    )}
                  </div>
                )}

                {/* Username & Phone */}
                <h1 className="mt-4 text-2xl font-bold flex justify-center items-center gap-2">
                  {user.username || "User"}
                </h1>
                {user?.isPremium && (
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mt-1 mb-1 border border-white/40 shadow-sm">
                    <FaCrown className="text-yellow-300" /> Premium Member
                  </span>
                )}
                <p className="text-sm mt-1 text-white/90">{user.phone}</p>

                {/* Logout Icon */}
                <button
                  onClick={handleLogout}
                  className="absolute top-4 right-4 p-2 rounded-full bg-red-500 hover:bg-red-600 transition"
                >
                  <IoLogOut className="text-white text-xl" />
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                <Link
                  to="/wallet"
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:scale-105 transition w-full text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">My Wallet</span>
                    <span className="text-2xl font-bold text-green-600 mt-1">₹ {(user.walletBalance || 0).toFixed(2)}</span>
                  </div>
                  <GiWallet className="text-4xl text-green-500" />
                </Link>

                <button
                  onClick={async () => {
                    const status = Notification.permission;
                    if (status === "denied") {
                      toast.info("Notifications are blocked. Please click the Lock icon in the address bar to Allow them! 🔓", { autoClose: 5000 });
                    } else {
                      const token = await requestNotificationPermission();
                      if (token) {
                        await registerPushToken();
                        toast.success("Notifications enabled successfully! 🎉");
                      }
                    }
                  }}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:scale-105 transition w-full text-left"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">Notification Status</span>
                    <span className={`text-[10px] font-bold ${Notification.permission === 'granted' ? 'text-green-500' : Notification.permission === 'denied' ? 'text-red-500' : 'text-orange-500'}`}>
                      {Notification.permission === 'granted' ? '● ENABLED' : Notification.permission === 'denied' ? '● BLOCKED (Tap to fix)' : '● TURN ON'}
                    </span>
                  </div>
                  <MdNotifications className={`text-2xl ${Notification.permission === 'granted' ? 'text-green-500' : 'text-gray-400'}`} />
                </button>

                <Link
                  to="/recentOrders"
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:scale-105 transition"
                >
                  <span className="font-semibold">Orders</span>
                  <MdShoppingCart className="text-2xl text-green-500" />
                </Link>

                <Link
                  to={`/user/addresses/${user._id}`}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:scale-105 transition"
                >
                  <span className="font-semibold">Addresses</span>
                  <MdLocationOn className="text-2xl text-green-500" />
                </Link>

                <Link
                  to="/install-guide"
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:scale-105 transition"
                >
                  <span className="font-semibold">Installation Guide</span>
                  <MdInstallMobile className="text-2xl text-green-500" />
                </Link>

                <Link
                  to="/help-support"
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:scale-105 transition"
                >
                  <span className="font-semibold">Help & Support</span>
                  <MdHelp className="text-2xl text-green-500" />
                </Link>

                <Link
                  to="/terms"
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:scale-105 transition"
                >
                  <span className="font-semibold">Terms & Conditions</span>
                  <MdDescription className="text-2xl text-green-500" />
                </Link>

                <Link
                  to="/policy"
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:scale-105 transition"
                >
                  <span className="font-semibold">Privacy Policy</span>
                  <MdPolicy className="text-2xl text-green-500" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default UserProfile;
