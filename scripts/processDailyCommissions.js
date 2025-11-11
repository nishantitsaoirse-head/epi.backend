const mongoose = require('mongoose');
const referralController = require('../controllers/referralController');
const config = require('../config/database');

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Process daily commissions
async function processCommissions() {
  try {
    console.log('Starting daily commission processing...');
    await referralController.processDailyCommission();
    console.log('Daily commission processing completed successfully');
  } catch (error) {
    console.error('Error processing daily commissions:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
  }
}

// Run the script
processCommissions(); 