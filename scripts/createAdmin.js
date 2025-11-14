const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/epi_backend", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function createAdmin() {
  try {
    // Admin user का email और details
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminFirebaseUid = process.env.ADMIN_FIREBASE_UID || "admin_firebase_uid_123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`⚠️ Admin already exists with email: ${adminEmail}`);
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log(`🆔 User ID: ${existingAdmin._id}`);

      // If existing user is not admin, make them admin
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log("✅ Existing user updated to admin role!");
      }

      process.exit(0);
    }

    // Create new admin user
    const adminUser = new User({
      name: "Admin User",
      email: adminEmail,
      firebaseUid: adminFirebaseUid,
      phoneNumber: "9999999999",
      role: "admin",
      isAgree: true,
      isActive: true
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("\n📋 Admin Details:");
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`🔥 Firebase UID: ${adminUser.firebaseUid}`);
    console.log(`🔑 Role: ${adminUser.role}`);
    console.log(`🆔 User ID: ${adminUser._id}`);
    console.log(`📱 Phone: ${adminUser.phoneNumber}`);
    console.log(`🎫 Referral Code: ${adminUser.referralCode}`);

    console.log("\n⚠️ IMPORTANT: Firebase पर भी इसी email/phone से user create करें!");
    console.log(`   Firebase UID: ${adminFirebaseUid} को use करें`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
