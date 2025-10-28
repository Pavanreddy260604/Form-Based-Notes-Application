import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "./components/NavBar";
import Topics from "./components/Topics";
import Frame from "./components/Frame";
import HomePage from "./components/HomePage";
import { HomePageSkeleton } from "./components/HomePageSkeleton";
import LoginPage from "./components/LoginPage";
import AddTopicForm from "./components/AddTopicForm.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import NetworkStatusIndicator from "./components/NetworkStatusIndicator";

// Custom NProgress configuration
NProgress.configure({
  showSpinner: false,
  speed: 500,
  trickleSpeed: 200,
});

// Wrapper component that fetches topic data and passes as props to Frame
function FrameWrapper() {
  const { topicId } = useParams();
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopicData() {
      try {
        setLoading(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/items/${topicId}`);
        
        if (!response.ok) throw new Error("Not found");
        
        const result = await response.json();
        
        // ✅ EXTRACT data from { success: true, data: {...} }
        const actualData = result.data || result;
        
        console.log("Fetched topic:", actualData);
        setTopicData(actualData);
      } catch (err) {
        console.error("Error fetching topic:", err);
        setTopicData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTopicData();
  }, [topicId]);

  if (loading) return <div style={{padding: 80, textAlign: "center", color: "#666"}}>Loading topic...</div>;
  if (!topicData) return <div style={{padding: 80, textAlign: "center", color: "#666"}}>Topic not found</div>;

  // Pass fetched data as props to Frame
  return (
    <Frame 
      title={topicData.title}
      intro={topicData.intro}
      why={topicData.why}
      examples={topicData.examples}
      best={topicData.best}
    />
  );
}


function App() {
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [user, setUser] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const location = useLocation();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true);
      toast.success("Connection restored", {
        position: "bottom-right",
        autoClose: 3000,
      });
    };

    const handleOffline = () => {
      setNetworkStatus(false);
      toast.warning("You are offline", {
        position: "bottom-right",
        autoClose: false,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check for saved user when app loads
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        toast.info(`Welcome back, ${parsedUser.name || 'User'}!`, {
          position: "top-right",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Data fetching with enhanced error handling
  useEffect(() => {
    NProgress.start();

    const fetchData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) {
          throw new Error("VITE_BACKEND_URL is not defined in .env file");
        }

        const response = await fetch(`${backendUrl}/api/items`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.json();

        let topicsArray = [];
        if (Array.isArray(rawData)) {
          topicsArray = rawData;
        } else if (rawData && Array.isArray(rawData.items)) {
          topicsArray = rawData.items;
        } else if (rawData && Array.isArray(rawData.data)) {
          topicsArray = rawData.data;
        } else {
          console.warn("API returned unexpected format:", rawData);
        }

        setAllTopics(topicsArray);
        setLoading(false);
        
        if (topicsArray.length === 0) {
          toast.info("No topics available yet. Be the first to add one!", {
            position: "bottom-center",
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(true);
        setAllTopics([]);
        
        if (err.message.includes("VITE_BACKEND_URL")) {
          toast.error("Backend URL not configured. Check .env file.", {
            position: "top-center",
          });
        } else if (err.name === 'AbortError') {
          toast.error("Request timeout - server is taking too long to respond", {
            position: "top-center",
          });
        } else {
          toast.error("Failed to load content. Please check your connection.", {
            position: "top-center",
          });
        }
      } finally {
        NProgress.done();
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Smooth route transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="app-loading">
        <HomePageSkeleton />
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading notes application</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>Connection Issue</h2>
          <p>We're having trouble connecting to the server.</p>
          <div className="error-actions">
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Try Again
            </button>
            <button 
              onClick={() => setError(false)} 
              className="offline-button"
            >
              Continue Offline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auth redirect
  if (!user && location.pathname !== "/Login") {
    toast.info("Please log in to continue", {
      position: "top-center",
    });
    return <Navigate to="/Login" replace />;
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        <NetworkStatusIndicator isOnline={networkStatus} />

        {location.pathname !== "/Login" && (
          <NavBar user={user} setUser={setUser} />
        )}

        <main 
          className={`main-content ${
            location.pathname === "/Login" ? "login-page" : ""
          }`}
        >
          <Routes>
            <Route path="/Login" element={<LoginPage setUser={setUser} />} />
            <Route path="/" element={<Topics user={user} />} />
            <Route path="/add-topic" element={<AddTopicForm user={user} />} />
            <Route 
              path="/projects" 
              element={
                <div className="page-container">
                  <h1>Projects Page</h1>
                  <p>Coming soon - showcase your learning projects!</p>
                </div>
              } 
            />
            <Route 
              path="/contact" 
              element={
                <div className="page-container">
                  <h1>Contact Page</h1>
                  <p>Get in touch with us!</p>
                </div>
              } 
            />
            <Route 
              path="/about" 
              element={
                <div className="page-container">
                  <h1>About Page</h1>
                  <p>Learn more about our platform.</p>
                </div>
              } 
            />

            {/* Dynamic topic route - uses FrameWrapper to fetch and pass props */}
            <Route path="/topic/:topicId" element={<FrameWrapper />} />

            {/* 404 Fallback */}
            <Route 
              path="*" 
              element={
                <div className="not-found-container">
                  <h2>Page Not Found</h2>
                  <p>The page you're looking for doesn't exist.</p>
                  <button 
                    onClick={() => window.history.back()} 
                    className="back-button"
                  >
                    Go Back
                  </button>
                </div>
              } 
            />
          </Routes>
        </main>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>

      <style jsx>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }

        .app-container {
          min-height: 100vh;
          position: relative;
        }

        .app-loading {
          position: relative;
          min-height: 100vh;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .main-content {
          position: relative;
          z-index: 1;
          padding-top: 80px;
          min-height: calc(100vh - 80px);
        }

        .main-content.login-page {
          padding-top: 0;
        }

        .error-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .error-content {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          text-align: center;
          max-width: 400px;
          width: 100%;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .retry-button, .offline-button, .back-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retry-button {
          background: #667eea;
          color: white;
        }

        .retry-button:hover {
          background: #5a6fd8;
          transform: translateY(-2px);
        }

        .offline-button, .back-button {
          background: #e2e8f0;
          color: #4a5568;
        }

        .offline-button:hover, .back-button:hover {
          background: #cbd5e0;
          transform: translateY(-2px);
        }

        .page-container {
          padding: 40px 20px;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .not-found-container {
          padding: 80px 20px;
          text-align: center;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        @media (max-width: 768px) {
          .main-content {
            padding-top: 70px;
          }
          
          .error-content {
            padding: 30px 20px;
          }
          
          .error-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </ErrorBoundary>
  );
}

export default App;
