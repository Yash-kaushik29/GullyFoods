const mongoose = require('mongoose');
const Order = require('./models/Order');
const Wallet = require('./models/Wallet');

mongoose.connect('mongodb://kaushikyash262:iHQShoCN0c8r2F4K@cluster0-shard-00-00.ij4o7.mongodb.net:27017,cluster0-shard-00-01.ij4o7.mongodb.net:27017,cluster0-shard-00-02.ij4o7.mongodb.net:27017/doordash?ssl=true&replicaSet=atlas-naq3q6-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  try {
    // 1. Get premium user
    const wallet = await Wallet.findOne({ isPremium: true });
    if (!wallet) return console.log("No premium wallet found");

    // 2. Create order
    const order = new Order({
      user: wallet.user,
      totalAmount: 100,
      amount: 100,
      shippingAddress: {
        lat: "0", long: "0", fullName: "Test", phone: "123", addressLine: "A", area: "B"
      },
      deliveryStatus: "Processing"
    });
    await order.save();
    console.log("Created order:", order._id);

    // 3. Call confirm-delivery endpoint via axios
    const axios = require('axios');
    const res = await axios.put(`http://localhost:5000/api/delivery/order/confirm-delivery/${order._id}`);
    console.log("Delivery response:", res.data);

    // 4. Check wallet
    const updatedWallet = await Wallet.findById(wallet._id);
    console.log("Updated wallet transactions:", JSON.stringify(updatedWallet.transactions, null, 2));
    
  } catch(e) {
    console.log("Error:", e.response?.data || e.message);
  }
  process.exit(0);
});
