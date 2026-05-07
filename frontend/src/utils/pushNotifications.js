import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../config/firebaseConfig";
import api from "../utils/axiosInstance";

const VAPID_KEY = process.env.REACT_APP_FIREBASE_PUBLIC_KEY;

// Request notification permission (call this early, e.g., in App.js)
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // ✅ Get or register the messaging service worker with config in query params
    const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.REACT_APP_FIREBASE_CONFIG_KEY}&messagingSenderId=665093061382&appId=1:665093061382:web:80464457e6a547c675fc87`;
    
    let registration = await navigator.serviceWorker.getRegistration(swUrl);
    if (!registration) {
      registration = await navigator.serviceWorker.register(swUrl);
      console.log("Messaging service worker registered:", registration.scope);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration, // Use the explicit registration
    });

    if (!token) {
      console.log("No FCM token available");
      return null;
    }

    console.log("FCM Token obtained:", token.substring(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

// Register push token for user (call this AFTER user logs in or on app load for existing users)
export async function registerPushToken() {
  if (!("Notification" in window)) return;
//gullyfoods
  try {
    // If permission is not granted yet, we request it
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    } else if (Notification.permission !== "granted") {
      return; // Permisson denied
    }

    // ✅ Get or register the messaging service worker
    const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.REACT_APP_FIREBASE_CONFIG_KEY}&messagingSenderId=665093061382&appId=1:665093061382:web:80464457e6a547c675fc87`;
    
    let registration = await navigator.serviceWorker.getRegistration(swUrl);
    if (!registration) {
      registration = await navigator.serviceWorker.register(swUrl);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    // Save to DB (backend logic uses $addToSet to prevent duplicates)
    const response = await api.post("/api/user-profile/register-token", { token });
    console.log("Push token registered successfully:", response.data);
  } catch (err) {
    console.error("Push token registration error:", err.response?.data || err.message);
  }
}

// Register push token for delivery boy (call this AFTER delivery boy logs in)
export async function registerDeliveryBoyPushToken() {
  if (!("Notification" in window)) return;

  try {
    // If permission is not granted yet, we request it
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    } else if (Notification.permission !== "granted") {
      return; // Permisson denied
    }

    // ✅ Get or register the messaging service worker
    const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.REACT_APP_FIREBASE_CONFIG_KEY}&messagingSenderId=665093061382&appId=1:665093061382:web:80464457e6a547c675fc87`;
    
    let registration = await navigator.serviceWorker.getRegistration(swUrl);
    if (!registration) {
      registration = await navigator.serviceWorker.register(swUrl);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    const response = await api.post("/api/delivery/register-token", { token });
    console.log("Delivery boy push token registered successfully:", response.data);
  } catch (err) {
    console.error("Delivery boy push token registration error:", err.response?.data || err.message);
  }
}

// Unregister push token for user (call this during logout)
export async function unregisterPushToken() {
  if (!("Notification" in window)) return;

  try {
    // ✅ Get or register the messaging service worker
    const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.REACT_APP_FIREBASE_CONFIG_KEY}&messagingSenderId=665093061382&appId=1:665093061382:web:80464457e6a547c675fc87`;

    let registration = await navigator.serviceWorker.getRegistration(swUrl);
    if (!registration) {
      registration = await navigator.serviceWorker.register(swUrl);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    await api.post("/api/user-profile/logout-token", { token });
    console.log("Push token removed from server");
  } catch (err) {
    console.error("Unregister token error:", err);
  }
}

// Unregister push token for delivery boy (call this during logout)
export async function unregisterDeliveryBoyPushToken() {
  if (!("Notification" in window)) return;

  try {
    // ✅ Get or register the messaging service worker
    const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.REACT_APP_FIREBASE_CONFIG_KEY}&messagingSenderId=665093061382&appId=1:665093061382:web:80464457e6a547c675fc87`;

    const registration = await navigator.serviceWorker.getRegistration(swUrl);
    if (!registration) return;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    await api.post("/api/delivery/logout-token", { token });
    console.log("Delivery boy push token removed from server");
  } catch (err) {
    console.error("Unregister delivery token error:", err);
  }
}

// Foreground message handler
export function listenForegroundMessages(callback) {
  onMessage(messaging, (payload) => {
    console.log("📩 Push received in foreground", payload);
    callback(payload);
  });
}
