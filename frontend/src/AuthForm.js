import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Make sure the CSS is imported!

function AuthForm({ onLogin }) {
  const [mode, setMode] = useState('login'); 
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    course: 'BCA',
    current_semester: 1,
    otp: '',
    newPassword: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // const handleChange = (e) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    let url = '';
    let payload = {};

    if (mode === 'login') {
      url = 'https://campus-share-api-cfal.onrender.com/api/login';
      payload = { email: formData.email, password: formData.password };
    }
    else if (mode === 'register') {
      url = 'https://campus-share-api-cfal.onrender.com/api/register';
      payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        course: formData.course,
        current_semester: formData.current_semester
      };
    }
    else if (mode === 'verify') {
      url = 'https://campus-share-api-cfal.onrender.com/api/verify-email';
      payload = { email: formData.email, otp: formData.otp };
    }
    else if (mode === 'forgot') {
      url = 'https://campus-share-api-cfal.onrender.com/api/forgot-password';
      payload = { email: formData.email };
    }
    else if (mode === 'reset') {
      url = 'https://campus-share-api-cfal.onrender.com/api/reset-password';
      payload = { email: formData.email, otp: formData.otp, newPassword: formData.newPassword };
    }

    try {
      const response = await axios.post(url, payload);

      if (mode === 'login') {
        onLogin(response.data.token, response.data.user.username);
      } else if (mode === 'register') {
        setSuccessMessage("OTP sent! Check your college email.");
        setMode('verify');
      } else if (mode === 'verify') {
        alert("Email verified! You can now log in.");
        setMode('login');
      } else if (mode === 'forgot') {
        setSuccessMessage("Reset code sent to your email!");
        setMode('reset');
      } else if (mode === 'reset') {
        alert("Password updated! Please log in.");
        setMode('login');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "An error occurred.");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <h2 style={{ color: '#1976d2', textAlign: 'center', marginBottom: '20px' }}>
        {mode === 'login' && 'Welcome Back!'}
        {mode === 'register' && 'Create an Account'}
        {mode === 'verify' && 'Verify Your Email'}
        {mode === 'forgot' && 'Reset Password'}
        {mode === 'reset' && 'Enter New Password'}
      </h2>

      {(errorMessage || successMessage) && (
        <div style={{
          backgroundColor: errorMessage ? '#ffebee' : '#e8f5e9',
          color: errorMessage ? '#c62828' : '#2e7d32',
          padding: '10px', borderRadius: '4px', marginBottom: '15px', textAlign: 'center'
        }}>
          {errorMessage || successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {mode !== 'verify' && (
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your college email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        )}

        {mode === 'register' && (
          <>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>Course</label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              >
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
              </select>
            </div>
          </>
        )}

        {(mode === 'login' || mode === 'register' || mode === 'reset') && (
          <div className="input-group">
            <label>{mode === 'reset' ? 'New Password' : 'Password'}</label>
            <input
              type="password"
              placeholder={mode === 'reset' ? "Enter new password" : "Enter your password"}
              value={mode === 'reset' ? formData.newPassword : formData.password}
              onChange={(e) => {
                if (mode === 'reset') {
                  setFormData({ ...formData, newPassword: e.target.value });
                } else {
                  setFormData({ ...formData, password: e.target.value });
                }
              }}
              required
            />
          </div>
        )}

        {(mode === 'verify' || mode === 'reset') && (
          <div className="input-group">
            <label>6-Digit Code</label>
            <input
              type="text"
              placeholder="Enter the code from your email"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              required
            />
          </div>
        )}

        <button type="submit" className="submit-btn">
          {mode === 'login' && 'Login'}
          {mode === 'register' && 'Create Account'}
          {mode === 'verify' && 'Verify Email'}
          {mode === 'forgot' && 'Send Reset Link'}
          {mode === 'reset' && 'Update Password'}
        </button>
      </form>

      <div className="auth-links">
        {mode === 'login' ? (
          <>
            <p>Don't have an account? <span onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }}>Sign Up</span></p>
            <p className="forgot-link" onClick={() => { setMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}>Forgot Password?</p>
          </>
        ) : mode === 'register' ? (
          <p>Already have an account? <span onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}>Login</span></p>
        ) : (
          <p>Back to <span onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}>Login</span></p>
        )}
      </div>
    </div>
  );
}

export default AuthForm;