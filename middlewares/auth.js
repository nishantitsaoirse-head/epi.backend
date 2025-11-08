const admin = require('firebase-admin');
const User = require('../models/User');

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Check if user exists in our database
    let user = await User.findOne({ firebaseUid: uid });
    
    // If user doesn't exist in our database but exists in Firebase, create a new user
    if (!user && decodedToken.email) {
      user = new User({
        name: decodedToken.name || decodedToken.email.split('@')[0],
        email: decodedToken.email,
        profilePicture: decodedToken.picture || '',
        firebaseUid: uid
      });
      await user.save();
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
}; 