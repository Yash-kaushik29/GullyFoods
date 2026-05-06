import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import api from "../../utils/axiosInstance";
import { requestNotificationPermission } from "../../utils/pushNotifications";

export default function Login() {
  const { user, setUser } = useContext(UserContext);
  const [formData, setFormData] = useState({ phone: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const OTP_COOLDOWN = 90;
  const navigate = useNavigate();

  if (user) {
    navigate("/");
  }

  const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  const isValidOtp = (otp) => /^\d{4,8}$/.test(otp);

  // Load remaining cooldown from localStorage
  useEffect(() => {
    const storedExpire = localStorage.getItem("otpExpireTime");
    if (storedExpire) {
      const remaining = Math.floor((storedExpire - Date.now()) / 1000);
      if (remaining > 0) {
        setOtpSent(true);
        setTimeLeft(remaining);
        setCanResend(false);
      } else {
        localStorage.removeItem("otpExpireTime");
      }
    }
  }, []);

  // Countdown for resend button
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          localStorage.removeItem("otpExpireTime");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sendOtp = async () => {
    const { phone } = formData;

    // ✅ Test account bypass
    if (phone === "12345") {
      try {
        setLoading(true);

        const fcmToken = await requestNotificationPermission();

        const res = await api.post(
          `/api/auth/tester-login`,
          {
            phone: "12345",
            fcmToken,
          },
          { withCredentials: true },
        );

        if (res.data.success) {
          toast.success("Logged into test account");

          setUser(res.data.existingUser);

          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } catch (err) {
        toast.error("Test login failed");
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!phone) return toast.warn("Please enter your phone number.");

    if (!isValidPhone(phone))
      return toast.error("Enter a valid 10-digit mobile number.");

    setLoading(true);

    try {
      const res = await api.post(
        `/api/auth/send-login-otp`,
        { formData },
        { withCredentials: true },
      );

      if (res.data.success) {
        toast.success("OTP sent successfully 📩");
        setOtpSent(true);
        setCanResend(false);
        setTimeLeft(OTP_COOLDOWN);

        const expireTime = Date.now() + OTP_COOLDOWN * 1000;
        localStorage.setItem("otpExpireTime", expireTime);
      } else {
        toast.error(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message || "Server error. Try again later.";

      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { phone, otp } = formData;

    if (!isValidPhone(phone)) return toast.error("Enter a valid phone number.");
    if (!isValidOtp(otp)) return toast.error("Enter a valid OTP.");

    setLoading(true);
    try {
      // ✅ Get FCM token before login
      const fcmToken = await requestNotificationPermission();

      const res = await api.post(
        `/api/auth/user-login`,
        { phone, otp, fcmToken },
        { withCredentials: true },
      );

      if (res.data.success) {
        toast.success("Login Successful! 🎉");
        setUser(res.data.user);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(res.data.message || "Invalid OTP. Try again.");
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Login failed. Please check your network and try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col min-h-screen p-4 bg-white">
        <div className="mx-auto">
          <img
            src="/AppLogo.jpg"
            alt="GullyFoods Logo"
            className="w-full h-32 object-contain"
          />
        </div>

        <div
          className={`flex justify-center items-center flex-1 ${
            otpSent ? "-mt-2" : "-mt-20"
          }`}
        >
          <div className="w-full max-w-md bg-white p-6 shadow-2xl rounded-3xl border-t-4 border-green-500">
            <h2 className="text-2xl text-center text-green-700 font-bold mb-6">
              Login with OTP
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-green-700 mb-1 font-medium">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength="10"
                  pattern="[0-9]{10}"
                  required
                  className="w-full border border-green-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700"
                  placeholder="Enter your mobile number"
                />
              </div>

              {otpSent && (
                <div>
                  <label className="block text-green-700 mb-1 font-medium">
                    OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength="8"
                    required
                    className="w-full border border-green-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700"
                    placeholder="Enter OTP"
                  />
                </div>
              )}

              {!otpSent ? (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className={`w-full p-3 rounded-xl text-white transition ${
                    loading
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full p-3 rounded-xl text-white transition ${
                      loading
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {loading ? "Verifying..." : "Login"}
                  </button>

                  <div className="text-center text-sm text-gray-600">
                    {timeLeft > 0 ? (
                      <span>Resend OTP in {timeLeft}s ⏱️</span>
                    ) : (
                      <button
                        type="button"
                        onClick={sendOtp}
                        className="text-green-700 font-semibold underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>

            <div className="text-center mt-4 text-gray-800">
              Don’t have an account?
              <Link to="/signup">
                <span className="text-green-700 font-semibold hover:underline ml-1">
                  Sign Up
                </span>
              </Link>
            </div>

            <div className="text-center mt-4 text-sm text-gray-500">
              By logging in, you agree to our{" "}
              <Link to="/terms" className="text-green-700 underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link to="/policy" className="text-green-700 underline">
                Privacy Policy
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
