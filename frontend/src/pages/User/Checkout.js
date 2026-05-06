import { useContext, useEffect, useState } from "react";
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

  const isFoodOrder = cartKey === "foodCart";

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
    };

    try {
      if (paymentMethod === "COD") {
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
        { orderId: 1, cart: cartItems, deliveryCharge },
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

  const totalAmount =
    cartTotalPrice -
    discount +
    (isFoodOrder
      ? taxes + convenienceFees + deliveryCharge
      : getGroceryServiceCharge(cartTotalPrice) + deliveryCharge);

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
          isFoodOrder={isFoodOrder}
          taxes={taxes}
          deliveryCharge={deliveryCharge}
          distance={distance}
          convenienceFees={convenienceFees}
          discount={discount}
          getGroceryServiceCharge={getGroceryServiceCharge}
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
  );
};

export default Checkout;
