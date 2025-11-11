/**
 * Utility functions for product-related operations
 */

/**
 * Generates standardized installment options for a product based on its price
 * @param {Number} price - The product price
 * @returns {Array} Array of installment options
 */
const generateInstallmentOptions = (price) => {
  console.log('generateInstallmentOptions called with price:', price);
  
  if (!price || isNaN(price) || price <= 0) {
    console.error('Invalid price provided:', price);
    return [];
  }
  
  const options = [];
  const startDate = new Date();
  
  // Option 1: Daily payment of 100 INR per day (recommend option)
  const dailyAmount = 100;
  const dailyPeriod = Math.ceil(price / dailyAmount);
  const lastDayAmount = price - (dailyAmount * (dailyPeriod - 1));
  
  const dailyEndDate = new Date(startDate);
  dailyEndDate.setDate(dailyEndDate.getDate() + parseInt(dailyPeriod));
  
  options.push({
    amount: dailyAmount,
    period: dailyPeriod.toString(),
    periodUnit: "days",
    totalAmount: price,
    lastPaymentAmount: lastDayAmount,
    startDate: new Date(startDate),
    endDate: dailyEndDate,
    isRecommended: true
  });
  
  // Option 2: Daily payment of 200 INR per day
  const dailyAmount2 = 200;
  const dailyPeriod2 = Math.ceil(price / dailyAmount2);
  const lastDayAmount2 = price - (dailyAmount2 * (dailyPeriod2 - 1));
  
  const dailyEndDate2 = new Date(startDate);
  dailyEndDate2.setDate(dailyEndDate2.getDate() + parseInt(dailyPeriod2));
  
  options.push({
    amount: dailyAmount2,
    period: dailyPeriod2.toString(),
    periodUnit: "days",
    totalAmount: price,
    lastPaymentAmount: lastDayAmount2,
    startDate: new Date(startDate),
    endDate: dailyEndDate2
  });
  
  // Option 3: Daily payment of 300 INR per day
  const dailyAmount3 = 300;
  const dailyPeriod3 = Math.ceil(price / dailyAmount3);
  const lastDayAmount3 = price - (dailyAmount3 * (dailyPeriod3 - 1));
  
  const dailyEndDate3 = new Date(startDate);
  dailyEndDate3.setDate(dailyEndDate3.getDate() + parseInt(dailyPeriod3));
  
  options.push({
    amount: dailyAmount3,
    period: dailyPeriod3.toString(),
    periodUnit: "days",
    totalAmount: price,
    lastPaymentAmount: lastDayAmount3,
    startDate: new Date(startDate),
    endDate: dailyEndDate3
  });
  
  // Option 4: Daily payment of 500 INR per day
  const dailyAmount4 = 500;
  const dailyPeriod4 = Math.ceil(price / dailyAmount4);
  const lastDayAmount4 = price - (dailyAmount4 * (dailyPeriod4 - 1));
  
  const dailyEndDate4 = new Date(startDate);
  dailyEndDate4.setDate(dailyEndDate4.getDate() + parseInt(dailyPeriod4));
  
  options.push({
    amount: dailyAmount4,
    period: dailyPeriod4.toString(),
    periodUnit: "days",
    totalAmount: price,
    lastPaymentAmount: lastDayAmount4,
    startDate: new Date(startDate),
    endDate: dailyEndDate4
  });
  
  console.log('Generated options:', options);
  return options;
};

/**
 * Calculate equivalent values between different payment periods
 * @param {Object} option - The payment option object
 * @returns {Object} Extended payment option with equivalent values
 */
const calculateEquivalentValues = (option) => {
  const { amount, period, periodUnit, totalAmount } = option;
  const result = { ...option };
  
  if (periodUnit === "days") {
    // Calculate equivalent monthly amount
    result.equivalentMonthlyAmount = Math.ceil(amount * 30);
  }
  
  result.equivalentTime = {
    days: parseInt(period)
  };
  
  // Only calculate start and end dates if they don't already exist
  if (!result.startDate || !result.endDate) {
    const startDate = new Date();
    const endDate = new Date();
    
    if (periodUnit === "days") {
      endDate.setDate(endDate.getDate() + parseInt(period));
    }
    
    if (!result.startDate) result.startDate = startDate;
    if (!result.endDate) result.endDate = endDate;
  }
  
  return result;
};

module.exports = {
  generateInstallmentOptions,
  calculateEquivalentValues
}; 