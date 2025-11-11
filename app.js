const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectDB = require('./config/db');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Initialize DB connection
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Basic session setup (for simulation purposes). In production use a secure store.
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Optional: simulate a logged-in user when SIMULATE_USER_ID is provided (useful for local testing)
if (process.env.SIMULATE_USER_ID) {
  app.use((req, res, next) => {
    try {
      // set in session and cookie for compatibility
      req.session.userId = req.session.userId || process.env.SIMULATE_USER_ID;
      res.cookie('userId', req.session.userId, { httpOnly: true });
    } catch (e) { /* ignore */ }
    next();
  });
}

// Mount routes (routes expose endpoints like /wishlist/add/:productId etc.)
app.use('/', wishlistRoutes);
app.use('/', cartRoutes);

// Health check
app.get('/health', (req, res) => res.json({ success: true, message: 'OK' }));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
