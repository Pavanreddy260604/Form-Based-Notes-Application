import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Login.css";

export default function LoginPage({ setUser }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: OTP verification
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: not active, 1: email, 2: OTP, 3: new password

  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Step 1: Send OTP for registration
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/register-send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");

      setSuccess("OTP sent to your email!");
      setStep(2); // Move to OTP verification step
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/register-verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Registration failed");

      setSuccess("Account created successfully!");
      
      // Save user data
      const userData = {
        userId: data.user.id,
        name: data.user.name,
        email: data.user.email
      };

      localStorage.setItem('user', JSON.stringify(userData));
      if (setUser) setUser(userData);
      
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Local login (no OTP required)
  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Login failed");

      setSuccess("Login successful!");
      
      // Save user data
      const userData = {
        userId: data.user.id,
        name: data.user.name,
        email: data.user.email
      };

      localStorage.setItem('user', JSON.stringify(userData));
      if (setUser) setUser(userData);
      
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Flow

  // Step 1: Send OTP for password reset
  const handleForgotPasswordSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/forgot-password-send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Failed to send reset OTP");

      setSuccess("Password reset OTP sent to your email!");
      setForgotPasswordStep(2); // Move to OTP verification step
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please enter and confirm your new password");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/reset-password-with-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Password reset failed");

      setSuccess("Password reset successfully! You can now login with your new password.");
      
      // Reset the form and go back to login
      setForgotPasswordStep(0);
      setFormData(prev => ({ ...prev, otp: "", newPassword: "", confirmPassword: "" }));
      setIsSignUp(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Start forgot password flow
  const startForgotPassword = () => {
    setForgotPasswordStep(1);
    setError("");
    setSuccess("");
    setFormData(prev => ({ ...prev, email: "", otp: "", newPassword: "", confirmPassword: "" }));
  };

  // Cancel forgot password flow
  const cancelForgotPassword = () => {
    setForgotPasswordStep(0);
    setError("");
    setSuccess("");
    setFormData(prev => ({ ...prev, otp: "", newPassword: "", confirmPassword: "" }));
  };

  const switchForm = () => {
    setError("");
    setSuccess("");
    setIsSignUp(prev => !prev);
    setFormData({ name: "", email: "", password: "", otp: "", newPassword: "", confirmPassword: "" });
    setStep(1); // Reset to step 1 when switching forms
    setForgotPasswordStep(0); // Reset forgot password flow
  };

  const handleSubmit = (e) => {
    if (forgotPasswordStep > 0) {
      if (forgotPasswordStep === 1) {
        handleForgotPasswordSendOTP(e);
      } else if (forgotPasswordStep === 2) {
        handleResetPassword(e);
      }
    } else if (isSignUp) {
      if (step === 1) {
        handleSendOTP(e);
      } else {
        handleVerifyOTP(e);
      }
    } else {
      handleLocalLogin(e);
    }
  };

  // If in forgot password flow, show different UI
  if (forgotPasswordStep > 0) {
    return (
      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1 className="login-title">
                {forgotPasswordStep === 1 ? "Reset Password" : 
                 forgotPasswordStep === 2 ? "Verify OTP & Set New Password" : ""}
              </h1>
              <p className="login-subtitle">
                {forgotPasswordStep === 1 ? "Enter your email to receive a reset code" : 
                 "Enter the OTP and your new password"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              {/* Forgot Password Step 1: Email */}
              {forgotPasswordStep === 1 && (
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              )}

              {/* Forgot Password Step 2: OTP and New Password */}
              {forgotPasswordStep === 2 && (
                <>
                  <div className="form-group">
                    <label htmlFor="otp" className="form-label">Verification Code</label>
                    <input
                      id="otp"
                      type="text"
                      name="otp"
                      placeholder="Enter 6-digit OTP"
                      value={formData.otp}
                      onChange={handleChange}
                      className="form-input"
                      maxLength="6"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="Enter new password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                      <button 
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    {forgotPasswordStep === 1 ? "Sending OTP..." : "Resetting Password..."}
                  </>
                ) : (
                  forgotPasswordStep === 1 ? "Send OTP" : "Reset Password"
                )}
              </button>

              <button 
                type="button" 
                className="back-button"
                onClick={cancelForgotPassword}
                disabled={isLoading}
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Normal login/signup flow
  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              {/* Your logo here */}
            </div>
            <h1 className="login-title">
              {isSignUp 
                ? (step === 1 ? "Create Account" : "Verify Email") 
                : "Welcome Back"
              }
            </h1>
            <p className="login-subtitle">
              {isSignUp 
                ? (step === 1 ? "Sign up for your React Blue account" : "Enter the OTP sent to your email")
                : "Sign in to your React Blue account"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Registration Step 1: Basic Info */}
            {isSignUp && step === 1 && (
              <>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Registration Step 2: OTP Verification */}
            {isSignUp && step === 2 && (
              <div className="form-group">
                <label htmlFor="otp" className="form-label">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  className="form-input"
                  maxLength="6"
                  required
                />
                <p style={{ fontSize: "14px", color: "#6c757d", marginTop: "5px" }}>
                  We sent a code to {formData.email}
                </p>
              </div>
            )}

            {/* Login Form */}
            {!isSignUp && (
              <>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!isSignUp && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#" className="forgot-link" onClick={startForgotPassword}>
                  Forgot password?
                </a>
              </div>
            )}

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  {isSignUp 
                    ? (step === 1 ? "Sending OTP..." : "Verifying...") 
                    : "Signing In..."
                  }
                </>
              ) : (
                isSignUp 
                  ? (step === 1 ? "Send OTP" : "Verify & Create Account") 
                  : "Sign In"
              )}
            </button>

            {isSignUp && step === 2 && (
              <button 
                type="button" 
                className="back-button"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back to Details
              </button>
            )}

            <div className="form-footer">
              <p>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <span className="switch-link" onClick={switchForm}>
                  {isSignUp ? "Sign in" : "Sign up now"}
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}