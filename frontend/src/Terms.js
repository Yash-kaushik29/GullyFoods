import React from "react";
import { Link } from "react-router-dom";
import Navbar from "./components/Navbar";

const Terms = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 pb-20 lg:pb-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center text-green-600">
            Terms & Conditions (T&C)
          </h1>

          <p className="mb-4">
            Welcome to <span className="font-semibold">GullyFoods</span>! By
            using our app, you agree to these terms.
          </p>

          <h2 className="text-xl font-semibold mt-4 mb-2">1. Use of the App</h2>
          <p className="mb-2">
            You agree to use the app only for lawful purposes and follow our
            guidelines for ordering and deliveries.
          </p>

          <h2 className="text-xl font-semibold mt-4 mb-2">
            2. Account Responsibility
          </h2>
          <p className="mb-2">
            You are responsible for keeping your account credentials safe. Any
            activity on your account is your responsibility.
          </p>

          <h2 className="text-xl font-semibold mt-4 mb-2">
            3. Orders & Payments
          </h2>
          <p className="mb-2">
            All payments are final. We may cancel or reject orders if necessary.
            GST or taxes, if applicable, are included in the pricing.
          </p>

          <h2 className="text-xl font-semibold mt-4 mb-2">4. Delivery</h2>
          <p className="mb-2">
            Delivery times are estimates. We are not liable for delays due to
            unforeseen circumstances.
          </p>

          <h2 className="text-xl font-semibold mt-4 mb-2">5. Liability</h2>
          <p className="mb-2">
            GullyFoods is not responsible for any damages resulting from the use
            of our services.
          </p>

          <h2 className="text-xl font-semibold mt-4 mb-2">
            6. Changes to Terms
          </h2>
          <p className="mb-2">
            We may update these terms at any time. Continued use of the app
            implies acceptance of updated terms.
          </p>
        </div>
      </div>
    </>
  );
};

export default Terms;
