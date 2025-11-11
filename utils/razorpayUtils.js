/**
 * Utility functions for Razorpay integration
 */

/**
 * Load the Razorpay SDK script dynamically
 * @returns {Promise} Promise that resolves when script is loaded
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Initialize Razorpay payment for daily installment
 * @param {Object} paymentDetails - The payment details object
 * @param {Function} onSuccess - Callback function on successful payment
 * @param {Function} onError - Callback function on payment error
 * @returns {void}
 */
const initDailyInstallmentPayment = async (paymentDetails, onSuccess, onError) => {
  try {
    // Ensure Razorpay script is loaded
    const res = await loadRazorpayScript();
    
    if (!res) {
      onError(new Error('Razorpay SDK failed to load'));
      return;
    }
    
    // Create options object for Razorpay checkout
    const options = {
      key: paymentDetails.key_id,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      name: 'Daily Installment Payment',
      description: `Payment for order: ${paymentDetails.order_id}`,
      order_id: paymentDetails.order_id,
      handler: function (response) {
        // Call the success callback with payment response
        onSuccess({
          ...response,
          transaction_id: paymentDetails.transaction_id,
          orderId: paymentDetails.orderId
        });
      },
      prefill: {
        name: paymentDetails.userName || '',
        email: paymentDetails.userEmail || '',
        contact: paymentDetails.userPhone || ''
      },
      notes: {
        order_id: paymentDetails.orderId,
        payment_type: 'daily_installment'
      },
      theme: {
        color: '#3399cc'
      },
      modal: {
        ondismiss: function() {
          onError(new Error('Payment cancelled by user'));
        }
      }
    };
    
    // Initialize Razorpay checkout
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    onError(error);
  }
};

/**
 * Verify payment with backend after Razorpay checkout
 * @param {Object} paymentResponse - The response from Razorpay
 * @param {Function} onComplete - Callback function on verification complete
 * @returns {Promise} Promise that resolves with verification result
 */
const verifyDailyInstallmentPayment = async (paymentResponse, onComplete) => {
  try {
    const response = await fetch('/api/payments/verify-daily-installment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        orderId: paymentResponse.orderId,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        transaction_id: paymentResponse.transaction_id
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      onComplete(null, result);
    } else {
      onComplete(new Error(result.message || 'Payment verification failed'));
    }
    
    return result;
  } catch (error) {
    onComplete(error);
    throw error;
  }
};

/**
 * Create a daily installment payment order
 * @param {Object} data - The payment data
 * @returns {Promise} Promise that resolves with the created order
 */
const createDailyInstallmentOrder = async (data) => {
  try {
    const response = await fetch('/api/payments/daily-installment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        orderId: data.orderId,
        dailyAmount: data.dailyAmount
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error creating daily installment order:', error);
    throw error;
  }
};

/**
 * Get payment status for an order
 * @param {String} orderId - The order ID
 * @returns {Promise} Promise that resolves with order payment status
 */
const getOrderPaymentStatus = async (orderId) => {
  try {
    const response = await fetch(`/api/payments/order-status/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error getting order payment status:', error);
    throw error;
  }
};

module.exports = {
  loadRazorpayScript,
  initDailyInstallmentPayment,
  verifyDailyInstallmentPayment,
  createDailyInstallmentOrder,
  getOrderPaymentStatus
}; 