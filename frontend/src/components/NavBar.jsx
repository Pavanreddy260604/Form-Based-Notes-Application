import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

// Custom hook for search functionality
const useSearch = (initialQuery = "", user = null) => {
  const [searchState, setSearchState] = useState({
    query: initialQuery,
    isActive: false,
    isLoading: false,
    results: [],
    isFocused: false
  });

  const updateQuery = useCallback((newQuery) => {
    setSearchState(prev => ({
      ...prev,
      query: newQuery,
      isActive: !!newQuery.trim(),
      results: newQuery.trim() ? prev.results : []
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: "",
      isActive: false,
      results: [],
      isFocused: false
    }));
  }, []);

  const setSearchFocus = useCallback((isFocused) => {
    setSearchState(prev => ({ ...prev, isFocused }));
  }, []);

  const performSearch = useCallback(async (query) => {
    if (!query.trim() || !user?.userId) {
      setSearchState(prev => ({ ...prev, results: [], isLoading: false }));
      return;
    }

    setSearchState(prev => ({ ...prev, isLoading: true }));

    try {
      const userItemsResponse = await fetch(`http://localhost:5000/api/items/user/${user.userId}`);
      
      if (!userItemsResponse.ok) {
        throw new Error('Failed to fetch user items');
      }

      const userItemsData = await userItemsResponse.json();
      const userItems = userItemsData.data || [];

      const searchTerm = query.toLowerCase();
      const filteredResults = userItems.filter(item => {
        return (
          (item.title && item.title.toLowerCase().includes(searchTerm)) ||
          (item.intro && item.intro.toLowerCase().includes(searchTerm)) ||
          (item.path && item.path.toLowerCase().includes(searchTerm))
        );
      });

      setSearchState(prev => ({ 
        ...prev, 
        results: filteredResults,
        isLoading: false 
      }));

    } catch (error) {
      setSearchState(prev => ({ 
        ...prev, 
        results: [],
        isLoading: false 
      }));
    }
  }, [user]);

  return {
    searchState,
    updateQuery,
    clearSearch,
    performSearch,
    setSearchFocus
  };
};

// Custom hook for responsive behavior
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return { isMobile };
};

// AI Assistant Component
const AIAssistant = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/ai/chat', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: user?.userId,
          model: "gemma3:4b"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessage = {
        id: Date.now() + 1,
        content: '',
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage.content += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              if (data.finish_reason === 'stop') {
                break;
              }
            } catch (e) {
              console.log('Skipping line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I encountered an error. Please check if the AI server is running on port 8000.',
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const quickActions = [
    { label: "Help organize notes", message: "Can you help me organize my notes better?" },
    { label: "Explain a concept", message: "Explain a programming concept in simple terms" },
    { label: "Code examples", message: "Generate code examples for best practices" },
    { label: "Study tips", message: "Give me some effective study techniques" },
    { label: "Summarize", message: "Can you help me summarize key points?" },
    { label: "Quiz me", message: "Create a quick quiz to test my knowledge" }
  ];

  if (!isOpen) return null;

  return (
    <div style={aiStyles.overlay}>
      <div style={{
        ...aiStyles.modal,
        ...(isMobile ? aiStyles.mobileModal : {})
      }}>
        {/* Enhanced Header */}
        <div style={aiStyles.header}>
          <div style={aiStyles.headerLeft}>
            <div style={aiStyles.avatar}>
              <span style={aiStyles.avatarIcon}>🧠</span>
            </div>
            <div style={aiStyles.headerText}>
              <h3 style={aiStyles.title}>Study Assistant</h3>
              <p style={aiStyles.subtitle}>
                {isLoading ? "Thinking..." : "Powered by AI"}
              </p>
            </div>
          </div>
          <div style={aiStyles.headerRight}>
            {messages.length > 0 && (
              <button 
                onClick={clearChat} 
                style={aiStyles.clearButton} 
                title="Clear chat"
              >
                <span style={aiStyles.buttonIcon}>🗑️</span>
                {!isMobile && "Clear"}
              </button>
            )}
            <button 
              onClick={onClose} 
              style={aiStyles.closeButton} 
              title="Close"
            >
              <span style={aiStyles.buttonIcon}>✕</span>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div style={aiStyles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={aiStyles.welcomeMessage}>
              <div style={aiStyles.welcomeIcon}>🎓</div>
              <h4 style={aiStyles.welcomeTitle}>Hello! I'm your Study Assistant</h4>
              <p style={aiStyles.welcomeText}>
                I can help you with your notes, explain concepts, generate examples, 
                and provide learning guidance. How can I assist you today?
              </p>
              
              {/* Quick Actions Grid */}
              <div style={aiStyles.quickActions}>
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(action.message)}
                    style={aiStyles.quickActionButton}
                  >
                    <span style={aiStyles.quickActionIcon}>
                      {index === 0 && "📝"}
                      {index === 1 && "💡"}
                      {index === 2 && "💻"}
                      {index === 3 && "📚"}
                      {index === 4 && "📋"}
                      {index === 5 && "❓"}
                    </span>
                    <span style={aiStyles.quickActionText}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    ...aiStyles.message,
                    ...(message.role === 'user' ? aiStyles.userMessage : aiStyles.assistantMessage),
                    ...(isMobile && aiStyles.mobileMessage)
                  }}
                >
                  <div style={aiStyles.messageHeader}>
                    <span style={
                      message.role === 'user' 
                        ? aiStyles.userLabel 
                        : aiStyles.assistantLabel
                    }>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span style={aiStyles.messageTime}>{message.timestamp}</span>
                  </div>
                  <div style={aiStyles.messageContent}>
                    {message.content}
                    {message.isError && (
                      <span style={aiStyles.errorIndicator}> ⚠️</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Enhanced Typing Indicator */}
          {isLoading && (
            <div style={aiStyles.typingIndicator}>
              <div style={aiStyles.typingAvatar}>🤖</div>
              <div style={aiStyles.typingContent}>
                <div style={aiStyles.typingDots}>
                  <span style={aiStyles.typingDot}></span>
                  <span style={aiStyles.typingDot}></span>
                  <span style={aiStyles.typingDot}></span>
                </div>
                <span style={aiStyles.typingText}>AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={aiStyles.scrollAnchor} />
        </div>

        {/* Enhanced Input Area */}
        <div style={aiStyles.inputContainer}>
          <div style={aiStyles.inputWrapper}>
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your notes or learning..."
              style={aiStyles.textInput}
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={
                !inputMessage.trim() || isLoading
                  ? aiStyles.sendButtonDisabled
                  : aiStyles.sendButton
              }
              title="Send message"
            >
              {isLoading ? (
                <div style={aiStyles.sendButtonLoading}></div>
              ) : (
                <span style={aiStyles.sendIcon}>🚀</span>
              )}
            </button>
          </div>
          <div style={aiStyles.inputHint}>
            {isMobile ? 'Tap to send' : 'Press Enter to send, Shift+Enter for new line'}
          </div>
        </div>
      </div>
    </div>
  );
};

const aiStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '10px',
    backdropFilter: 'blur(5px)',
  },
  modal: {
    width: '100%',
    maxWidth: '500px',
    height: '90vh',
    maxHeight: '800px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderRadius: '20px',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  mobileModal: {
    maxWidth: '100%',
    height: '100vh',
    maxHeight: '100vh',
    borderRadius: '0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #334155',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
  },
  avatarIcon: {
    fontSize: '20px',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    margin: 0,
    color: '#f8fafc',
    fontSize: '18px',
    fontWeight: '700',
  },
  subtitle: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '500',
  },
  headerRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  clearButton: {
    background: 'rgba(100, 116, 139, 0.2)',
    border: '1px solid #475569',
    color: '#cbd5e1',
    padding: '8px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  closeButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #dc2626',
    color: '#fca5a5',
    padding: '10px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
  },
  buttonIcon: {
    fontSize: '14px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%)',
  },
  welcomeMessage: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#cbd5e1',
  },
  welcomeIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 12px 0',
  },
  welcomeText: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 32px 0',
    color: '#94a3b8',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  quickActionButton: {
    background: 'rgba(96, 165, 250, 0.1)',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    color: '#60a5fa',
    padding: '16px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  quickActionIcon: {
    fontSize: '20px',
  },
  quickActionText: {
    fontSize: '12px',
  },
  message: {
    maxWidth: '85%',
    padding: '16px',
    borderRadius: '18px',
  },
  mobileMessage: {
    maxWidth: '90%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    borderBottomRightRadius: '6px',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    background: 'rgba(30, 41, 59, 0.9)',
    color: '#e2e8f0',
    border: '1px solid #374151',
    borderBottomLeftRadius: '6px',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '11px',
  },
  userLabel: {
    fontWeight: '600',
  },
  assistantLabel: {
    fontWeight: '600',
    color: '#60a5fa',
  },
  messageTime: {
    fontSize: '10px',
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  errorIndicator: {
    color: '#f87171',
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '18px',
    alignSelf: 'flex-start',
    border: '1px solid #374151',
    maxWidth: '200px',
  },
  typingAvatar: {
    fontSize: '16px',
  },
  typingContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  typingDots: {
    display: 'flex',
    gap: '4px',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#94a3b8',
  },
  typingText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  inputContainer: {
    padding: '20px',
    borderTop: '1px solid #334155',
    background: 'rgba(15, 23, 42, 0.95)',
  },
  inputWrapper: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    padding: '14px 16px',
    border: '1px solid #475569',
    borderRadius: '16px',
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: '15px',
    resize: 'none',
    minHeight: '48px',
    fontFamily: 'inherit',
  },
  sendButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    color: 'white',
    padding: '14px',
    borderRadius: '14px',
    cursor: 'pointer',
    minWidth: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    background: '#374151',
    border: 'none',
    color: '#6b7280',
    padding: '14px',
    borderRadius: '14px',
    cursor: 'not-allowed',
    minWidth: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonLoading: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
  },
  sendIcon: {
    fontSize: '18px',
  },
  inputHint: {
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center',
    marginTop: '8px',
  },
  scrollAnchor: {
    height: '1px',
  },
};

// Search Results Component
const SearchResults = React.memo(({ 
  results, 
  isLoading, 
  onResultClick, 
  isVisible,
  query 
}) => {
  if (!isVisible || (!results.length && !isLoading && query.length === 0)) return null;

  return (
    <div className="search-results">
      <div className="search-results-content">
        {isLoading ? (
          <div className="search-loading">
            <div className="search-spinner"></div>
            <span>Searching...</span>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="search-results-header">
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="search-results-list">
              {results.map((result) => (
                <Link
                  key={result._id || result.id}
                  to={result.path || `/note/${result._id || result.id}`}
                  className="search-result-item"
                  onClick={() => onResultClick?.(result)}
                >
                  <div className="result-content">
                    <div className="result-title">{result.title || 'Untitled Note'}</div>
                    {result.intro && (
                      <div className="result-description">{result.intro}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : query.length > 0 ? (
          <div className="search-empty">
            <div className="empty-text">No notes found</div>
            <div className="empty-subtext">Try different keywords</div>
          </div>
        ) : null}
      </div>
    </div>
  );
});

// Search Input Component
const SearchInput = React.memo(({ 
  searchState, 
  onSearchChange, 
  onSearchSubmit, 
  onClearSearch,
  onFocus,
  onBlur,
  placeholder = "Search notes...",
  compact = false
}) => {
  const inputRef = useRef(null);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSearchSubmit?.(searchState.query);
  }, [searchState.query, onSearchSubmit]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    onClearSearch?.();
    inputRef.current?.focus();
  }, [onClearSearch]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleInputFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      onBlur?.();
    }, 200);
  }, [onBlur]);

  return (
    <div className={`search-container ${searchState.isFocused ? 'focused' : ''}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className={`search-input-container ${compact ? 'compact' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchState.query}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="search-input"
            aria-label="Search notes"
          />
          
          <div className="search-controls">
            {searchState.isLoading && (
              <div className="search-spinner" aria-label="Searching">
                <div className="spinner" />
              </div>
            )}
            
            {searchState.query && !searchState.isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
});

// User Profile Component
const UserProfile = React.memo(({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    onLogout?.();
    setIsDropdownOpen(false);
  }, [onLogout]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <div ref={dropdownRef} className="user-profile">
      <button
        onClick={toggleDropdown}
        className="user-profile-trigger"
        aria-expanded={isDropdownOpen}
        aria-label="User menu"
      >
        <div className="user-avatar">
          {userInitial}
        </div>
      </button>

      {isDropdownOpen && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="logout-btn"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
});

// Mobile Menu Component
const MobileMenu = React.memo(({ 
  isOpen, 
  user, 
  onClose, 
  onLogout, 
  onLinkClick
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mobile-menu-overlay">
      <div 
        ref={menuRef}
        className="mobile-menu"
        role="dialog"
        aria-label="Navigation menu"
      >
        <div className="mobile-menu-content">
          {user && (
            <div className="mobile-user-section">
              <div className="user-display">
                <div className="user-avatar large">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="mobile-logout-btn"
              >
                Sign Out
              </button>
            </div>
          )}

          <nav className="mobile-nav-links">
            <Link to="/" onClick={onLinkClick} className="mobile-nav-link">
              All Notes
            </Link>
            <Link to="/add-topic" onClick={onLinkClick} className="mobile-nav-link">
              Create Note
            </Link>
          </nav>

          {!user && (
            <div className="mobile-auth-section">
              <Link
                to="/login"
                onClick={onLinkClick}
                className="mobile-signin-btn"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mobile-menu-close"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>
    </div>
  );
});

// Hamburger Button Component
const HamburgerButton = React.memo(({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`hamburger-btn ${isOpen ? 'open' : ''}`}
      aria-label="Toggle navigation menu"
      aria-expanded={isOpen}
    >
      <span className="hamburger-line" />
      <span className="hamburger-line" />
      <span className="hamburger-line" />
    </button>
  );
});

// AI Assistant Button Component
const AIAssistantButton = React.memo(({ onClick, isMobile }) => {
  return (
    <button
      onClick={onClick}
      className="ai-assistant-button"
      title="Open AI Assistant"
      aria-label="Open AI Assistant"
    >
      <span className="ai-icon">🤖</span>
      {!isMobile && <span className="ai-text">AI Assistant</span>}
    </button>
  );
});

// Main NavBar Component
function NavBar({ user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  
  const lastScrollY = useRef(0);
  const navRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const search = useSearch("", user);

  useEffect(() => {
    if (mobileMenuOpen || search.searchState.isFocused) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 100) {
        setIsNavVisible(true);
      } else {
        const scrollDelta = currentScrollY - lastScrollY.current;
        setIsNavVisible(scrollDelta < 0 || currentScrollY < lastScrollY.current);
      }
      
      lastScrollY.current = currentScrollY;
    };

    const throttledScroll = () => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [mobileMenuOpen, search.searchState.isFocused]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (search.searchState.query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        const executeSearch = async () => {
          await search.performSearch(search.searchState.query);
        };
        executeSearch();
      }, 500);
    } else {
      search.clearSearch();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search.searchState.query, user]);

  const handleLogout = useCallback(() => {
    onLogout?.();
    setMobileMenuOpen(false);
    navigate('/login');
  }, [onLogout, navigate]);

  const handleLinkClick = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const toggleAIAssistant = useCallback(() => {
    setShowAIAssistant(prev => !prev);
  }, []);

  const handleSearchFocus = useCallback(() => {
    search.setSearchFocus(true);
    setIsNavVisible(true);
  }, [search]);

  const handleSearchBlur = useCallback(() => {
    search.setSearchFocus(false);
  }, [search]);

  const handleSearchSubmit = useCallback((query) => {
    if (query.trim()) {
      const executeSearch = async () => {
        await search.performSearch(query);
      };
      executeSearch();
    }
  }, [search]);

  const handleResultClick = useCallback(() => {
    search.setSearchFocus(false);
    search.clearSearch();
  }, [search]);

  const navClassName = `navbar ${isNavVisible ? 'visible' : 'hidden'}`;

  return (
    <>
      <nav ref={navRef} className={navClassName}>
        <div className="nav-left">
          <Link to="/" onClick={handleLinkClick} className="nav-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
                <path 
                  d="M8 8h8M8 12h6M8 16h4" 
                  stroke="white" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                />
              </svg>
            </div>
            {!isMobile && (
              <span className="logo-text">StudyNotes</span>
            )}
          </Link>
        </div>

        <div className="nav-middle">
          <div className="search-wrapper">
            <SearchInput
              searchState={search.searchState}
              onSearchChange={search.updateQuery}
              onSearchSubmit={handleSearchSubmit}
              onClearSearch={search.clearSearch}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              compact={isMobile}
              placeholder={isMobile ? "Search..." : "Search notes..."}
            />
            
            <SearchResults
              results={search.searchState.results}
              isLoading={search.searchState.isLoading}
              onResultClick={handleResultClick}
              isVisible={search.searchState.isFocused}
              query={search.searchState.query}
            />
          </div>
        </div>

        <div className="nav-right">
          {/* AI Assistant Button */}
          <AIAssistantButton 
            onClick={toggleAIAssistant}
            isMobile={isMobile}
          />

          {user ? (
            <>
              {!isMobile && (
                <UserProfile user={user} onLogout={handleLogout} />
              )}
              
              {isMobile && (
                <HamburgerButton 
                  isOpen={mobileMenuOpen} 
                  onClick={toggleMobileMenu} 
                />
              )}
            </>
          ) : (
            !isMobile && (
              <Link to="/login" className="login-btn">
                Sign In
              </Link>
            )
          )}
        </div>
      </nav>

      {/* AI Assistant Modal */}
      <AIAssistant 
        isOpen={showAIAssistant}
        onClose={toggleAIAssistant}
        user={user}
      />

      {isMobile && (
        <MobileMenu
          isOpen={mobileMenuOpen}
          user={user}
          onClose={() => setMobileMenuOpen(false)}
          onLogout={handleLogout}
          onLinkClick={handleLinkClick}
        />
      )}

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(15, 23, 42, 0.98);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(55, 65, 81, 0.4);
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          padding: 0 20px;
          z-index: 1000;
          transition: transform 0.3s ease, opacity 0.3s ease;
          gap: 20px;
        }

        .navbar.visible {
          transform: translateY(0);
          opacity: 1;
        }

        .navbar.hidden {
          transform: translateY(-100%);
          opacity: 0;
        }

        .nav-left,
        .nav-right {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .nav-middle {
          display: flex;
          justify-content: center;
          align-items: center;
          min-width: 0;
        }

        .search-wrapper {
          position: relative;
          width: 100%;
          max-width: 500px;
        }

        /* Logo Styles */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: inherit;
          padding: 6px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .nav-logo:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          color: #8b5cf6;
          flex-shrink: 0;
        }

        .logo-text {
          font-weight: 600;
          font-size: 18px;
          color: #f8fafc;
          white-space: nowrap;
        }

        /* AI Assistant Button Styles */
        .ai-assistant-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
          margin-right: 12px;
        }

        .ai-assistant-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }

        .ai-icon {
          font-size: 16px;
        }

        .ai-text {
          white-space: nowrap;
        }

        /* Minimal Search Styles */
        .search-container {
          width: 100%;
        }

        .search-container.focused .search-input-container {
          border-color: #8b5cf6;
          background: rgba(30, 41, 59, 0.9);
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid #374151;
          border-radius: 10px;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: #f8fafc;
          font-size: 14px;
          outline: none;
          min-width: 120px;
        }

        .search-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .search-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
        }

        .search-spinner {
          display: flex;
          align-items: center;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #8b5cf6;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .search-clear-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          font-size: 12px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .search-clear-btn:hover {
          background: #374151;
          color: #f8fafc;
        }

        /* Clean Search Results */
        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 6px;
          background: #1e293b;
          border: 1px solid #374151;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          z-index: 1001;
          animation: slideDown 0.2s ease;
          overflow: hidden;
        }

        .search-results-content {
          max-height: 350px;
          overflow-y: auto;
        }

        .search-loading {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          font-size: 13px;
        }

        .search-results-header {
          padding: 12px 16px;
          border-bottom: 1px solid #374151;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .search-results-list {
          padding: 6px;
        }

        .search-result-item {
          display: block;
          padding: 12px 14px;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: background-color 0.2s ease;
          margin-bottom: 2px;
        }

        .search-result-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .result-title {
          font-weight: 500;
          font-size: 13px;
          color: #f8fafc;
          margin-bottom: 4px;
        }

        .result-description {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .search-empty {
          padding: 30px 20px;
          text-align: center;
          color: #94a3b8;
        }

        .empty-text {
          font-weight: 500;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .empty-subtext {
          font-size: 11px;
        }

        /* Clean User Profile */
        .user-profile {
          position: relative;
        }

        .user-profile-trigger {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .user-profile-trigger:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 500;
          font-size: 13px;
        }

        .user-avatar.large {
          width: 42px;
          height: 42px;
          font-size: 15px;
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 6px;
          background: #1e293b;
          border: 1px solid #374151;
          border-radius: 10px;
          padding: 12px;
          min-width: 180px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          animation: dropdownAppear 0.2s ease;
          z-index: 1001;
        }

        .user-info {
          padding: 8px 0;
          border-bottom: 1px solid #374151;
          margin-bottom: 8px;
        }

        .user-name {
          color: #f8fafc;
          font-weight: 500;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .user-email {
          color: #94a3b8;
          font-size: 11px;
        }

        .logout-btn {
          width: 100%;
          background: none;
          border: none;
          color: #ef4444;
          text-align: left;
          cursor: pointer;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Clean Login Button */
        .login-btn {
          padding: 8px 16px;
          background: #8b5cf6;
          border: none;
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-weight: 500;
          font-size: 13px;
          transition: background-color 0.2s ease;
        }

        .login-btn:hover {
          background: #7c3aed;
        }

        /* Hamburger Button */
        .hamburger-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s ease;
          gap: 3px;
        }

        .hamburger-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .hamburger-line {
          width: 18px;
          height: 2px;
          background: #cbd5e1;
          transition: all 0.3s ease;
          border-radius: 1px;
        }

        .hamburger-btn.open .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger-btn.open .hamburger-line:nth-child(2) {
          opacity: 0;
        }

        .hamburger-btn.open .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        /* Mobile Menu */
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1002;
          animation: overlayAppear 0.3s ease;
        }

        .mobile-menu {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 300px;
          background: #0f172a;
          border-left: 1px solid #374151;
          animation: slideIn 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .mobile-menu-content {
          flex: 1;
          padding: 24px 20px;
          overflow-y: auto;
        }

        .mobile-user-section {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid #374151;
        }

        .user-display {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .user-details {
          flex: 1;
        }

        .mobile-logout-btn {
          width: 100%;
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .mobile-logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mobile-nav-link {
          padding: 12px 14px;
          color: #f8fafc;
          text-decoration: none;
          border-radius: 8px;
          transition: background-color 0.2s ease;
          font-weight: 500;
          font-size: 14px;
        }

        .mobile-nav-link:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .mobile-auth-section {
          margin-top: auto;
          padding-top: 16px;
        }

        .mobile-signin-btn {
          display: block;
          width: 100%;
          padding: 12px 16px;
          background: #8b5cf6;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          text-align: center;
          transition: background-color 0.2s ease;
        }

        .mobile-signin-btn:hover {
          background: #7c3aed;
        }

        .mobile-menu-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .mobile-menu-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes dropdownAppear {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes overlayAppear {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .navbar {
            height: 60px;
            padding: 0 16px;
            gap: 16px;
          }

          .logo-text {
            display: none;
          }

          .search-input {
            font-size: 16px;
            padding: 10px 14px;
          }

          .nav-logo {
            padding: 4px;
          }

          .logo-icon {
            width: 28px;
            height: 28px;
          }

          .ai-assistant-button {
            padding: 8px;
            margin-right: 8px;
          }

          .ai-text {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .navbar {
            padding: 0 12px;
            gap: 12px;
          }

          .search-input::placeholder {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
}

export default React.memo(NavBar);