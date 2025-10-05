import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

// AI Assistant Component (same as in Topics.jsx)
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
    { 
      label: "Help with structure", 
      message: "Help me structure this note better. What sections should I include?" 
    },
    { 
      label: "Generate examples", 
      message: "Can you generate some code examples for a programming topic?" 
    },
    { 
      label: "Improve content", 
      message: "Review my note content and suggest improvements" 
    },
    { 
      label: "Best practices", 
      message: "What are some best practices I should include in my note?" 
    },
    { 
      label: "Learning objectives", 
      message: "Help me define clear learning objectives for this topic" 
    },
    { 
      label: "Study tips", 
      message: "Suggest effective study techniques for this subject" 
    }
  ];

  if (!isOpen) return null;

  return (
    <div style={aiStyles.overlay}>
      <div style={{
        ...aiStyles.modal,
        ...(isMobile ? aiStyles.mobileModal : {})
      }}>
        {/* Header */}
        <div style={aiStyles.header}>
          <div style={aiStyles.headerLeft}>
            <div style={aiStyles.avatar}>
              <span style={aiStyles.avatarIcon}>🤖</span>
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
          
          {/* Typing Indicator */}
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

        {/* Input Area */}
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

// Main AddNoteForm Component
const AddNoteForm = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    path: "",
    intro: "",
    why: { title: "", points: [""] },
    examples: [{ title: "", code: "" }],
    best: { title: "", points: [""], conclusion: "" },
    userId: user?.userId
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (field, index, subfield, value) => {
    setFormData(prev => {
      const copy = { ...prev };
      if (field === "why") copy.why.points[index] = value;
      else if (field === "examples") copy.examples[index][subfield] = value;
      else if (field === "best" && subfield === "points") copy.best.points[index] = value;
      return copy;
    });
  };

  const addPoint = (field) => {
    setFormData(prev => {
      const copy = { ...prev };
      if (field === "why") copy.why.points.push("");
      else if (field === "best") copy.best.points.push("");
      else if (field === "examples") copy.examples.push({ title: "", code: "" });
      return copy;
    });
    toast.success(`Added new ${field === 'examples' ? 'example' : 'point'}`);
  };

  const removePoint = (field, index) => {
    if ((field === "why" && formData.why.points.length === 1) ||
        (field === "best" && formData.best.points.length === 1) ||
        (field === "examples" && formData.examples.length === 1)) {
      toast.error(`Cannot remove the last ${field === 'examples' ? 'example' : 'point'}`);
      return;
    }

    setFormData(prev => {
      const copy = { ...prev };
      if (field === "why") copy.why.points.splice(index, 1);
      else if (field === "best") copy.best.points.splice(index, 1);
      else if (field === "examples") copy.examples.splice(index, 1);
      return copy;
    });
    toast.success(`Removed ${field === 'examples' ? 'example' : 'point'}`);
  };

  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant);
  };

  const handleImport = () => {
    try {
      if (!importData.trim()) {
        toast.error("Please paste JSON data");
        return;
      }

      const parsedData = JSON.parse(importData);
      
      const importedFormData = {
        title: parsedData.title || "",
        path: parsedData.path || "",
        intro: parsedData.intro || "",
        why: {
          title: parsedData.why?.title || "",
          points: Array.isArray(parsedData.why?.points) ? parsedData.why.points : [""]
        },
        examples: Array.isArray(parsedData.examples) 
          ? parsedData.examples.map(ex => ({
              title: ex.title || "",
              code: ex.code || ""
            }))
          : [{ title: "", code: "" }],
        best: {
          title: parsedData.best?.title || "",
          points: Array.isArray(parsedData.best?.points) ? parsedData.best.points : [""],
          conclusion: parsedData.best?.conclusion || ""
        },
        userId: user?.userId
      };

      setFormData(importedFormData);
      setShowImport(false);
      setImportData("");
      toast.success("Notes imported successfully!");
    } catch (err) {
      toast.error("Invalid JSON format. Please check your data.");
    }
  };

  const loadSampleData = () => {
    const sampleData = {
      title: "React Props: Zero ➝ Hero 🚀",
      path: "/props",
      intro: "Learn React props step by step, starting from basics and moving to advanced patterns.",
      why: {
        title: "Why Props Matter in React",
        points: [
          "Enable passing data from parent to child components.",
          "Make components reusable and dynamic.",
          "Allow separation of concerns between logic and presentation.",
          "Support callbacks for communication between components."
        ]
      },
      examples: [
        {
          title: "1. What Are Props?",
          code: "function Greeting(props) {\n  return <h1>Hello, {props.name}!</h1>;\n}\n\n// Usage\n<Greeting name=\"Pavan\" />"
        },
        {
          title: "2. Props with Destructuring",
          code: "function Greeting({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\n// Usage\n<Greeting name=\"Alice\" />"
        }
      ],
      best: {
        title: "Best Practices 📝",
        points: [
          "Always use descriptive and meaningful prop names.",
          "Use default props or optional chaining to avoid errors.",
          "Group related values in objects/arrays instead of many props.",
          "Pass functions as props for event handling.",
          "Remember: props are immutable. Never modify them in child components."
        ],
        conclusion: "Following these best practices ensures clean, maintainable, and professional React components."
      }
    };

    setImportData(JSON.stringify(sampleData, null, 2));
    toast.success("Sample data loaded. Click 'Import Data' to apply.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/items/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add note");

      toast.success("Note published successfully!");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: "",
      path: "",
      intro: "",
      why: { title: "", points: [""] },
      examples: [{ title: "", code: "" }],
      best: { title: "", points: [""], conclusion: "" },
      userId: user?.userId
    });
    toast.success("Form reset successfully!");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
      toast.success("Notes copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div style={styles.container}>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2d3748',
            color: '#fff',
            borderRadius: '10px',
            border: '1px solid #4a5568',
            fontSize: '14px',
            maxWidth: '90vw'
          },
          success: {
            iconTheme: {
              primary: '#48bb78',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f56565',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* AI Assistant Button - Fixed for mobile */}
      <div style={{
        ...styles.aiButtonContainer,
        ...(isMobile && styles.aiButtonContainerMobile)
      }}>
        <button 
          onClick={toggleAIAssistant}
          style={styles.aiButton}
          title="Open AI Assistant"
        >
          <span style={styles.aiIcon}>🤖</span>
          AI Assistant
        </button>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant 
        isOpen={showAIAssistant}
        onClose={toggleAIAssistant}
        user={user}
      />
      
      <div style={styles.header}>
        <h1 style={styles.title}>Create New Note</h1>
        <p style={styles.subtitle}>Build comprehensive learning materials with ease</p>
      </div>

      {/* Import/Export Controls */}
      <div style={styles.importSection}>
        <button 
          type="button" 
          onClick={() => setShowImport(!showImport)}
          style={showImport ? styles.importButtonActive : styles.importButton}
        >
          {showImport ? "✕ Close" : "📥 Import"}
        </button>
        
        <button 
          type="button" 
          onClick={loadSampleData}
          style={styles.sampleButton}
        >
          🚀 Sample
        </button>

        <button 
          type="button" 
          onClick={copyToClipboard}
          style={styles.exportButton}
        >
          📋 Export
        </button>
      </div>

      {showImport && (
        <div style={styles.importModal}>
          <h3 style={styles.importTitle}>Import JSON Data</h3>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder={`Paste your JSON data here...\n\nExample:\n{\n  "title": "React Hooks",\n  "path": "/hooks",\n  "intro": "Learn about React Hooks",\n  "why": { "title": "...", "points": ["..."] },\n  "examples": [{ "title": "...", "code": "..." }],\n  "best": { "title": "...", "points": ["..."], "conclusion": "..." }\n}`}
            rows="12"
            style={styles.importTextarea}
          />
          <div style={styles.importActions}>
            <button 
              type="button" 
              onClick={handleImport}
              style={styles.importSubmit}
            >
              Import Data
            </button>
            <button 
              type="button" 
              onClick={() => setShowImport(false)}
              style={styles.importCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basic Information */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📝 Basic Information</h2>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Note Title *</label>
              <input
                type="text"
                name="title"
                placeholder="e.g., React Hooks"
                value={formData.title}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>URL Path *</label>
              <input
                type="text"
                name="path"
                placeholder="e.g., /hooks"
                value={formData.path}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Introduction</label>
            <textarea
              name="intro"
              placeholder="Brief introduction about the topic..."
              value={formData.intro}
              onChange={handleChange}
              rows="3"
              style={styles.textarea}
            />
          </div>
        </section>

        {/* Why Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>💡 Why Learn This?</h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>Section Title</label>
            <input
              type="text"
              placeholder="Why learn about this topic?"
              value={formData.why.title}
              onChange={e => setFormData(prev => ({ ...prev, why: { ...prev.why, title: e.target.value } }))}
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Key Points</label>
            {formData.why.points.map((point, index) => (
              <div key={index} style={styles.pointItem}>
                <input
                  type="text"
                  placeholder={`Point ${index + 1}`}
                  value={point}
                  onChange={e => handleNestedChange("why", index, null, e.target.value)}
                  style={styles.input}
                />
                <button 
                  type="button" 
                  onClick={() => removePoint("why", index)}
                  disabled={formData.why.points.length === 1}
                  style={formData.why.points.length === 1 ? styles.removeButtonDisabled : styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addPoint("why")} style={styles.addButton}>
              + Add Point
            </button>
          </div>
        </section>

        {/* Examples Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🛠️ Code Examples</h2>
          {formData.examples.map((example, index) => (
            <div key={index} style={styles.exampleContainer}>
              <div style={styles.exampleHeader}>
                <h3 style={styles.exampleTitle}>Example {index + 1}</h3>
                <button 
                  type="button" 
                  onClick={() => removePoint("examples", index)}
                  disabled={formData.examples.length === 1}
                  style={formData.examples.length === 1 ? styles.removeButtonDisabled : styles.removeButton}
                >
                  Remove
                </button>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Example Title</label>
                <input
                  type="text"
                  placeholder="e.g., Basic Usage"
                  value={example.title}
                  onChange={e => handleNestedChange("examples", index, "title", e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Code</label>
                <textarea
                  placeholder="Paste your code here..."
                  value={example.code}
                  onChange={e => handleNestedChange("examples", index, "code", e.target.value)}
                  rows="6"
                  style={{...styles.textarea, ...styles.codeTextarea}}
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addPoint("examples")} style={styles.addButton}>
            + Add Another Example
          </button>
        </section>

        {/* Best Practices Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🎯 Best Practices</h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>Section Title</label>
            <input
              type="text"
              placeholder="Best Practices and Guidelines"
              value={formData.best.title}
              onChange={e => setFormData(prev => ({ ...prev, best: { ...prev.best, title: e.target.value } }))}
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Practice Points</label>
            {formData.best.points.map((point, index) => (
              <div key={index} style={styles.pointItem}>
                <input
                  type="text"
                  placeholder={`Practice ${index + 1}`}
                  value={point}
                  onChange={e => handleNestedChange("best", index, "points", e.target.value)}
                  style={styles.input}
                />
                <button 
                  type="button" 
                  onClick={() => removePoint("best", index)}
                  disabled={formData.best.points.length === 1}
                  style={formData.best.points.length === 1 ? styles.removeButtonDisabled : styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addPoint("best")} style={styles.addButton}>
              + Add Practice
            </button>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Conclusion</label>
            <textarea
              placeholder="Summary and final thoughts..."
              value={formData.best.conclusion}
              onChange={e => setFormData(prev => ({ ...prev, best: { ...prev.best, conclusion: e.target.value } }))}
              rows="3"
              style={styles.textarea}
            />
          </div>
        </section>

        {/* Form Actions */}
        <section style={{
          ...styles.actionsSection,
          ...(isMobile && styles.actionsSectionMobile)
        }}>
          <button 
            type="button" 
            onClick={handleReset} 
            style={styles.secondaryButton}
            disabled={loading}
          >
            Reset
          </button>
          <button 
            type="submit" 
            disabled={loading}
            style={loading ? styles.primaryButtonDisabled : styles.primaryButton}
          >
            {loading ? "📤 Publishing..." : "🚀 Publish"}
          </button>
        </section>
      </form>
    </div>
  );
};

// Responsive Styles
const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    padding: '20px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f1419',
    color: '#e2e8f0',
    margin: 0,
    boxSizing: 'border-box',
  },
  // AI Button Styles - Fixed for mobile
  aiButtonContainer: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 100,
  },
  aiButtonContainerMobile: {
    bottom: '80px', // Move up on mobile to avoid covering publish button
  },
  aiButton: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
    transition: 'all 0.3s ease',
  },
  aiIcon: {
    fontSize: '16px',
  },
  header: {
    textAlign: 'left',
    marginBottom: '30px',
    padding: '24px 20px',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderRadius: '16px',
    border: '1px solid #334155',
    maxWidth: 'none',
  },
  title: {
    color: '#f1f5f9',
    marginBottom: '12px',
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.2',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 'clamp(1rem, 3vw, 1.3rem)',
    margin: 0,
    fontWeight: '500',
    lineHeight: '1.4',
  },
  importSection: {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  importButton: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
    flex: '1',
    minWidth: '100px',
  },
  importButtonActive: {
    background: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
    flex: '1',
    minWidth: '100px',
  },
  sampleButton: {
    background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(234, 88, 12, 0.3)',
    flex: '1',
    minWidth: '100px',
  },
  exportButton: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)',
    flex: '1',
    minWidth: '100px',
  },
  importModal: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '2px solid #475569',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '25px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    width: '100%',
    boxSizing: 'border-box',
  },
  importTitle: {
    margin: '0 0 16px 0',
    color: '#f1f5f9',
    fontSize: '1.3rem',
    fontWeight: '600'
  },
  importTextarea: {
    width: '100%',
    padding: '16px',
    border: '2px solid #475569',
    borderRadius: '10px',
    fontFamily: 'monospace',
    fontSize: '14px',
    resize: 'vertical',
    marginBottom: '16px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '250px',
    boxSizing: 'border-box',
  },
  importActions: {
    display: 'flex',
    gap: '12px',
    flexDirection: 'row',
  },
  importSubmit: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    flex: '1',
  },
  importCancel: {
    background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    flex: '1',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    width: '100%',
  },
  section: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderRadius: '16px',
    padding: '24px 20px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
    border: '1px solid #374151',
    transition: 'transform 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    color: '#f1f5f9',
    borderBottom: '3px solid #60a5fa',
    paddingBottom: '14px',
    marginBottom: '25px',
    fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
    fontWeight: '700',
    lineHeight: '1.3',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '25px',
    width: '100%',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: '600',
    color: '#e2e8f0',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #475569',
    borderRadius: '10px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    WebkitAppearance: 'none',
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #475569',
    borderRadius: '10px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    minHeight: '100px',
  },
  codeTextarea: {
    fontFamily: '"Fira Code", "Courier New", monospace',
    backgroundColor: '#0a0f1a',
    borderColor: '#60a5fa',
    fontSize: '14px',
    minHeight: '150px',
  },
  pointItem: {
    display: 'flex',
    gap: '12px',
    marginBottom: '14px',
    alignItems: 'center',
    width: '100%',
    flexDirection: 'column',
  },
  exampleContainer: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '25px',
    borderLeft: '5px solid #60a5fa',
    border: '1px solid #334155',
    width: '100%',
    boxSizing: 'border-box',
  },
  exampleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexDirection: 'column',
    gap: '12px',
  },
  exampleTitle: {
    margin: 0,
    color: '#f1f5f9',
    fontSize: '1.2rem',
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)',
    marginTop: '8px',
    width: '100%',
  },
  removeButton: {
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
    minWidth: '80px',
    width: '100%',
  },
  removeButtonDisabled: {
    background: '#475569',
    color: '#94a3b8',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    minWidth: '80px',
    width: '100%',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    minWidth: '120px',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
    flex: '1',
  },
  primaryButtonDisabled: {
    background: '#475569',
    color: '#94a3b8',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    cursor: 'not-allowed',
    fontSize: '16px',
    fontWeight: '700',
    minWidth: '120px',
    flex: '1',
  },
  secondaryButton: {
    background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    minWidth: '120px',
    transition: 'all 0.3s ease',
    flex: '1',
  },
  actionsSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '30px',
    paddingTop: '25px',
    borderTop: '1px solid #374151',
    width: '100%',
    flexDirection: 'column',
  },
  actionsSectionMobile: {
    paddingBottom: '100px', // Extra space for the AI button on mobile
  }
};

export default AddNoteForm;