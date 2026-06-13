const express = require('express')
const Razorpay = require('razorpay');
const verifySignature = require('./verifypayment');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000;
const path = require('path');

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static('public'));


const razorpay = new Razorpay(
    {
        key_id: process.env.KEY_ID,
        key_secret: process.env.KEY_SECRET
    }
)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})


app.post('/pay', (req,res) => {
    const options = {
        amount: 10000,
        currency: "INR",
        receipt: `order_${req.ip}`
    }
    razorpay.orders.create(options, (error, order) => {
        if (!error) {
            console.log("order created succesfully : ", order);
            res.json({order})
        } else {
            console.log("faild to create order : ", error)
        }
    })
}
)


app.post('/verify', (req,res) => {
    const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;
  const isValid = verifySignature(razorpay_order_id,razorpay_payment_id, razorpay_signature, process.env.KEY_SECRET);
  if (isValid) {
        console.log("payment verify done");
        const filePath = path.join(__dirname, 'public', 'success.html');
        res.sendFile(filePath, (err) => {
            if (err) {
                console.log("unable to send file")
            }
        })
  } else {
    console.log("failed to verify payment");
    const filePath = path.join(__dirname, 'public', 'fail.html');
    res.sendFile(filePath, (err)=> {
 if (err) {
    console.log("payment failed");
 }
    })
  }
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})