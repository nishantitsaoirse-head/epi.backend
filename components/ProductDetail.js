import React, { useState, useEffect } from 'react';
import { initDailyInstallmentPayment, verifyDailyInstallmentPayment } from '../utils/razorpayUtils';
import DailyInstallmentPayment from './DailyInstallmentPayment';

const ProductDetail = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setProduct(data);
          
          // Set default selected option if available
          if (data.installmentOptions && data.installmentOptions.length > 0) {
            const recommendedOption = data.installmentOptions.find(
              option => option.isRecommended
            ) || data.installmentOptions[0];
            
            setSelectedOption(recommendedOption);
          }
        } else {
          setError(data.message || 'Failed to fetch product details');
        }
      } catch (err) {
        setError('Error fetching product: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // Handle option selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  // Handle Book Now button click
  const handleBookNow = async () => {
    try {
      if (!isAuthenticated) {
        // Redirect to login
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      
      if (!selectedOption) {
        setError('Please select a payment option');
        return;
      }
      
      setLoading(true);
      
      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: product._id,
          paymentOption: selectedOption.periodUnit === 'days' ? 'daily' : 'monthly',
          paymentDetails: {
            dailyAmount: selectedOption.amount,
            monthlyAmount: selectedOption.periodUnit === 'months' ? selectedOption.amount : null,
            totalDuration: parseInt(selectedOption.period),
            numberOfMonths: selectedOption.periodUnit === 'months' ? parseInt(selectedOption.period) : null
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      // Set order id from response
      setOrderId(data.order._id);
      
      // If daily payment option and payment data available, setup Razorpay
      if (
        data.order.paymentOption === 'daily' && 
        data.payment && 
        data.payment.order_id
      ) {
        setPaymentInfo(data.payment);
        
        // Handle first payment through Razorpay
        initDailyInstallmentPayment({
          ...data.payment,
          orderId: data.order._id,
          userName: localStorage.getItem('userName'),
          userEmail: localStorage.getItem('userEmail'),
          userPhone: localStorage.getItem('userPhone')
        }, 
        handlePaymentSuccess, 
        handlePaymentError);
      } else if (data.order.paymentOption === 'upfront') {
        // For upfront payment, show confirmation
        setShowPaymentModal(true);
      } else {
        // For other payment types
        setShowPaymentModal(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response) => {
    try {
      // Verify payment
      const verifyResponse = await verifyDailyInstallmentPayment(
        response,
        (err, data) => {
          if (err) {
            setError(err.message || 'Payment verification failed');
          } else {
            setShowPaymentModal(true);
          }
        }
      );
      
      return verifyResponse;
    } catch (err) {
      setError(err.message || 'Payment verification failed');
    }
  };

  // Handle payment error
  const handlePaymentError = (err) => {
    setError(err.message || 'Payment failed');
    setLoading(false);
  };

  if (loading && !product) {
    return <div className="loading">Loading product details...</div>;
  }

  if (error && !product) {
    return <div className="error">{error}</div>;
  }

  if (!product) {
    return <div className="not-found">Product not found</div>;
  }

  return (
    <div className="product-detail">
      {/* Product Image Gallery */}
      <div className="product-images">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="main-image"
          />
        ) : (
          <div className="placeholder-image">No image available</div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="product-info">
        <h1 className="product-name">{product.name}</h1>
        
        <div className="product-price">
          <span className="current-price">₹{product.price}</span>
          {product.originalPrice && (
            <span className="original-price">₹{product.originalPrice}</span>
          )}
          {product.originalPrice && (
            <span className="discount">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
            </span>
          )}
        </div>
        
        <div className="product-description">
          <p>{product.description}</p>
        </div>
        
        {/* Installment Options */}
        {product.installmentOptions && product.installmentOptions.length > 0 && (
          <div className="installment-options">
            <h3>Payment Options</h3>
            
            <div className="options-list">
              {product.installmentOptions.map((option, index) => (
                <div 
                  key={index}
                  className={`option-card ${selectedOption === option ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="option-header">
                    <h4>
                      ₹{option.amount}/{option.periodUnit === 'days' ? 'day' : 'month'}
                    </h4>
                    {option.isRecommended && <span className="recommended-tag">Recommended</span>}
                  </div>
                  
                  <div className="option-details">
                    <p>Total Duration: {option.period} {option.periodUnit}</p>
                    <p>Total Amount: ₹{option.totalAmount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="product-actions">
          <button 
            className="book-now-btn"
            onClick={handleBookNow}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Book Now'}
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && orderId && (
        <div className="payment-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            <h2>Order Confirmed</h2>
            
            <DailyInstallmentPayment 
              orderId={orderId}
              onPaymentSuccess={() => {
                // Update UI or redirect
                setError(null);
              }}
              onPaymentError={(err) => {
                setError(err.message || 'Payment failed');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail; 