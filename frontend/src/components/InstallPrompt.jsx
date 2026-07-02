import React, { useEffect, useState } from "react";
import { MdDownload } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { Link } from "react-router-dom";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.gullyfoods.twa&hl=en-IN";

const InstallPrompt = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);

    setIsIos(ios);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    const isNativeApp =
      ua.includes("gullyfoodsapp") || !!window.ReactNativeWebView;

    if (isStandalone || isNativeApp) {
      setShowBanner(false);
      return;
    }

    if (android || ios) {
      setShowBanner(true);
    }
  }, []);

  const handleAction = () => {
    if (isIos) return;

    window.open(PLAY_STORE_URL, "_blank");
  };

  if (!showBanner) return null;

  return (
    <div
      className={`w-full shadow-lg ${
        isIos
          ? "bg-green-500 rounded-b-xl"
          : "bg-gradient-to-r from-green-700 via-green-600 to-emerald-500"
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <img
            src="/icons/gullyfoodsLogo192.png"
            alt="GullyFoods"
            className="w-11 h-11 rounded-xl bg-white p-1 shadow"
          />

          <div className="leading-tight">
            {isIos ? (
              <>
                <h3 className="text-base font-semibold text-white">
                  Install GullyFoods
                </h3>
                <p className="text-xs text-green-100 mt-0.5">
                  Add it to your Home Screen.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-white">
                  Get the App
                </h3>
                <p className="text-xs text-green-100 mt-0.5">
                  ⚡Faster ordering
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center">
          {isIos ? (
            <Link
              to="/install-guide"
              className="bg-white text-green-700 text-sm font-semibold px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition"
            >
              Guide
            </Link>
          ) : (
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-90 transition"
            >
              <img
                src="/icons/playStore.png"
                alt="Get it on Google Play"
                className="block h-auto w-[150px]"
              />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
