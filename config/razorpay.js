const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: 'rzp_live_rqOS9AG74ADgsB',
  key_secret: 'Sx6CgvreKIoWlxn4NwUyq13x'
});



module.exports = razorpay; 