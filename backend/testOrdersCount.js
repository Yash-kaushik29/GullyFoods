const mongoose = require('mongoose');
const Order = require('./models/Order');

mongoose.connect('mongodb://kaushikyash262:iHQShoCN0c8r2F4K@cluster0-shard-00-00.ij4o7.mongodb.net:27017,cluster0-shard-00-01.ij4o7.mongodb.net:27017,cluster0-shard-00-02.ij4o7.mongodb.net:27017/doordash?ssl=true&replicaSet=atlas-naq3q6-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentOrdersCount = await Order.countDocuments({
    user: '69cfdbfac698b46803214a46',
    createdAt: { $gte: thirtyDaysAgo }
  });
  console.log('Recent Orders Count:', recentOrdersCount);
  process.exit(0);
});
