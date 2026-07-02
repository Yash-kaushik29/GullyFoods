const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");

const razorpayInstance = createRazorpayInstance();

exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid amount!" });
  }

  try {
    let totalAmount = amount;

    // Create a Razorpay order
    const options = {
      amount: totalAmount * 100, // Convert to paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    razorpayInstance.orders.create(options, (err, razorOrder) => {
      if (err) {
        console.error("Error creating Razorpay order:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Something went wrong!",
            error: err,
          });
      }

      res.status(200).json({ success: true, order: razorOrder });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create order",
        error: error.message,
      });
  }
};

// ✅ Verify payment and create actual order
exports.verifyPayments = async (req, res) => {
  const { order_id, payment_id, signature } = req.body;

  console.log(order_id, payment_id, signature);

  const secret = process.env.RAZORPAY_SECRET;

  const hmac = crypto.createHmac("sha256", secret);

  hmac.update(order_id + "|" + payment_id);

  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === signature) {
    res.status(200).json({ success: true, message: "Payment Verified!" });
  } else {
    res.status(400).json({ success: false, message: "Payment Failed!" });
  }
};
