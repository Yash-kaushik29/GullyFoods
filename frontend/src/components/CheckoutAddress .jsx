import React from "react";

const CheckoutAddress = ({
  userAddresses,
  selectedAddress,
  setSelectedAddress,
  handleSelectAddress,
  navigate,
  user,
}) => {
  if (userAddresses.length === 0)
    return (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>No saved addresses found.</p>
        <button
          onClick={() => navigate(`/user/addresses/${user._id}`)}
          className="mt-2 text-green-500 underline hover:text-green-600"
        >
          ➕ Add a new address
        </button>
      </div>
    );

  return (
    <div className="space-y-2 mb-3">
      <div className="flex flex-col gap-1 justify-center items-center text-center">
        <button
          onClick={() => navigate(`/user/addresses/${user._id}`)}
          className="mt-2 text-green-500 underline hover:text-green-600"
        >
          ➕ Add a new address
        </button>

        <h3 className="text-green-500">Tap on the address to select it.</h3>
      </div>
      {userAddresses.map((addr, index) => (
        <div
          key={index}
          onClick={() => handleSelectAddress(addr)}
          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2
            ${
              selectedAddress?._id === addr._id
                ? "border-green-500 bg-green-50 dark:bg-green-900"
                : "border-gray-300 dark:border-gray-600 hover:border-green-400"
            }`}
        >
          <p className="font-semibold text-gray-900 dark:text-white">
            {addr.fullName}, {addr.phone}
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-400">
            {addr.addressLine}, {addr.area}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CheckoutAddress;
