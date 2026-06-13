import { successResponse, errorResponse } from '../utils/response.util.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_T1D3g5Y4TUxnUO',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 't2SXNfaVQFhUHi6Yx5P20Yzu'
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: receipt || `order_rcptid_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    return successResponse(res, { order }, "Razorpay order created successfully");
  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    return errorResponse(res, "Failed to create Razorpay order", 500, error);
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || 't2SXNfaVQFhUHi6Yx5P20Yzu';

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      return successResponse(res, { verified: true }, "Payment verified successfully");
    } else {
      return errorResponse(res, "Invalid payment signature", 400);
    }
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};
