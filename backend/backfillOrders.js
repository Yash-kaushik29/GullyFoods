const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Order = require('./models/Order');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI_KEY).then(async () => {
    console.log('Connected to MongoDB');
    console.log('DB Name:', mongoose.connection.db.databaseName);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Get start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        // Count orders created this month
        const monthlyCount = await Order.countDocuments({
            user: user._id,
            createdAt: { $gte: startOfMonth }
        });

        // Update user
        user.monthlyOrdersCount = monthlyCount;
        if (monthlyCount >= 15) {
            user.isPremium = true;
        }
        await user.save();
        console.log(`User ${user.username} has ${monthlyCount} orders this month.`);
    }

    console.log('Backfill complete!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
