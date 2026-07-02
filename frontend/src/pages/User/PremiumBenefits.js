import React from "react";
import { FaCheck, FaTimes, FaCrown } from "react-icons/fa";
import { Link } from "react-router-dom";

const features = [
  {
    title: "2% Wallet Cashback",
    normal: false,
    premium: true,
  },
  {
    title: "Priority Delivery",
    normal: false,
    premium: true,
  },
  {
    title: "Premium Only Coupons",
    normal: false,
    premium: true,
  },
  {
    title: "Priority Customer Support",
    normal: false,
    premium: true,
  },
  {
    title: "Early Access to New Features",
    normal: false,
    premium: true,
  },
  {
    title: "Exclusive App Badge",
    normal: false,
    premium: true,
  },
  {
    title: "Regular Discounts",
    normal: true,
    premium: true,
  },
];

const PremiumBenefits = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-500 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <FaCrown className="text-4xl mx-auto mb-2 text-yellow-300" />
          <h1 className="text-3xl font-bold">GullyFoods Premium</h1>

          <p className="mt-3 text-md text-green-100">
            Save more, get your orders faster and unlock exclusive benefits.
          </p>

          <div className="mt-6 inline-flex items-center bg-white/15 rounded-full px-6 py-3">
            <span className="text-lg font-bold text-shine">Complete 15 Orders in last 30 days to unlock Premium</span>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-3 bg-green-600 text-white font-semibold">
            <div className="p-4">Feature</div>
            <div className="p-4 text-center">Normal</div>
            <div className="p-4 text-center bg-green-700">👑 Premium</div>
          </div>

          {features.map((feature, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 border-b ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
            >
              <div className="p-4 font-medium">{feature.title}</div>

              <div className="flex justify-center items-center">
                {feature.normal ? (
                  <FaCheck className="text-green-600 text-lg" />
                ) : (
                  <FaTimes className="text-red-500 text-lg" />
                )}
              </div>

              <div className="flex justify-center items-center bg-green-50">
                {feature.premium ? (
                  <FaCheck className="text-green-600 text-lg" />
                ) : (
                  <FaTimes className="text-red-500 text-lg" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Premium Benefits */}
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-green-700 mb-4">
              Why choose Premium?
            </h2>

            <ul className="space-y-3 text-gray-700">
              <li>💰 Earn 2% cashback on every order.</li>
              <li>⚡ Faster delivery with priority processing.</li>
              <li>🎟️ Premium-only coupons & offers.</li>
              <li>👑 Premium badge across GullyFoods.</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl shadow text-white p-6 flex flex-col justify-center">
            <FaCrown className="text-5xl text-yellow-300 mb-4" />

            <h2 className="text-2xl font-bold">Upgrade Today</h2>

            <p className="mt-2 text-green-100">
              Enjoy exclusive rewards and make every order more valuable.
            </p>

            <button className="mt-6 bg-white text-green-700 font-semibold py-3 rounded-xl hover:bg-gray-100 transition">
              Become Premium
            </button>

            <Link to="/" className="text-center mt-4 underline text-green-100">
              Continue with Free Plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumBenefits;
