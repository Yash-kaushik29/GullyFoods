importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// Extract config from URL query parameters
const urlParams = new URLSearchParams(self.location.search);
const apiKey = urlParams.get("apiKey");
const messagingSenderId = urlParams.get("messagingSenderId");
const appId = urlParams.get("appId");

// Initialize Firebase only if we have the required keys
if (apiKey && messagingSenderId && appId) {
  firebase.initializeApp({
    apiKey: apiKey,
    authDomain: "gullyfoods.firebaseapp.com",
    projectId: "gullyfoods",
    storageBucket: "gullyfoods.firebasestorage.app",
    messagingSenderId: messagingSenderId,
    appId: appId
  });

  const messaging = firebase.messaging();

  // Background message handler
  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Received background message ", payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon || "/icons/AppIcon.jpg",
      badge: "/icons/AppIcon.jpg",
      data: payload.data,
      tag: payload.data?.orderId || "default",
      renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

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
