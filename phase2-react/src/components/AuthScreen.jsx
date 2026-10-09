import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function AuthScreen({ onLogin }) {
  // Modes: 'login' | 'signup' | 'otp_request' | 'otp_verify' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // 6-digit OTP inputs
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [otpReason, setOtpReason] = useState('login'); // 'login' or 'reset'
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Resend OTP Countdown Timer
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Google Sign-In SDK configuration
  const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const mockAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ALLOW_MOCK_AUTH === 'true';

  // Simulated Google Sign-In states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const handleMockGoogleSelect = async (mockEmail, mockName) => {
    if (!mockEmail) return;
    setIsLoading(true);
    setShowGoogleModal(false);

    // Format: mock_google_token_<email>_<name>_<avatar>
    const namePart = encodeURIComponent(mockName || mockEmail.split('@')[0]);
    const avatarPart = encodeURIComponent('');
    const idToken = `mock_google_token_${mockEmail}_${namePart}_${avatarPart}`;

    const data = await fetchAPI('/google-login', { idToken });
    setIsLoading(false);

    if (data && data.error) {
      toast.error(data.error);
    } else if (data && data.token) {
      localStorage.setItem('token', data.token);
      toast.success(data.user.name ? `Welcome back, ${data.user.name}!` : 'Logged in successfully!');
      onLogin(data.user);
    } else {
      toast.error('Simulated Google Sign-In failed.');
    }
  };

  // Start resend countdown
  const startTimer = (seconds = 60) => {
    setTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Official Google SDK Script Loader & Button Renderer
  useEffect(() => {
    if (!clientID) {
      console.warn("⚠️ VITE_GOOGLE_CLIENT_ID is not configured in your environment variables. Google Sign-In button will not initialize.");
      return;
    }

    // 1. Inject script
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // 2. Initialize and render native button
    const initGoogleSDK = () => {
      if (window.google && (mode === 'login' || mode === 'signup' || mode === 'otp_request')) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientID,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });

          const btnContainer = document.getElementById('google-btn-container');
          if (btnContainer) {
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'filled_blue',
              size: 'large',
              width: btnContainer.offsetWidth || 360,
              shape: 'rectangular',
              text: 'continue_with'
            });
          }
        } catch (err) {
          console.error('Failed to initialize Google SDK:', err);
        }
      }
    };

    const handleGoogleCredentialResponse = async (response) => {
      setIsLoading(true);
      const idToken = response.credential;
      const data = await fetchAPI('/google-login', { idToken });
      setIsLoading(false);

      if (data && data.error) {
        toast.error(data.error);
      } else if (data && data.token) {
        localStorage.setItem('token', data.token);
        toast.success(data.user.name ? `Welcome back, ${data.user.name}!` : 'Logged in successfully!');
        onLogin(data.user);
      } else {
        toast.error('Google Sign-In failed.');
      }
    };

    if (window.google) {
      initGoogleSDK();
    } else {
      script.addEventListener('load', initGoogleSDK);
    }

    const checkInterval = setInterval(() => {
      if (window.google) {
        initGoogleSDK();
        clearInterval(checkInterval);
      }
    }, 400);

    return () => {
      clearInterval(checkInterval);
      if (script) {
        script.removeEventListener('load', initGoogleSDK);
      }
    };
  }, [mode, clientID]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle standard Submit (Login / Register)
  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    if (mode === 'signup' && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    if (mode === 'login') {
      const data = await fetchAPI('/login', { email, password });
      if (data && data.error) {
        toast.error(data.error);
      } else if (data && data.token) {
        localStorage.setItem('token', data.token);
        toast.success('Logged in successfully!');
        onLogin(data.user);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } else if (mode === 'signup') {
      const data = await fetchAPI('/register', { email, password, name });
      if (data && data.error) {
        toast.error(data.error);
      } else if (data && data.token) {
        localStorage.setItem('token', data.token);
        toast.success('Account created successfully!');
        onLogin(data.user);
      } else {
        toast.error('Failed to create account.');
      }
    }
    
    setIsLoading(false);
  };

  // Handle Request OTP (for login/signup or password reset)
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    const reason = mode === 'forgot' ? 'reset' : 'login';
    setOtpReason(reason);

    const data = await fetchAPI('/send-otp', { email, reason });
    setIsLoading(false);

    if (data && data.error) {
      toast.error(data.error);
    } else {
      toast.success(data.message || 'OTP code sent to your email.');
      // If in dev environment, backend will return the OTP directly for ease of use
      if (data.code) {
        console.log(`[DEV MODE] OTP Code received in response: ${data.code}`);
        toast(`Dev Mode OTP: ${data.code}`, { icon: '🔑', duration: 8000 });
      }
      
      setOtp(['', '', '', '', '', '']);
      startTimer(60);
      
      if (mode === 'forgot') {
        setMode('reset');
      } else {
        setMode('otp_verify');
      }
    }
  };

  // Verify OTP Login/Register
  const handleVerifyOtpLogin = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    const data = await fetchAPI('/verify-otp-login', { email, code });
    setIsLoading(false);

    if (data && data.error) {
      toast.error(data.error);
    } else if (data && data.token) {
      localStorage.setItem('token', data.token);
      toast.success('Authenticated successfully via OTP!');
      onLogin(data.user);
    } else {
      toast.error('Verification failed. Try again.');
    }
  };

  // Verify Reset Password OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const data = await fetchAPI('/reset-password', { email, code, newPassword: password });
    setIsLoading(false);

    if (data && data.error) {
      toast.error(data.error);
    } else {
      toast.success(data.message || 'Password reset successful! Please log in.');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
    }
  };

  // Manage OTP box inputs
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const digits = pasteData.split('');
    setOtp(digits);
    otpRefs[5].current.focus();
  };

  return (
    <div className="auth-container">
      {/* Decorative background orbs */}
      <div className="auth-bg-orb orb-1"></div>
      <div className="auth-bg-orb orb-2"></div>

      <div className="auth-card glass-panel fade-in" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 0 30px rgba(139,92,246,0.1)' }}>
        
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="logo" style={{ margin: '0 0 4px 0', fontSize: '2.4rem', fontWeight: 800 }}>
            Placement<span>AI</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Elevate your interview game with AI</p>
        </div>

        {/* Premium Auth Tabs for Login Form formats */}
        {(mode === 'login' || mode === 'signup' || mode === 'otp_request' || mode === 'otp_verify') && (
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: (mode === 'login' || mode === 'signup') ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: (mode === 'login' || mode === 'signup') ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🔑 Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('otp_request');
                setEmail('');
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: (mode === 'otp_request' || mode === 'otp_verify') ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: (mode === 'otp_request' || mode === 'otp_verify') ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ✉️ Passwordless OTP
            </button>
          </div>
        )}

        {/* Dynamic Headings */}
        {mode === 'login' && (
          <p className="subtext" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
            Welcome back! Securely log in to your account.
          </p>
        )}
        {mode === 'signup' && (
          <p className="subtext" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
            Create an account to start preparing for your placements.
          </p>
        )}
        {mode === 'otp_request' && (
          <p className="subtext" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
            Enter your email to receive a passwordless OTP verification.
          </p>
        )}
        {mode === 'otp_verify' && (
          <p className="subtext" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
            We've sent a 6-digit code to <span style={{color: 'var(--primary)', fontWeight: 600}}>{email}</span>.
          </p>
        )}
        {mode === 'forgot' && (
          <p className="subtext" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
            Enter your registered email address to start resetting your password.
          </p>
        )}
        {mode === 'reset' && (
          <p className="subtext" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
            Enter the reset OTP sent to <span style={{color: 'var(--primary)', fontWeight: 600}}>{email}</span> and configure a new password.
          </p>
        )}

        {/* Email & Password login / signup */}
        {(mode === 'login' || mode === 'signup') && (
          <form onSubmit={handleStandardSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ borderRadius: '8px', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                  />
                </div>
              </div>
            )}

            <div className="input-group" style={{ marginTop: mode === 'signup' ? '15px' : '0' }}>
              <label>Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ borderRadius: '8px', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                {mode === 'login' && (
                  <span
                    onClick={() => setMode('forgot')}
                    className="auth-link-small"
                  >
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="input-with-icon">
                <span className="input-icon">🔑</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ borderRadius: '8px', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔑</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ borderRadius: '8px', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle-btn"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '25px', padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', justifyContent: 'center' }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        {/* OTP Request */}
        {mode === 'otp_request' && (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ borderRadius: '8px', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '25px', padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', justifyContent: 'center' }}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Get Verification Code'}
            </button>
          </form>
        )}

        {/* OTP Verification (for login) */}
        {mode === 'otp_verify' && (
          <form onSubmit={handleVerifyOtpLogin} className="auth-form">
            <div className="input-group">
              <label style={{ textAlign: 'center', display: 'block', marginBottom: '15px' }}>Enter 6-Digit Code</label>
              <div className="otp-boxes-container">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="otp-digit-box"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '25px', padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', justifyContent: 'center' }}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify & Log In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              {timer > 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Resend code in <strong style={{ color: '#fff' }}>{timer}s</strong>
                </p>
              ) : mockAuthEnabled ? (
                <span
                  onClick={handleRequestOtp}
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  Resend Code
                </span>
              ) : null}
            </div>
          </form>
        )}

        {/* Forgot Password Request */}
        {mode === 'forgot' && (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '25px', padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', justifyContent: 'center' }}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '8px', justifyContent: 'center' }}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* Reset Password (Enter OTP + New Password) */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="input-group">
              <label style={{ textAlign: 'center', display: 'block', marginBottom: '15px' }}>Enter Reset Code</label>
              <div className="otp-boxes-container">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="otp-digit-box"
                  />
                ))}
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>New Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔑</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '15px' }}>
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔑</span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle-btn"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '25px', padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', justifyContent: 'center' }}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Update Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              {timer > 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Resend code in <strong style={{ color: '#fff' }}>{timer}s</strong>
                </p>
              ) : (
                <span
                  onClick={handleRequestOtp}
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  Resend Code
                </span>
              )}
            </div>
          </form>
        )}

        {/* Divider for third party logins */}
        {mode !== 'otp_verify' && mode !== 'reset' && (
          <>
            <div className="auth-divider">
              <span>OR</span>
            </div>

            <div className="social-login-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
              {/* Google SDK button container */}
              {clientID ? (
                <div id="google-btn-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(true)}
                    className="social-login-btn google"
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg className="google-icon" width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '4px' }}>
                      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.78 2.16c1.63-1.5 2.57-3.71 2.57-6.49z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.78-2.16c-.77.52-1.76.83-2.78.83-2.14 0-3.96-1.45-4.61-3.4H1.89v2.2C3.37 16.22 6.02 18 9 18z"/>
                      <path fill="#FBBC05" d="M4.39 11.09c-.16-.5-.26-1.02-.26-1.59 0-.57.1-1.09.26-1.59V5.7H1.89C1.35 6.78 1.04 8.01 1.04 9.3c0 1.29.31 2.52.85 3.6l2.5-1.81z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.8 11.43 0 9 0 6.02 0 3.37 1.78 1.89 4.7l2.5 1.81c.65-1.95 2.47-3.4 4.61-3.4z"/>
                    </svg>
                    Simulate Google Sign-in
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    (Google SDK disabled; using mock mode for development)
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Auth Switcher */}
        <p
          className="auth-switch"
          style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.9rem', color: 'var(--text-muted)' }}
        >
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <span onClick={() => setMode('signup')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                Sign Up
              </span>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <span onClick={() => setMode('login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                Log In
              </span>
            </>
          )}
          {(mode === 'otp_request' || mode === 'otp_verify' || mode === 'forgot' || mode === 'reset') && (
            <span onClick={() => setMode('login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>
              Return to Login
            </span>
          )}
        </p>
      </div>

      {/* Simulated Google Sign-In Modal */}
      {showGoogleModal && (
        <div className="google-modal-overlay">
          <div className="google-modal-card">
            <div className="google-modal-header">
              <svg width="32" height="32" viewBox="0 0 24 24" style={{ display: 'block', margin: '0 auto 12px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <h3>Choose an account</h3>
              <p>to continue to PlacementAI (Simulated)</p>
            </div>

            <div className="google-accounts-list">
              <div className="google-account-row" onClick={() => handleMockGoogleSelect('dev@placementai.com', 'Alex Dev')}>
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80" alt="Alex" />
                <div className="account-details">
                  <span className="account-name">Alex Dev (Mock Developer)</span>
                  <span className="account-email">dev@placementai.com</span>
                </div>
              </div>

              <div className="google-account-row" onClick={() => handleMockGoogleSelect('reviewer@placementai.com', 'Sam Reviewer')}>
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" alt="Sam" />
                <div className="account-details">
                  <span className="account-name">Sam Reviewer (Mock Reviewer)</span>
                  <span className="account-email">reviewer@placementai.com</span>
                </div>
              </div>

              <div className="google-custom-account-row">
                <div className="custom-account-divider">Or use a custom account:</div>
                <div className="custom-google-inputs">
                  <input 
                    type="text" 
                    placeholder="Name (e.g. John Doe)" 
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                  />
                  <input 
                    type="email" 
                    placeholder="Email (e.g. john@example.com)" 
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleMockGoogleSelect(customGoogleEmail, customGoogleName)}
                    disabled={!customGoogleEmail}
                    style={{ background: '#1a73e8', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Sign in with Custom Account
                  </button>
                </div>
              </div>
            </div>

            <div className="google-modal-footer">
              <button 
                type="button"
                className="google-cancel-btn" 
                onClick={() => setShowGoogleModal(false)}
                style={{ background: '#f1f3f4', border: 'none', color: '#3c4043', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
