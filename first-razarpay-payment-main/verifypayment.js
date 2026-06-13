const crypto = require('crypto');

function verifySignature(order_id, payment_id, razorpay_signature, secret) {
  const body = order_id + '|' + payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === razorpay_signature;
}

module.exports = verifySignature;
