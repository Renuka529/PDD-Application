import React, { useState } from 'react';
import { Shield, Activity, Sliders, Cloud, ArrowRight } from 'lucide-react';

export default function IntroPage({ onGetStarted }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Welcome to PerioTwin™',
      subtitle: 'AI Periodontal Digital Twin',
      description: 'An advanced digital twin assistant predicting average bone and clinical attachment loss using classification and LSTM prognosis models.',
      icon: <Shield size={48} className="intro-icon-graphic" style={{ color: 'var(--primary)' }} />,
      color: 'var(--primary)'
    },
    {
      title: 'Digital Twin Controls',
      subtitle: 'Real-time Clinical Simulator',
      description: 'Fine-tune live parameters including smoking habits, hyperglycemia, plaque index, and tissue bleeding to simulate patient trajectories.',
      icon: <Sliders size={48} className="intro-icon-graphic" style={{ color: 'var(--accent)' }} />,
      color: 'var(--accent)'
    },
    {
      title: 'Fully Dynamic Cloud Sync',
      subtitle: 'Secure MongoDB Integration',
      description: 'Enjoy secure professional login and database storage. Scoped access guards patient data completely under your clinic profile.',
      icon: <Cloud size={48} className="intro-icon-graphic" style={{ color: 'var(--success)' }} />,
      color: 'var(--success)'
    }
  ];

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      onGetStarted();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const current = slides[currentSlide];

  return (
    <div className="auth-overlay">
      <div className="auth-container glass-panel intro-panel" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'right' }}>
          <button 
            type="button" 
            className="intro-skip-btn" 
            onClick={onGetStarted}
          >
            Skip
          </button>
        </div>

        <div className="intro-slide-content">
          <div 
            className="intro-graphic-container" 
            style={{ 
              borderColor: current.color,
              boxShadow: `0 0 20px ${current.color}33`
            }}
          >
            {current.icon}
          </div>

          <div className="intro-text-container">
            <h1 className="intro-title">{current.title}</h1>
            <p className="intro-subtitle" style={{ color: current.color }}>{current.subtitle}</p>
            <p className="intro-description">{current.description}</p>
          </div>
        </div>

        <div className="intro-footer">
          <div className="intro-dots">
            {slides.map((_, idx) => (
              <span 
                key={idx} 
                className={`intro-dot ${currentSlide === idx ? 'active' : ''}`}
                style={{ 
                  backgroundColor: currentSlide === idx ? current.color : 'rgba(255,255,255,0.15)',
                  width: currentSlide === idx ? '24px' : '8px'
                }}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>

          <button 
            type="button" 
            className="btn btn-intro"
            onClick={handleNext}
            style={{ 
              background: `linear-gradient(135deg, ${current.color} 0%, var(--accent) 100%)`,
              boxShadow: `0 4px 15px ${current.color}33`
            }}
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
