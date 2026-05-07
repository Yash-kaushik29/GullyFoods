const admin = require("firebase-admin");
const path = require("path");
const User = require("../models/User");
const DeliveryBoy = require("../models/DeliveryBoy");
const Order = require("../models/Order");

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

console.log("FIREBASE_SERVICE_ACCOUNT_PATH:", process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    //viyomog
    // Use service account JSON from environment variable
    console.log("Loading service account from environment variable");
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    // Fix private key formatting (extremely robust replacement)
    if (serviceAccount.private_key) {
      // Replaces literal '\n' strings and ensures actual newlines
      serviceAccount.private_key = serviceAccount.private_key
        .replace(/\\n/g, '\n')
        .replace(/\n/g, '\n')
        .trim();
        
      if (!serviceAccount.private_key.includes("-----BEGIN PRIVATE KEY-----")) {
        console.error("Warning: Private key is missing PEM header!");
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized with service account from env");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    console.log("Loading service account from:", serviceAccountPath);
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized with service account file");
  } else {
    console.log("No Firebase credentials found, trying default...");
    admin.initializeApp({
      projectId: "gullyfoods",
    });
    console.log("Firebase Admin SDK initialized without credentials");
  }
  firebaseInitialized = true;
} catch (error) {
  console.log("Firebase Admin SDK initialization failed:", error.message);
  firebaseInitialized = false;
}

/**
 * Send push notification to an array of FCM tokens
 * @param {string[]} tokens - Array of FCM registration tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
async function sendPushNotification(tokens, title, body, data = {}) {
  if (!firebaseInitialized || !tokens || tokens.length === 0) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    webpush: {
      headers: {
        Urgency: "high",
      },
      notification: {
        icon: "/icons/AppIcon.jpg",
        badge: "/icons/AppIcon.jpg",
        tag: data.orderId || "default",
        requireInteraction: true,
        renotify: true,
      },
      fcm_options: {
        link: data.url || "/",
      },
    },
    android: {
      notification: {
        icon: "https://gullyfoods.app/icons/AppIcon.jpg",
        color: "#16a34a",
        priority: "high",
        // Removed channelId for better default compatibility on all Android versions
      },
      priority: "high",
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title,
            body,
          },
          badge: 1,
          sound: "default",
        },
      },
    },
  };

  try {
    // Send to each token individually for better error handling
    const results = await Promise.allSettled(
      tokens.map((token) =>
        admin.messaging().send({ ...message, token })
      )
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.filter((r) => r.status === "rejected").length;

    if (successCount > 0) {
      console.log(`Push notifications sent: ${successCount} success, ${failCount} failed`);
    }
    if (failCount > 0) {
      console.log("Some push notifications failed (tokens may be expired)");
      // Log detailed errors
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Token ${index + 1} failed:`, result.reason?.message || result.reason);
        }
      });
    }
  } catch (error) {
    console.error("Error sending push notification:", error.message);
  }
}

/**
 * Send order status update notification to user
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID (numeric)
 * @param {string} orderObjectId - Order MongoDB _id
 * @param {string} status - New delivery status
 */
async function sendOrderStatusNotification(userId, orderId, orderObjectId, status) {
  console.log(`Sending ${status} notification for order #${orderId} to user ${userId}`);
  
  if (!firebaseInitialized) return;

  // Fetch tokens and order details in parallel
  const [userDoc, orderDoc] = await Promise.all([
    User.findById(userId).select("fcmTokens"),
    Order.findById(orderObjectId).select("items totalPrice")
  ]);

  if (!userDoc || !userDoc.fcmTokens || userDoc.fcmTokens.length === 0) return;
  
  // Create a summary of items (e.g., "Burger, Coke")
  const itemSummary = orderDoc?.items?.map(item => item.name).join(", ").substring(0, 50) || "your order";
  const price = orderDoc ? ` (₹${orderDoc.totalPrice})` : "";

  const statusMessages = {
    "Processing": {
      title: "GullyFoods: Order Placed! 🎊",
      body: `Your order for ${itemSummary}${price} is confirmed and being sent to the kitchen.`,
    },
    "Preparing": {
      title: "GullyFoods: Chef is cooking! 👨‍🍳",
      body: `Great news! Your ${itemSummary} is being freshly prepared right now.`,
    },
    "Out For Delivery": {
      title: "GullyFoods: On the Way! 🛵",
      body: `Your delicious ${itemSummary} has left the kitchen and is zooming towards you!`,
    },
    "Delivered": {
      title: "GullyFoods: Enjoy your meal! 😋",
      body: `Your order for ${itemSummary} has been delivered. We hope you love it!`,
    },
    "Cancelled": {
      title: "GullyFoods: Order Update",
      body: `Your order for ${itemSummary} has been cancelled. Please check the app for details.`,
    },
  };

  const message = statusMessages[status] || {
    title: "GullyFoods: Order Update",
    body: `Your order #${orderId} has been updated to ${status}.`,
  };

  await sendPushNotification(
    userDoc.fcmTokens,
    message.title,
    message.body,
    { 
      orderId: orderId.toString(),
      orderObjectId: orderObjectId.toString(),
      status,
      url: `/order/${orderObjectId}`,
      type: "order_status"
    }
  );
}

/**
 * Send notification to delivery boy about new available order
 * @param {string} deliveryBoyId - Delivery Boy ID
 * @param {string} orderId - Order ID (numeric)
 * @param {string} orderObjectId - Order MongoDB _id
 * @param {string} area - Delivery area
 */
async function sendDeliveryBoyNotification(deliveryBoyId, orderId, orderObjectId, area) {
  console.log(`Sending new order notification to delivery boy ${deliveryBoyId} for order #${orderId}`);
  
  if (!firebaseInitialized) {
    console.log("Firebase not initialized, skipping notification");
    return;
  }

  const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId).select("fcmTokens");
  if (!deliveryBoy || !deliveryBoy.fcmTokens || deliveryBoy.fcmTokens.length === 0) {
    console.log(`No FCM tokens found for delivery boy ${deliveryBoyId}`);
    return;
  }
  
  console.log(`Found ${deliveryBoy.fcmTokens.length} FCM token(s) for delivery boy ${deliveryBoyId}`);

  await sendPushNotification(
    deliveryBoy.fcmTokens,
    "GullyFoods: New Delivery! 🛵",
    `A new order of ${area || "items"} is available! Tap to accept and start earning.`,
    { 
      orderId: orderId.toString(),
      orderObjectId: orderObjectId.toString(),
      url: `/delivery/order/${orderObjectId}`,
      type: "new_delivery"
    }
  );
}

/**
 * Send order cancellation notification to user
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID (numeric)
 * @param {string} orderObjectId - Order MongoDB _id
 */
async function sendOrderCancellationNotification(userId, orderId, orderObjectId) {
  console.log(`Sending cancellation notification for order #${orderId} to user ${userId}`);
  
  if (!firebaseInitialized) {
    console.log("Firebase not initialized, skipping notification");
    return;
  }

  const userDoc = await User.findById(userId).select("fcmTokens");
  if (!userDoc || !userDoc.fcmTokens || userDoc.fcmTokens.length === 0) {
    console.log(`No FCM tokens found for user ${userId}`);
    return;
  }
  
  console.log(`Found ${userDoc.fcmTokens.length} FCM token(s) for user ${userId}`);

  await sendPushNotification(
    userDoc.fcmTokens,
    "Order Cancelled",
    `Your order #${orderId} has been cancelled.`,
    { 
      orderId: orderId.toString(),
      orderObjectId: orderObjectId.toString(),
      status: "Cancelled",
      url: `/order/${orderObjectId}`,
      type: "order_cancelled"
    }
  );
}

/**
 * Send order cancellation notification to delivery boy
 * @param {string} deliveryBoyId - Delivery Boy ID
 * @param {string} orderId - Order ID (numeric)
 * @param {string} orderObjectId - Order MongoDB _id
 */
async function sendDeliveryBoyCancellationNotification(deliveryBoyId, orderId, orderObjectId) {
  console.log(`Sending cancellation notification for order #${orderId} to delivery boy ${deliveryBoyId}`);
  
  if (!firebaseInitialized) {
    console.log("Firebase not initialized, skipping notification");
    return;
  }

  const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId).select("fcmTokens");
  if (!deliveryBoy || !deliveryBoy.fcmTokens || deliveryBoy.fcmTokens.length === 0) {
    console.log(`No FCM tokens found for delivery boy ${deliveryBoyId}`);
    return;
  }
  
  console.log(`Found ${deliveryBoy.fcmTokens.length} FCM token(s) for delivery boy ${deliveryBoyId}`);

  await sendPushNotification(
    deliveryBoy.fcmTokens,
    "Order Cancelled",
    `Order #${orderId} has been cancelled and removed from your deliveries.`,
    { 
      orderId: orderId.toString(),
      orderObjectId: orderObjectId.toString(),
      url: `/delivery`,
      type: "delivery_cancelled"
    }
  );
}

module.exports = { 
  sendPushNotification, 
  sendOrderStatusNotification, 
  sendDeliveryBoyNotification, 
  sendOrderCancellationNotification, 
  sendDeliveryBoyCancellationNotification 
};
