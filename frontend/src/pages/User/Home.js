import React, { useContext, useEffect, useState, useMemo } from "react";
import Navbar from "../../components/Navbar";
import SearchBar from "../../components/SearchBar";
import { MdDinnerDining } from "react-icons/md";
import { GiMedicines, GiFruitBowl } from "react-icons/gi";
import { UserContext } from "../../context/userContext";
import HomePageSkeleton from "../../skeletons/HomePageSkeleton";
import { toast, ToastContainer } from "react-toastify";
import ShopCard from "../../components/ShopCard";
import ProductCard from "../../components/ProductCard";
import { Link } from "react-router-dom";
import InstallPrompt from "../../components/InstallPrompt";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";
import { FiRefreshCw } from "react-icons/fi";
import "../../index.css";
import EventBanner from "../../eventsComponents/eventBanner";

const Home = () => {
  const { user, setUser, ready } = useContext(UserContext);
  const [order, setOrder] = useState(null);
  const [shops, setShops] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);

  const fetchActiveOrder = async () => {
    try {
      setRefreshing(true);
      const { data } = await api.get(`/api/order/active`, {
        withCredentials: true,
      });
      setOrder(data?.order || null);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchActiveOrder();
  }, [user]);

  const fetchPopularShops = async () => {
    try {
      const { data } = await api.get(`/api/home/get-popular-shops`);
      if (data.success) setShops(data.shops);
    } catch {
      toast.error("Failed to fetch shops");
    }
  };

  const fetchPopularProducts = async () => {
    try {
      const { data } = await api.get(`/api/home/get-popular-products`);
      if (data.success) setProducts(data.products);
    } catch {
      toast.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchPopularShops();
    fetchPopularProducts();
  }, [user]);

  const memoizedShops = useMemo(
    () =>
      shops.map((shop, i) => (
        <motion.div
          key={shop._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="snap-center shrink-0"
        >
          <ShopCard shop={shop} />
        </motion.div>
      )),
    [shops],
  );

  const memoizedProducts = useMemo(
    () =>
      products.map((product, i) => (
        <ProductCard
          key={i}
          product={product}
          bestSeller
          user={user}
          setUser={setUser}
        />
      )),
    [products, user, setUser],
  );

  if (!ready) return <HomePageSkeleton />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <ToastContainer position="top-right" autoClose={3000} />

      <Navbar />

      <InstallPrompt />

      {/* ACTIVE ORDER BAR */}
      {order && (
        <div
          className="fixed bottom-[72px] lg:bottom-0 left-0 w-full
        bg-gradient-to-r from-green-600 to-emerald-500
        text-white py-3 px-5 shadow-xl flex justify-between items-center
        rounded-t-xl z-50"
        >
          <div>
            <p className="font-semibold">🚴 Order #{order.id} is on the way!</p>
            <p className="text-xs opacity-90">Track it live</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchActiveOrder}
              className="bg-white text-green-600 p-2 rounded-full"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            </button>
            <Link
              to={`/order/${order._id}`}
              className="bg-white text-green-600 px-3 py-1 rounded-lg font-medium"
            >
              View
            </Link>
          </div>
        </div>
      )}

      {/* <EventBanner /> */}

      {/* <div className="flex flex-col items-center pt-4 lg:hidden">
        <div className="flex items-center gap-2 text-3xl">
          <span className="font-bold text-black dark:text-white heading-font"> Gully<span className="text-green-500">Foods</span> </span>
        </div>
        <span className="italic text-gray-600 font-semibold dark:text-white text-lg text-center">
          Your lane, your taste, your GullyFoods ✨
        </span>
      </div> */}

      {/* <ReviewCarousel /> */}

      {/* Search Bar */}
      <div className="max-w-xl mx-auto mt-4 px-4">
        <SearchBar />
      </div>

      {/* CATEGORIES */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
          What are you looking for?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              name: "Groceries",
              img: "/groceries.jpg",
              icon: <GiFruitBowl />,
              badge: "Daily Fresh 🎄",
            },
            {
              name: "Restaurants",
              img: "/food.jpg",
              icon: <MdDinnerDining />,
              badge: "Hot & Yummy 🔥",
            },
            {
              name: "Medicines",
              img: "/medicines.jpg",
              icon: <GiMedicines />,
              badge: "Care First 💊",
            },
          ].map((cat) => (
            <Link
              key={cat.name}
              to={`/products/${cat.name.toLowerCase()}`}
              className="
    group relative h-52 rounded-3xl overflow-hidden
    shadow-lg hover:shadow-red-400/40
    transition-all duration-500
  "
            >
              {/* IMAGE */}
              <img
                src={cat.img}
                alt={cat.name}
                className="
      absolute inset-0 w-full h-full object-cover
      scale-100 group-hover:scale-110
      transition-transform duration-700
      z-0
    "
              />

              {/* GRADIENT OVERLAY */}
              <div
                className="
      absolute inset-0
      bg-gradient-to-br from-red-900/60 via-black/40 to-green-900/50
      z-10 pointer-events-none
    "
              />

              {/* SNOW SPARKLES */}
              {/* <div className="absolute inset-0 opacity-30 pointer-events-none z-20">
                <span className="absolute top-4 left-6 text-white animate-pulse">
                  💞
                </span>
                <span className="absolute bottom-6 right-8 text-white animate-pulse delay-300">
                  💗
                </span>
                <span className="absolute top-1/2 left-1/3 text-white animate-pulse delay-700">
                  💓
                </span>
              </div> */}

              {/* BADGE */}
              <div
                className="
      absolute top-3 left-3 z-30
      bg-red-600 text-white text-xs font-semibold
      px-3 py-1 rounded-full shadow-md
    "
              >
                {cat.badge}
              </div>

              {/* CONTENT (NAME + ICON) */}
              <div
                className="
      relative z-40 h-full
      flex flex-col items-center justify-center
      text-center
    "
              >
                <div
                  className="
        text-white text-3xl mb-2
        drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]
      "
                >
                  {cat.icon}
                </div>

                <h3
                  className="
        text-white text-2xl font-extrabold tracking-wide
        drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]
      "
                >
                  {cat.name}
                </h3>

                <p className="mt-2 text-sm text-white/90">Tap to explore</p>
              </div>

              {/* GLOW RING */}
              <div
                className="
      absolute inset-0 rounded-3xl
      ring-1 ring-white/20
      group-hover:ring-2 group-hover:ring-red-400
      transition-all duration-500
      z-50
    "
              />
            </Link>
          ))}
        </div>
      </section>

      {/* POPULAR SHOPS */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Popular Shops</h2>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4">
          {memoizedShops}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">✨ Our Picks ✨</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {memoizedProducts}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="text-center space-y-2">
          <p>&copy; 2025 GullyFoods</p>
          <div className="flex justify-center gap-4">
            <a className="hover:text-green-400">Instagram</a>
            <a className="hover:text-green-400">Twitter</a>
            <a className="hover:text-green-400">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
