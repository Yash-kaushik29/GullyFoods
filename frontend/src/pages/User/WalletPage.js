import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { UserContext } from "../../context/userContext";
import { Link, useNavigate } from "react-router-dom";
import { GiWallet } from "react-icons/gi";
import { MdArrowBack, MdAccountBalanceWallet, MdCreditScore, MdMoneyOff } from "react-icons/md";
import api from "../../utils/axiosInstance";

const WalletPage = () => {
  const { user, setUser, ready } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) {
      navigate("/");
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <span className="w-4 h-4 bg-green-500 rounded-full animate-bounce [animation-delay:0s] mx-1"></span>
        <span className="w-4 h-4 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s] mx-1"></span>
        <span className="w-4 h-4 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s] mx-1"></span>
      </div>
    );
  }

  const transactions = user.walletTransactions || [];
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Navbar />

      <div className="max-w-lg mx-auto p-4 mt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/user/profile" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:scale-105 transition">
            <MdArrowBack className="text-xl text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">My Wallet</h1>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <GiWallet className="text-9xl" />
          </div>
          <p className="text-green-100 font-medium text-sm mb-1 relative z-10">Available Balance</p>
          <h2 className="text-4xl font-extrabold tracking-wide relative z-10">₹ {(user.walletBalance || 0).toFixed(2)}</h2>
          {user.isPremium && (
            <div className="mt-4 inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-xs font-semibold relative z-10">
              <span className="mr-1">✨</span> Premium Member (2% Cashback on every order)
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Transaction History</h3>
          
          {sortedTransactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
              <MdAccountBalanceWallet className="text-5xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No transactions yet.</p>
              <p className="text-gray-400 text-sm mt-1">Complete orders to earn cashback!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTransactions.map((tx, idx) => {
                const isCredit = tx.type === "Credit";
                return (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isCredit ? <MdCreditScore className="text-xl" /> : <MdMoneyOff className="text-xl" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{tx.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'}`}>
                      {isCredit ? '+' : '-'}₹ {tx.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
