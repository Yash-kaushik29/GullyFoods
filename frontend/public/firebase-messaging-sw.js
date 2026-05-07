importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// Hardcoded config for maximum reliability
const firebaseConfig = {
  apiKey: "AIzaSyCvK5AH-TE1DPObA5x3LLx5ePS10q1sBXw",
  authDomain: "gullyfoods.firebaseapp.com",
  projectId: "gullyfoods",
  storageBucket: "gullyfoods.firebasestorage.app",
  messagingSenderId: "665093061382",
  appId: "1:665093061382:web:80464457e6a547c675fc87"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log("[firebase-messaging-sw.js] Service Worker initialized");

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] 📩 Received background message:", payload);
  
  const notificationTitle = payload.notification?.title || "GullyFoods Update";
  const notificationOptions = {
    body: payload.notification?.body || "Tap to see details",
    icon: "/icons/AppIcon.jpg",
    badge: "/icons/AppIcon.jpg",
    data: payload.data,
    tag: payload.data?.orderId || "default",
    renotify: true,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
