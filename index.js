const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const initializeReferralSystem = require('./scripts/initializeReferralSystem');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const walletRoutes = require('./routes/wallet');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const referralRoutes = require('./routes/referralRoutes');
const planRoutes = require('./routes/plans');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// JSON parse error handler (catch invalid JSON bodies early)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error('Invalid JSON received:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  next(err);
});

// Initialize Firebase Admin
try {
  // Build service account object with keys expected by firebase-admin
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (firebasePrivateKey) {
    // strip surrounding quotes if present and convert escaped newlines
    firebasePrivateKey = firebasePrivateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  }

  if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
    const serviceAccount = {
      project_id: firebaseProjectId,
      client_email: firebaseClientEmail,
      private_key: firebasePrivateKey
    };

    // Debug: log that serviceAccount is being used (do not leak private key in production logs)
    try {
      console.log('Firebase envs loaded:', {
        project_id: !!serviceAccount.project_id,
        client_email: !!serviceAccount.client_email,
        private_key_length: serviceAccount.private_key ? serviceAccount.private_key.length : 0
      });
    } catch (e) {
      // ignore
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully');
  } else {
    console.warn('Firebase Admin not initialized: missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/epi-project')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize referral system after successful database connection
    initializeReferralSystem();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/plans', planRoutes);

// Import cart and wishlist routes
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

// Mount cart and wishlist routes
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.get('/', (req, res) => {
  res.send('Epi Project API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Keep the process running
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


