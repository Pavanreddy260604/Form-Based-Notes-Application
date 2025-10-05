import React from "react";
import { Link } from "react-router-dom";  

function HomePage() {
  const topics = [
    { 
      name: "Fragments", 
      path: "/fragments", 
      description: "Learn how to use React Fragments for cleaner JSX.",
      icon: "🧩",
      color: "#8B5CF6"
    },
    { 
      name: "Hooks", 
      path: "/hooks", 
      description: "Understand React Hooks like useState and useEffect.",
      icon: "🪝",
      color: "#06B6D4"
    },
    { 
      name: "Props", 
      path: "/props", 
      description: "Pass data between components using props.",
      icon: "📦",
      color: "#10B981"
    },
    { 
      name: "State", 
      path: "/state", 
      description: "Manage component state effectively.",
      icon: "⚡",
      color: "#F59E0B"
    },
  ];

  const features = [
    {
      icon: "📚",
      title: "Learn React Concepts",
      description: "Step-by-step guides on React fundamentals and advanced topics with practical examples."
    },
    {
      icon: "💻",
      title: "Interactive Examples",
      description: "Run and modify code examples directly in your browser to understand concepts better."
    },
    {
      icon: "🔄",
      title: "Real-time Practice",
      description: "Practice what you learn with hands-on coding exercises and challenges."
    },
    {
      icon: "📖",
      title: "Comprehensive Documentation",
      description: "Well-structured documentation that grows as you add more learning topics."
    }
  ];

  return (
    <div className="homepage-container" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* Enhanced Hero Section */}
      <section className="hero-section"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="hero-background" style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)",
        }}></div>
        
        <div className="hero-content" style={{
          textAlign: "center",
          color: "white",
          zIndex: 2,
          position: "relative",
          maxWidth: "800px",
          padding: "0 20px",
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            padding: "20px 40px",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            marginBottom: "30px",
            display: "inline-block",
          }}>
            <span style={{ fontSize: "14px", fontWeight: "600", opacity: 0.9 }}>🚀 React Learning Platform</span>
          </div>
          
          <h1 style={{ 
            fontSize: "clamp(2.5rem, 5vw, 4rem)", 
            fontWeight: "800",
            marginBottom: "20px",
            lineHeight: "1.2",
            background: "linear-gradient(135deg, #fff 0%, #f0f0f0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Master React Development
          </h1>
          
          <p style={{ 
            fontSize: "clamp(1.1rem, 2vw, 1.3rem)", 
            marginBottom: "40px",
            opacity: 0.9,
            lineHeight: "1.6",
            maxWidth: "600px",
            margin: "0 auto 40px"
          }}>
            Learn modern React concepts through interactive examples and build your understanding step by step.
          </p>
          
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/topics"
              className="cta-button primary"
              style={{
                padding: "16px 32px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                color: "white",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: "600",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span>📚</span>
              Start Learning
            </Link>
            
            <Link
              to="/add-topic"
              className="cta-button secondary"
              style={{
                padding: "16px 32px",
                background: "transparent",
                color: "white",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: "600",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>✨</span>
              Contribute
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Replaces Stats */}
      <section style={{ padding: "100px 20px", background: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ 
              fontSize: "clamp(2rem, 4vw, 3rem)", 
              fontWeight: "800",
              marginBottom: "16px",
              background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              What You'll Get
            </h2>
            <p style={{ 
              fontSize: "1.2rem", 
              color: "#64748b",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.6"
            }}>
              Everything you need to master React development in one place
            </p>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "30px",
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: "40px 30px",
                  borderRadius: "20px",
                  background: "white",
                  textAlign: "center",
                  transition: "all 0.3s ease",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ 
                  fontSize: "3rem", 
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "center"
                }}>
                  {feature.icon}
                </div>
                
                <h3 style={{ 
                  fontSize: "1.3rem", 
                  fontWeight: "700",
                  marginBottom: "15px",
                  color: "#1e293b"
                }}>
                  {feature.title}
                </h3>
                
                <p style={{ 
                  color: "#64748b", 
                  lineHeight: "1.6",
                  fontSize: "0.95rem"
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Topics Section */}
      <section style={{ 
        padding: "100px 20px", 
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" 
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ 
              fontSize: "clamp(2rem, 4vw, 3rem)", 
              fontWeight: "800",
              marginBottom: "16px",
              background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Start Learning React
            </h2>
            <p style={{ 
              fontSize: "1.2rem", 
              color: "#64748b",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.6"
            }}>
              Master React from fundamentals to advanced concepts with comprehensive learning materials
            </p>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "30px",
          }}>
            {topics.map((topic, index) => (
              <Link
                key={topic.name}
                to={topic.path}
                style={{
                  padding: "30px",
                  borderRadius: "20px",
                  background: "white",
                  textDecoration: "none",
                  color: "#1e293b",
                  transition: "all 0.3s ease",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(135deg, ${topic.color} 0%, ${topic.color}99 100%)`,
                }}></div>
                
                <div style={{ 
                  fontSize: "3rem", 
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px"
                }}>
                  <span>{topic.icon}</span>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: `${topic.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    color: topic.color
                  }}>
                    {index + 1}
                  </div>
                </div>
                
                <h3 style={{ 
                  fontSize: "1.4rem", 
                  fontWeight: "700",
                  marginBottom: "12px",
                  color: topic.color
                }}>
                  {topic.name}
                </h3>
                
                <p style={{ 
                  color: "#64748b", 
                  lineHeight: "1.6",
                  marginBottom: "20px"
                }}>
                  {topic.description}
                </p>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  color: topic.color,
                  fontWeight: "600",
                  fontSize: "0.9rem"
                }}>
                  Start Learning →
                </div>
              </Link>
            ))}
          </div>

          {/* View All Topics Button */}
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <Link
              to="/topics"
              style={{
                padding: "16px 40px",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "white",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "1.1rem",
                transition: "all 0.3s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(59, 130, 246, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.3)";
              }}
            >
              <span>📚</span>
              View All Topics
            </Link>
          </div>
        </div>
      </section>

      {/* Simple CTA Section */}
      <section style={{ 
        padding: "100px 20px", 
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        textAlign: "center",
        color: "white"
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ 
            fontSize: "clamp(2rem, 4vw, 2.5rem)", 
            fontWeight: "800",
            marginBottom: "20px"
          }}>
            Ready to Learn React?
          </h2>
          <p style={{ 
            fontSize: "1.2rem", 
            marginBottom: "40px",
            opacity: 0.9,
            lineHeight: "1.6"
          }}>
            Start your journey to becoming a React developer today
          </p>
          <Link
            to="/topics"
            style={{
              padding: "16px 40px",
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              color: "white",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "1.1rem",
              transition: "all 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(59, 130, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.3)";
            }}
          >
            <span>🚀</span>
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;