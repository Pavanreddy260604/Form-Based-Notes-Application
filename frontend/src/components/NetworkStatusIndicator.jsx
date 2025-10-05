import React from 'react';

const NetworkStatusIndicator = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="network-status offline">
      <div className="network-status-content">
        <span className="network-icon">⚠️</span>
        <span>You are currently offline</span>
      </div>
      <style jsx>{`
        .network-status {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #dc2626; /* DeepSeek red for error */
          color: #f8fafc; /* Pure white text */
          padding: 12px 16px;
          text-align: center;
          z-index: 1000;
          animation: slideDown 0.3s ease;
          border-bottom: 1px solid #ef4444;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
        
        .network-status-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 500;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
        }
        
        .network-icon {
          font-size: 16px;
          filter: brightness(0) invert(1); /* Make emoji white */
        }
        
        @keyframes slideDown {
          from { 
            transform: translateY(-100%); 
            opacity: 0;
          }
          to { 
            transform: translateY(0); 
            opacity: 1;
          }
        }

        /* Add a subtle pulse animation for attention */
        .network-status {
          animation: slideDown 0.3s ease, pulse 2s infinite;
        }

        @keyframes pulse {
          0% { background: #dc2626; }
          50% { background: #ef4444; }
          100% { background: #dc2626; }
        }
      `}</style>
    </div>
  );
};

export default NetworkStatusIndicator;