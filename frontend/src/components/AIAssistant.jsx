import { useState, useRef, useEffect } from 'react';

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
    animation: 'slideUp 0.3s ease-out',
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
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
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
    transition: 'all 0.2s ease',
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
    transition: 'all 0.2s ease',
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
    opacity: '0.9',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 12px 0',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  welcomeText: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 32px 0',
    color: '#94a3b8',
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    maxWidth: '400px',
    margin: '0 auto',
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
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
  },
  quickActionIcon: {
    fontSize: '20px',
  },
  quickActionText: {
    fontSize: '12px',
    lineHeight: '1.3',
  },
  message: {
    maxWidth: '85%',
    padding: '16px',
    borderRadius: '18px',
    position: 'relative',
    animation: 'messageSlide 0.3s ease-out',
  },
  mobileMessage: {
    maxWidth: '90%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    borderBottomRightRadius: '6px',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    background: 'rgba(30, 41, 59, 0.9)',
    color: '#e2e8f0',
    border: '1px solid #374151',
    borderBottomLeftRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '11px',
    opacity: '0.8',
  },
  userLabel: {
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
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
    wordBreak: 'break-word',
  },
  errorIndicator: {
    color: '#f87171',
    fontWeight: 'bold',
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
    animation: 'pulse 2s infinite',
  },
  typingAvatar: {
    fontSize: '16px',
    marginTop: '2px',
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
    animation: 'typing 1.4s infinite ease-in-out',
  },
  typingText: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  inputContainer: {
    padding: '20px',
    borderTop: '1px solid #334155',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(10px)',
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
    maxHeight: '120px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s ease',
    lineHeight: '1.4',
  },
  sendButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    color: 'white',
    padding: '14px',
    borderRadius: '14px',
    cursor: 'pointer',
    fontSize: '16px',
    minWidth: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  sendButtonDisabled: {
    background: '#374151',
    border: 'none',
    color: '#6b7280',
    padding: '14px',
    borderRadius: '14px',
    cursor: 'not-allowed',
    fontSize: '16px',
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
    animation: 'spin 1s linear infinite',
  },
  sendIcon: {
    fontSize: '18px',
  },
  inputHint: {
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center',
    marginTop: '8px',
    fontWeight: '500',
  },
  scrollAnchor: {
    height: '1px',
  },
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  const animations = `
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes messageSlide {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  styleSheet.insertRule(animations, styleSheet.cssRules.length);
}

export default AIAssistant;