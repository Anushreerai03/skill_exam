import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import nodemailer from 'nodemailer';
import generateOTP from 'generate-otp';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = 3000;
const mongoURI = "mongodb://0.0.0.0:27017/anu";

mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'mongoose connection error'));

db.once('open', () => {
  console.log('connected to mongodb');
});

const userSchema = new mongoose.Schema({
  googleId: String,
  facebookId: String,
  email: String,
  role: { type: String, enum: ['admin', 'superuser', 'user'], default: 'user' }
});

const User = mongoose.model('User', userSchema);

// ... (Other schemas and models)

// Routes for displaying food, filters, search, order placement, order display, etc.

// Display list of available food items
app.get('/api/foods', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    console.error('Error fetching food items', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ... (Other route handlers)

// Allow users to order food
app.post('/api/orders', async (req, res) => {
  try {
    const { foodId, userId, paymentMode, addressId, userEmail } = req.body;
    const otp = generateOTP({ secret: true });

    // Send OTP to user's email for verification
    const mailOptions = {
      from: 'your-email@gmail.com',  // replace with your Gmail email address
      to: userEmail,
      subject: 'Order Verification OTP',
      text: `Your OTP for order verification: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending OTP email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // Save the order with OTP
    const order = new Order({ foodId, userId, paymentMode, addressId, otp });
    const savedOrder = await order.save();

    res.json(savedOrder);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Confirming that the order has been delivered
app.put('/api/orders/delivered/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Update the order status to 'delivered'
    const updatedOrder = await Order.findOneAndUpdate({ orderId }, { status: 'delivered' });

    // You can send a confirmation email to the user here if needed

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error confirming order delivery:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',  // replace with your Gmail email address
    pass: 'your-gmail-password'     // replace with your Gmail password
  }
});

app.listen(port, () => {
  console.log('Server is running on port', port);
});
