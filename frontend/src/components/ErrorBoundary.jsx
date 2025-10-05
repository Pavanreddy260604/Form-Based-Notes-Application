import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={styles.errorBoundary}>
          <div className="error-content" style={styles.errorContent}>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>We're sorry for the inconvenience. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
              style={styles.retryButton}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  errorBoundary: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a', // DeepSeek dark blue-black
    color: '#f8fafc', // Pure white text
    fontFamily: 'Inter, sans-serif',
    padding: '20px'
  },
  errorContent: {
    textAlign: 'center',
    background: '#1e293b', // Slightly lighter navy
    padding: '40px',
    borderRadius: '16px',
    border: '1px solid #374151', // Border color
    boxShadow: '0 10px 40px rgba(59, 130, 246, 0.15)',
    maxWidth: '500px',
    width: '100%'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#3b82f6', // DeepSeek blue
    margin: '0 0 16px 0'
  },
  message: {
    fontSize: '16px',
    color: '#cbd5e1', // Light gray
    lineHeight: '1.5',
    margin: '0 0 32px 0'
  },
  retryButton: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // DeepSeek blue gradient
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  }
};

// Add hover effect
styles.retryButton[':hover'] = {
  transform: 'translateY(-1px)',
  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'
};

export default ErrorBoundary;