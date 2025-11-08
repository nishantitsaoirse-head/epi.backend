import React, { useState, useEffect } from 'react';
import {
  initDailyInstallmentPayment,
  verifyDailyInstallmentPayment,
  createDailyInstallmentOrder,
  getOrderPaymentStatus
} from '../utils/razorpayUtils';

const DailyInstallmentPayment = ({ orderId, onPaymentSuccess, onPaymentError }) => {
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [error, setError] = useState(null);

  // Fetch order payment status on component mount
  useEffect(() => {
    if (orderId) {
      fetchOrderStatus();
    }
  }, [orderId]);

  // Fetch order payment status
  const fetchOrderStatus = async () => {
    try {
      setLoading(true);
      const status = await getOrderPaymentStatus(orderId);
      setOrderStatus(status);
    } catch (err) {
      setError(err.message || 'Failed to fetch order status');
    } finally {
      setLoading(false);
    }
  };

  // Handle daily payment
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get daily amount from order status
      const dailyAmount = orderStatus?.paymentDetails?.dailyAmount || 100;

      // Create payment order
      const paymentOrder = await createDailyInstallmentOrder({
        orderId,
        dailyAmount
      });

      if (!paymentOrder || paymentOrder.error) {
        throw new Error(paymentOrder?.message || 'Failed to create payment order');
      }

      // Initialize Razorpay payment
      await initDailyInstallmentPayment(
        {
          ...paymentOrder,
          orderId,
          userName: orderStatus?.user?.name,
          userEmail: orderStatus?.user?.email,
          userPhone: orderStatus?.user?.phone
        },
        handlePaymentSuccess,
        handlePaymentError
      );
    } catch (err) {
      setError(err.message || 'Payment initialization failed');
      if (onPaymentError) onPaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response) => {
    try {
      setLoading(true);
      
      // Verify payment with backend
      const result = await verifyDailyInstallmentPayment(response, (err, data) => {
        if (err) {
          setError(err.message || 'Payment verification failed');
          if (onPaymentError) onPaymentError(err);
        } else {
          // Refresh order status
          fetchOrderStatus();
          if (onPaymentSuccess) onPaymentSuccess(data);
        }
      });
      
      return result;
    } catch (err) {
      setError(err.message || 'Payment verification failed');
      if (onPaymentError) onPaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (err) => {
    setError(err.message || 'Payment failed');
    if (onPaymentError) onPaymentError(err);
    setLoading(false);
  };

  // Calculate payment progress if order status is available
  const calculateProgress = () => {
    if (!orderStatus) return 0;
    
    const { totalPaid, orderAmount } = orderStatus;
    if (!totalPaid || !orderAmount) return 0;
    
    return Math.min(100, Math.round((totalPaid / orderAmount) * 100));
  };

  return (
    <div className="daily-installment-container">
      {loading && <div className="loading">Processing payment...</div>}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {orderStatus && (
        <div className="order-status">
          <h3>Payment Status</h3>
          
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          
          <div className="payment-details">
            <p>
              <strong>Total Amount:</strong> ₹{orderStatus.orderAmount}
            </p>
            <p>
              <strong>Paid So Far:</strong> ₹{orderStatus.totalPaid || 0}
            </p>
            <p>
              <strong>Remaining:</strong> ₹{orderStatus.remainingAmount || 0}
            </p>
            <p>
              <strong>Daily Amount:</strong> ₹{orderStatus.paymentDetails?.dailyAmount || 100}
            </p>
          </div>
          
          {orderStatus.paymentStatus !== 'completed' && (
            <button 
              className="payment-button" 
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay Today\'s Installment'}
            </button>
          )}
          
          {orderStatus.paymentStatus === 'completed' && (
            <div className="payment-complete">
              <p>Payment Complete! Thank you for your purchase.</p>
            </div>
          )}
          
          {orderStatus.transactions && orderStatus.transactions.length > 0 && (
            <div className="transaction-history">
              <h4>Payment History</h4>
              <ul>
                {orderStatus.transactions.map((tx) => (
                  <li key={tx.id}>
                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    <span>₹{tx.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyInstallmentPayment; 