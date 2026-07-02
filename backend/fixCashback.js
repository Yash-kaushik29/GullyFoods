const mongoose = require('mongoose');
const Order = require('./models/Order');
const Wallet = require('./models/Wallet');

mongoose.connect('mongodb://kaushikyash262:iHQShoCN0c8r2F4K@cluster0-shard-00-00.ij4o7.mongodb.net:27017,cluster0-shard-00-01.ij4o7.mongodb.net:27017,cluster0-shard-00-02.ij4o7.mongodb.net:27017/doordash?ssl=true&replicaSet=atlas-naq3q6-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const order = await Order.findOne({ id: '6QRF1G' });
  if (order) {
    const wallet = await Wallet.findOne({ user: order.user });
    if (wallet) {
      const cashbackEarned = Math.round(order.totalAmount * 0.02);
      if (cashbackEarned > 0) {
        const alreadyCredited = wallet.transactions.some(t => t.description.includes('6QRF1G'));
        if (!alreadyCredited) {
          wallet.balance += cashbackEarned;
          wallet.transactions.push({
            amount: cashbackEarned,
            type: 'Credit',
            description: `Cashback for delivered order ${order.id}`
          });
          await wallet.save();
          console.log('Cashback credited manually');
        } else {
          console.log('Already credited');
        }
      }
    }
  }
  process.exit(0);
});
