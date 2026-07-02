import { useContext, useEffect, useState } from "react";
import { FaCrown } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import Navbar from "../../components/Navbar";
import { UserContext } from "../../context/userContext";
import CheckoutPayment from "../../components/CheckoutPayment";
import CheckoutCoupons from "../../components/CheckoutCoupons";
import CheckoutSummary from "../../components/CheckoutSummary";
import CheckoutAddress from "../../components/CheckoutAddress ";
import api from "../../utils/axiosInstance";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import OrderNoteSection from "../../components/OrderNoteSection";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, ready } = useContext(UserContext);

  const {
    cartItems,
    totalPrice: cartTotalPrice,
    sellers,
    cartKey,
    shopLat,
    shopLong,
  } = location.state || {
    cartItems: [],
    totalPrice: 0,
    sellers: 1,
    cartKey: "foodCart",
    shopLat: "",
    shopLong: "",
  };

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [distance, setDistance] = useState(0);
  const [orderNote, setOrderNote] = useState("");
  const [useWallet, setUseWallet] = useState(false);

  const isFoodOrder = cartKey === "foodCart";

  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (user && (user.monthlyOrdersCount || 0) === 2 && !user.isPremium) {
      setShowPremiumModal(true);
    }
  }, [user]);

  const taxes = isFoodOrder ? (cartTotalPrice * 5) / 100 : 0;
  const [convenienceFees, setConvenienceFees] = useState(0);

  if (cartItems.length === 0) navigate("/cart");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      console.log("Navigating to profile...");
      navigate("/user/profile");
      return;
    }
    fetchAddresses();
    fetchActiveCoupons();
  }, [ready, user]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get(`/api/user-profile/getAddresses`, {
        params: { userId: user._id },
      });

      if (res.data.success) {
        const addresses = res.data.addresses || [];
        setUserAddresses(addresses);

        if (addresses.length > 0) {
          handleSelectAddress(addresses[0]);
        } else {
          setSelectedAddress(null);
        }
      } else {
        toast.error("Failed to fetch addresses");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching addresses");
    }
  };

  const fetchActiveCoupons = async () => {
    try {
      const { data } = await api.get(`/api/user-profile/active-coupons`);
      if (data.success) setActiveCoupons(data.activeCoupons);
      else toast.error(data.message);
    } catch (err) {
      console.error("Error fetching active coupons:", err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistance(R * c * 1.08);
    return R * c * 1.08;
  };

  const getFoodDeliveryCharge = (distance) => {
    if (distance <= 3) return 20;
    if (distance <= 4) return 25;
    if (distance <= 5) return 30;
    if (distance <= 6) return 35;
    if (distance <= 8) return 40;
    if (distance <= 10) return 50;
    if (distance <= 12) return 60;
    return distance * 6;
  };

  const getGroceryServiceCharge = (cartPrice) => {
    if (cartPrice < 300) return 5;
    if (cartPrice < 500) return 4;
    if (cartPrice < 700) return 2;
    return 0;
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);

    const dis = calculateDistance(shopLat, shopLong, addr.lat, addr.long);

    const delivery = getFoodDeliveryCharge(dis);
    setDeliveryCharge(delivery);
  };

  const totalAmount =
    cartTotalPrice -
    discount +
    (isFoodOrder
      ? taxes + convenienceFees + deliveryCharge
      : getGroceryServiceCharge(cartTotalPrice) + deliveryCharge);

  const walletBalance = user?.walletBalance || 0;
  const walletApplied = useWallet && walletBalance > 0 ? Math.min(walletBalance, totalAmount) : 0;
  const finalPayableAmount = totalAmount - walletApplied;

  const handleCheckout = async () => {
    if (!selectedAddress)
      return toast.error("Please select a delivery address.");
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);

    const serviceCharge = !isFoodOrder
      ? getGroceryServiceCharge(cartTotalPrice)
      : 0;

    const orderPayload = {
      userId: user._id,
      cartItems,
      orderType: isFoodOrder ? "Food" : "Grocery",
      distance,
      deliveryCharge,
      serviceCharge,
      taxes: isFoodOrder ? taxes : undefined,
      convenienceFees: isFoodOrder ? convenienceFees : undefined,
      discount,
      orderNote,
      coupon: selectedCoupon ? selectedCoupon._id : null,
      address: selectedAddress,
      paymentMethod: paymentMethod === "Razorpay" ? "Online" : "COD",
      paymentStatus: paymentMethod === "Razorpay" ? "Paid" : "Unpaid",
      cartKey,
      useWallet,
    };

    try {
      if (paymentMethod === "COD" || finalPayableAmount === 0) {
        const { data } = await api.post(
          `/api/order/create-order`,
          orderPayload,
          { withCredentials: true },
        );
        if (data.success) {
          toast.success("🎉 Order Placed Successfully!");
          setUser((prev) => ({
            ...prev,
            [cartKey]: data.cart,
          }));
          navigate(`/order/${data.order._id}`);
        } else toast.error(data.message);
      } else {
        await handlePayment(orderPayload);
      }
    } catch (error) {
      setIsPlacingOrder(false);
      console.error(error);
      toast.error("Something went wrong while placing the order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePayment = async (orderPayload) => {
    try {
      const { data } = await api.post(
        `/api/payment/createOrder`,
        { amount: finalPayableAmount },
        { withCredentials: true },
      );

      const razor = new window.Razorpay({
        key: "rzp_test_HVuV1GjtInzu0b",
        order_id: data.order.id,
        amount: data.order.amount,
        currency: "INR",
        description: "Payment for Order",
        handler: async (response) => {
          const verifyRes = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/payment/verify-payment`,
            {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            },
            { withCredentials: true },
          );

          if (verifyRes.data.success) {
            const { data } = await api.post(
              `/api/order/create-order`,
              orderPayload,
              { withCredentials: true },
            );
            if (data.success) {
              toast.success("🎉 Order Placed Successfully!");
              setUser((prev) => ({
                ...prev,
                [cartKey]: data.cart,
              }));
              navigate(`/order/${data.order._id}`);
            } else toast.error(data.message);
          } else toast.error("❌ Payment Verification Failed!");
        },
      });

      razor.open();
    } catch (error) {
      toast.error("❌ Error initiating payment!");
    } finally {
      setIsPlacingOrder(false);
    }
  };



  if (isPlacingOrder) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-100">
        <DotLottieReact
          src="/lottie/delivery.lottie"
          loop
          autoplay
          className="w-64 h-64"
        />
      </div>
    );
  }

  return (
    <div className="mx-2 pb-20 pt-6 bg-stone-50 dark:bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {user && !user.isPremium && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4 mt-2 max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Premium Goal</span>
              <span className="text-sm text-green-600 font-semibold">{Math.min(user.monthlyOrdersCount || 0, 3)}/3 Orders</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(((user.monthlyOrdersCount || 0) / 3) * 100, 100)}%` }}></div>
            </div>
            {(user.monthlyOrdersCount || 0) === 2 ? (
              <p className="text-xs text-green-600 font-semibold mt-2 animate-pulse">🎉 Congratulations! Your premium is going to start after this order!</p>
            ) : (user.monthlyOrdersCount || 0) >= 3 ? (
              <p className="text-xs text-green-600 font-semibold mt-2 animate-pulse">🎉 Place this order to activate Premium!</p>
            ) : (
              <p className="text-xs text-gray-500 mt-2">{3 - (user.monthlyOrdersCount || 0)} orders left to unlock 2% Cashback!</p>
            )}
          </div>
        )}

        {user && user.isPremium && (
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 rounded-xl p-4 shadow-md mb-4 mt-2 max-w-lg mx-auto text-white flex items-center gap-4 animate-fade-in border border-yellow-300">
            <div className="relative shrink-0">
              <FaCrown className="text-4xl text-yellow-100 drop-shadow-md animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-wide drop-shadow-sm flex items-center gap-1">
                You're a Premium User! 🌟
              </h3>
              <p className="text-sm font-medium text-amber-50 drop-shadow-sm mt-0.5 leading-tight">
                Enjoy an exclusive <strong>2% cashback</strong> added straight to your wallet when this order is delivered!
              </p>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto px-6 py-4 rounded-2xl shadow-xl bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold mb-1 text-center text-gray-900 dark:text-white">
            Checkout 🛒
          </h2>

        {/* Address Selection */}
        {user && (
          <CheckoutAddress
            userAddresses={userAddresses}
            selectedAddress={selectedAddress}
            handleSelectAddress={handleSelectAddress}
            navigate={navigate}
            user={user}
          />
        )}

        <OrderNoteSection orderNote={orderNote} setOrderNote={setOrderNote} />

        {/* Order Summary */}
        <CheckoutSummary
          cartTotalPrice={cartTotalPrice}
          selectedCoupon={selectedCoupon}
          totalAmount={totalAmount}
          walletApplied={walletApplied}
          finalPayableAmount={finalPayableAmount}
          isFoodOrder={isFoodOrder}
          taxes={taxes}
          deliveryCharge={deliveryCharge}
          distance={distance}
          convenienceFees={convenienceFees}
          discount={discount}
          getGroceryServiceCharge={getGroceryServiceCharge}
          walletBalance={walletBalance}
          useWallet={useWallet}
          setUseWallet={setUseWallet}
        />

        {/* Payment Method & Place Order */}
        <CheckoutPayment
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handleCheckout={handleCheckout}
          selectedAddress={selectedAddress}
          totalAmount={totalAmount}
        />

        {/* Coupon Selection */}
        <CheckoutCoupons
          cartTotalPrice={cartTotalPrice}
          setDiscount={setDiscount}
          activeCoupons={activeCoupons}
          selectedCoupon={selectedCoupon}
          setSelectedCoupon={setSelectedCoupon}
        />
        </div>
      </div>

      {/* Premium Unlock Sexy Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl transform transition-all scale-100 animate-scale-up">
            {/* Close Button */}
            <button 
              onClick={() => setShowPremiumModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40 rounded-full backdrop-blur-md transition-colors"
            >
              <MdClose className="text-xl text-gray-800 dark:text-white" />
            </button>

            {/* Sexy Gradient Background Header */}
            <div className="h-32 w-full bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-black/10"></div>
              <FaCrown className="text-6xl text-white drop-shadow-xl animate-bounce" />
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                Almost Premium! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You are just <strong>1 order away</strong> from unlocking <span className="font-bold text-green-600">Premium Status</span>! Complete this checkout to start earning 2% Cashback on all future orders!
              </p>
              
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95"
              >
                Let's Go! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
