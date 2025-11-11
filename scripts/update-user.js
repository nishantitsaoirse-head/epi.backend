const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function updateUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/epi-project');
    console.log('Connected to MongoDB');

    const userId = '6809528524017594c530e424';
    
    // Create dummy data according to schema
    const dummyData = {
      // Wallet data
      wallet: {
        balance: 1000,
        transactions: [] // Will be populated with transaction IDs
      },
      
      // KYC documents
      kycDocuments: [
        {
          docType: 'idProof',
          docUrl: 'https://example.com/id-proof.jpg',
          status: 'verified',
          verifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          docType: 'addressProof',
          docUrl: 'https://example.com/address-proof.jpg',
          status: 'verified',
          verifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      
      // Bank details
      bankDetails: [
        {
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          accountHolderName: 'Md Danish Ali',
          bankName: 'State Bank of India',
          branchName: 'Main Branch',
          upiId: 'md.danish@upi',
          isDefault: true,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      
      // Referral data
      referredUsers: [], // Will be populated with user IDs
      referredByCode: 'REF123',
      
      // Saved plans
      savedPlans: [
        {
          product: new mongoose.Types.ObjectId(), // Dummy product ID
          targetAmount: 50000,
          savedAmount: 10000,
          dailySavingAmount: 1000,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'active'
        }
      ],
      
      // Other fields
      isAgree: true,
      kycVerified: true,
      role: 'user',
      isActive: true
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: dummyData },
      { new: true }
    ).select('-__v');

    if (updatedUser) {
      console.log('User updated successfully:', updatedUser);
    } else {
      console.log('User not found');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUser(); 