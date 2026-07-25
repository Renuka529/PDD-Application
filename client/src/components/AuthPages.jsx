import React, { useState } from 'react';
import { Shield, KeyRound, User, Mail, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function AuthPages({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container glass-panel">
        <div className="auth-header">
          <div className="auth-brand">
            <Shield size={36} className="auth-logo" style={{ color: 'var(--primary)' }} />
            <div>
              <h1 className="auth-title">PerioTwin™</h1>
              <p className="auth-subtitle">AI Digital Twin Clinic Gateway</p>
            </div>
          </div>
        </div>

        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`auth-tab ${!isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register Clinic
          </button>
        </div>

        {error && (
          <div className="auth-error-alert">
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="control-group">
              <label className="control-label">Full Name / Clinic Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input 
                  type="text" 
                  required 
                  className="search-input" 
                  placeholder="e.g. Dr. Sarah Green"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
            </div>
          )}

          <div className="control-group">
            <label className="control-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input 
                type="email" 
                required 
                className="search-input" 
                placeholder="doctor@periotwin.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Password</label>
            <div className="input-with-icon">
              <KeyRound size={16} className="input-icon" />
              <input 
                type="password" 
                required 
                minLength={6}
                className="search-input" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          </div>

          {!isLogin && (
            <div className="control-group">
              <label className="control-label">Confirm Password</label>
              <div className="input-with-icon">
                <KeyRound size={16} className="input-icon" />
                <input 
                  type="password" 
                  required 
                  className="search-input" 
                  placeholder="••••••••"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-auth">
            {loading ? (
              <span className="loading-span">
                <Loader2 size={16} className="spin-icon" /> Processing...
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
