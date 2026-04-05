import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import AuthForm from './AuthForm';
import Dashboard from './Dashboard';
import UploadForm from './UploadForm';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('username') || null);

  const handleLogin = (newToken, username) => {
    setToken(newToken);
    setCurrentUser(username);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', username);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  return (
    <Router>
      <div style={{ padding: '20px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
        
        {/* Navigation Bar (Only shows if logged in) */}
        {token && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1976d2', padding: '15px 30px', borderRadius: '8px', color: 'white', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Link to="/" style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>📚 CampusShare</Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '16px' }}>Welcome, <strong>{currentUser}</strong>!</span>
              
              {/* React Router Links instead of buttons */}
              <Link to="/upload" style={{ backgroundColor: 'white', color: '#1976d2', textDecoration: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold' }}>
                + Upload Notes
              </Link>
              
              <button onClick={handleLogout} style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* The Route Definitions */}
        <Routes>
          {/* Protected Home Route: If no token, kick them to /login */}
          <Route path="/" element={token ? <Dashboard currentUser={currentUser} /> : <Navigate to="/login" />} />
          
          {/* Login Route: If they ALREADY have a token, kick them to / */}
          <Route path="/login" element={!token ? <AuthForm onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          {/* Protected Upload Route */}
          <Route path="/upload" element={token ? <UploadForm currentUser={currentUser} /> : <Navigate to="/login" />} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;