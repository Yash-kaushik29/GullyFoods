import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RiAccountCircleLine, RiDrinks2Line } from "react-icons/ri";
import { FaSun, FaMoon, FaHistory, FaHome, FaCrown } from "react-icons/fa";
import { UserContext } from "../context/userContext";
import {  GiShoppingCart } from "react-icons/gi";

const Navbar = () => {
  const { user } = useContext(UserContext);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme loading
  useEffect(() => {
    const storedTheme = localStorage.getItem("GullyFoodsTheme");
    if (storedTheme) {
      setIsDarkMode(storedTheme === "dark");
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    }
  }, [user]);

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);

    if (newIsDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("GullyFoodsTheme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("GullyFoodsTheme", "light");
    }
  };

  return (
    <div className="relative">
      {/* Desktop Navbar */}
      <header className="hidden lg:flex shadow-lg bg-stone-50 dark:bg-gray-900 text-white fixed top-0 left-0 w-full h-16 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between h-full">
          {/* Brand Logo */}
          <Link to="/">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-xl">
                <span className="font-bold heading-font text-black dark:text-white">
                  Gully<span className="text-green-500">Foods</span>
                </span>
              </div>
              <span className="italic text-gray-600 dark:text-white font-semibold">
                Your lane, your taste, your GullyFoods ✨
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/recentOrders">
              <button className="p-2 hover:text-green-600 text-gray-600 dark:text-white transition">
                <FaHistory size={20} />
              </button>
            </Link>
            <Link
              to="/cart"
              className="p-2 flex flex-col items-center text-gray-600 dark:text-white hover:text-green-500 transition"
            >
              <div className="flex items-center gap-2">
                {/* Food cart (shaker) */}
                <div className="relative">
                  <RiDrinks2Line size={20} />
                  {user && user.foodCart?.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {user.foodCart.length}
                    </span>
                  )}
                </div>

                <span className="text-sm">/</span>

                {/* Grocery cart */}
                <div className="relative">
                  <GiShoppingCart size={20} />
                  {user && user.groceryCart?.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {user.groceryCart.length}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-md">Carts</span>
            </Link>

            <button onClick={toggleTheme} className="p-2 transition text-gray-600 dark:text-white">
              {isDarkMode ? (
                <FaSun className="hover:text-yellow-400" size={20} />
              ) : (
                <FaMoon className="hover:text-gray-500" size={20} />
              )}
            </button>
            {user ? (
              <Link
                to="/user/profile"
                className="p-2 transition flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-600 font-semibold"
              >
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-green-400 text-white font-semibold rounded-full hover:bg-green-500 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="lg:pt-16"></main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 text-white shadow-md flex justify-around items-center py-1 border-t dark:border-gray-700 z-[9999] pointer-events-auto">
        <Link
          to="/"
          className="p-2 flex flex-col items-center text-gray-600 dark:text-white transition"
        >
          <FaHome size={22} />
          <span className="text-xs">Home</span>
        </Link>

        <Link
          to="/recentOrders"
          className="p-2 flex flex-col items-center text-gray-600 dark:text-white transition"
        >
          <FaHistory size={22} />
          <span className="text-xs">Orders</span>
        </Link>

        <Link
          to="/cart"
          className="p-2 flex flex-col items-center text-gray-600 dark:text-white transition"
        >
          <div className="flex items-center gap-2">
            {/* Food cart (shaker) */}
            <div className="relative">
              <RiDrinks2Line size={20} />
              {user && user.foodCart?.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {user.foodCart.length}
                </span>
              )}
            </div>

            <span className="text-sm">/</span>

            {/* Grocery cart */}
            <div className="relative">
              <GiShoppingCart size={20} />
              {user && user.groceryCart?.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {user.groceryCart.length}
                </span>
              )}
            </div>
          </div>

          <span className="text-md">Carts</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2 flex flex-col items-center text-gray-600 dark:text-white hover:text-yellow-400 transition"
        >
          {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          <span className="text-xs">Theme</span>
        </button>

        {user ? (
          <Link
            to="/user/profile"
            className="p-2 transition flex flex-col items-center gap-1 text-center"
          >
            <div className="relative flex justify-center items-center w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-600 font-semibold">
              {user?.isPremium && (
                <div className="absolute -top-[14px] left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
                  <FaCrown className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)] text-xl" />
                </div>
              )}
              {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="text-xs text-gray-600 dark:text-white">Profile</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="p-2 flex flex-col items-center text-gray-600 dark:text-white hover:text-green-500 transition"
          >
            <RiAccountCircleLine size={22} />
            <span className="text-xs">Login</span>
          </Link>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
