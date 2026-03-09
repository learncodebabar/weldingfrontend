import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

// React Icons
import { 
  FaHome, 
  FaArrowLeft, 
  FaSearch,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaRocket
} from 'react-icons/fa';

const NotFound = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="not-found-container">
      {/* Decorative Background Elements */}
      <div className="not-found-bg-circle circle-1"></div>
      <div className="not-found-bg-circle circle-2"></div>
      <div className="not-found-bg-circle circle-3"></div>
      
      <div className="not-found-content">
        {/* Error Code with Animation */}
        <div className="not-found-code-wrapper">
          <div className="not-found-code">404</div>
          <div className="not-found-code-shadow"></div>
        </div>

        {/* Icon */}
        <div className="not-found-icon">
          <FaExclamationTriangle />
        </div>

        {/* Title */}
        <h1 className="not-found-title">Page Not Found</h1>

        {/* Description */}
        <p className="not-found-description">
          Oops! The page you are looking for doesn't exist or has been moved.
          It might be temporarily unavailable or the link might be broken.
        </p>

        {/* Search Suggestions */}
        {/* <div className="not-found-suggestions">
          <h3>You might want to try:</h3>
          <ul>
            <li>
              <FaSearch className="suggestion-icon" />
              <span>Check the URL for any typos</span>
            </li>
            <li>
              <FaArrowLeft className="suggestion-icon" />
              <span>Go back to the previous page</span>
            </li>
            <li>
              <FaHome className="suggestion-icon" />
              <span>Return to the homepage</span>
            </li>
            <li>
              <FaQuestionCircle className="suggestion-icon" />
              <span>Contact support if the problem persists</span>
            </li>
          </ul>
        </div> */}

        {/* Action Buttons */}
        <div className="not-found-actions">
          <button 
            className="not-found-btn not-found-btn-primary"
            onClick={goHome}
          >
            <FaHome className="btn-icon" />
            Go to Homepage
          </button>
          
          <button 
            className="not-found-btn not-found-btn-secondary"
            onClick={goBack}
          >
            <FaArrowLeft className="btn-icon" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <div className="not-found-help">
          <FaRocket className="help-icon" />
          <p>
            Need help? <a href="/contact">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;