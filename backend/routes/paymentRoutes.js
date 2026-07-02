const express = require('express');
const { createOrder, verifyPayments } = require('../controllers/payment.controller');
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.post('/createOrder', authenticateUser, createOrder);
router.post('/verify-payment', verifyPayments);

module.exports = router