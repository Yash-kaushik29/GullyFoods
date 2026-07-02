const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Order = require('../models/Order');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI_KEY, { dbName: "doordash" }).then(async () => {
    console.log('Connected to MongoDB');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate.`);

    let migrated = 0;
    for (const user of users) {
        // Skip if wallet already exists
        const existingWallet = await Wallet.findOne({ user: user._id });
        if (existingWallet) {
            continue;
        }

        // We use any_ to bypass the schema if we already removed the fields, 
        // but since we haven't dropped them from the db documents, they are accessible via _doc
        const oldBalance = user._doc.walletBalance || 0;
        const oldTransactions = user._doc.walletTransactions || [];
        const oldIsPremium = user._doc.isPremium || false;
        
        let expiryDate = null;
        if (oldIsPremium) {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
        }

        const wallet = new Wallet({
            user: user._id,
            balance: oldBalance,
            isPremium: oldIsPremium,
            premiumExpiryDate: expiryDate,
            transactions: oldTransactions
        });

        await wallet.save();
        migrated++;
    }

    console.log(`Migrated ${migrated} wallets!`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
