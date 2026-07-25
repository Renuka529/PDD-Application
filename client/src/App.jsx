import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Activity, 
  Trash2, 
  Heart, 
  Calendar,
  Frown,
  Plus,
  LogOut,
  Settings,
  Edit,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import DigitalTwin from './components/DigitalTwin';
import AuthPages from './components/AuthPages';
import IntroPage from './components/IntroPage';


const API_BASE = 'http://localhost:8000';

export default function App() {
  const [showIntro, setShowIntro] = useState(!localStorage.getItem('hasSeenIntro'));
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New UI Toggles
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile'); // 'profile' | 'prefs' | 'about'
  const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('twin'); // 'twin' | 'analytics'

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePassword, setProfilePassword] = useState('');

  // Patient Edit Form State
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(40);
  const [editGender, setEditGender] = useState('Male');

  // Preferences
  const [defaultGender, setDefaultGender] = useState(localStorage.getItem('pref_defaultGender') || 'Male');
  const [defaultSmoking, setDefaultSmoking] = useState(localStorage.getItem('pref_defaultSmoking') === 'true');

  // Form State
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(40);
  const [newGender, setNewGender] = useState(defaultGender);
  const [newSmoking, setNewSmoking] = useState(defaultSmoking);
  const [newDiabetes, setNewDiabetes] = useState(false);
  const [newHba1c, setNewHba1c] = useState(5.5);
  const [newPlaque, setNewPlaque] = useState(30);
  const [newBop, setNewBop] = useState(15);
  const [newBoneLoss, setNewBoneLoss] = useState(1.5);
  const [newAttachLoss, setNewAttachLoss] = useState(2.0);

  // Load patients on mount
  useEffect(() => {
    if (token) {
      fetchPatients();
    }
  }, [token]);

  const fetchPatients = async (selectId = null) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        if (data.length > 0) {
          if (selectId) {
            const matched = data.find(p => p._id === selectId);
            setSelectedPatient(matched || data[0]);
          } else {
            setSelectedPatient(data[0]);
          }
        } else {
          setSelectedPatient(null);
        }
      }
    } catch (err) {
      console.error("Failed to load patients from FastAPI.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setPatients([]);
    setSelectedPatient(null);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    const payload = {
      name: newName,
      age: parseInt(newAge),
      gender: newGender,
      initial_record: {
        smoking: newSmoking,
        diabetes: newDiabetes,
        hba1c: parseFloat(newHba1c),
        plaque_index: parseFloat(newPlaque),
        bleeding_on_probing: parseFloat(newBop),
        bone_loss_average: parseFloat(newBoneLoss),
        attachment_loss_average: parseFloat(newAttachLoss)
      }
    };

    try {
      const response = await fetch(`${API_BASE}/api/patients`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const created = await response.json();
        setModalOpen(false);
        // Clear fields
        setNewName('');
        setNewAge(40);
        setNewGender('Male');
        setNewSmoking(false);
        setNewDiabetes(false);
        setNewHba1c(5.5);
        setNewPlaque(30);
        setNewBop(15);
        setNewBoneLoss(1.5);
        setNewAttachLoss(2.0);
        
        await fetchPatients(created._id);
      }
    } catch (err) {
      alert("Error reaching FastAPI server to save new patient.");
    }
  };

  const handleDeletePatient = async (id) => {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/patients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchPatients();
      }
    } catch (err) {
      alert("Error deleting patient from backend server.");
    }
  };

  const handleUpdateRecord = (updatedPatient) => {
    setPatients(prev => prev.map(p => p._id === updatedPatient._id ? updatedPatient : p));
    setSelectedPatient(updatedPatient);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const payload = {};
    if (profileName) payload.name = profileName;
    if (profileEmail) payload.email = profileEmail;
    if (profilePassword) payload.password = profilePassword;

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfilePassword('');
        alert("Dentist profile updated successfully!");
        setSettingsModalOpen(false);
      } else {
        const errData = await response.json();
        alert(`Error updating profile: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert("Failed to connect to backend to update profile.");
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    const payload = {
      name: editName,
      age: parseInt(editAge),
      gender: editGender
    };
    try {
      const response = await fetch(`${API_BASE}/api/patients/${selectedPatient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const updated = await response.json();
        setEditPatientModalOpen(false);
        await fetchPatients(updated._id);
      } else {
        alert("Failed to update patient demographics.");
      }
    } catch (err) {
      alert("Error reaching FastAPI server to update patient.");
    }
  };

  const handleSavePrefs = (e) => {
    e.preventDefault();
    localStorage.setItem('pref_defaultGender', defaultGender);
    localStorage.setItem('pref_defaultSmoking', defaultSmoking.toString());
    alert("Preferences saved successfully!");
    setSettingsModalOpen(false);
  };

  const openEditPatientModal = () => {
    if (!selectedPatient) return;
    setEditName(selectedPatient.name);
    setEditAge(selectedPatient.age);
    setEditGender(selectedPatient.gender);
    setEditPatientModalOpen(true);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (showIntro) {
    return <IntroPage onGetStarted={() => {
      localStorage.setItem('hasSeenIntro', 'true');
      setShowIntro(false);
    }} />;
  }

  if (!token) {
    return <AuthPages onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="brand">
          <Shield size={28} style={{ color: 'var(--primary)' }} />
          <div>
            <div className="brand-logo">PerioTwin™</div>
            <div className="brand-tagline">AI Digital Twin Prognosis</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Dentist: <strong style={{ color: 'var(--primary)' }}>{user?.name}</strong>
          </span>
          <button className="btn" onClick={() => setModalOpen(true)}>
            <UserPlus size={16} /> Add Patient
          </button>
          <button className="btn btn-secondary" title="Settings" onClick={() => {
            setProfileName(user?.name || '');
            setProfileEmail(user?.email || '');
            setSettingsModalOpen(true);
          }} style={{ padding: '0.65rem' }}>
            <Settings size={16} />
          </button>
          <button className="btn btn-secondary" title="Logout" onClick={handleLogout} style={{ padding: '0.65rem' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="dashboard-grid">
        {/* Sidebar */}
        <section className="sidebar-panel glass-panel">
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search patients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="patient-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading records...</div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <Frown size={24} style={{ marginBottom: '0.5rem' }} />
                <div>No patients found</div>
              </div>
            ) : (
              filteredPatients.map(p => {
                const latest = p.history[p.history.length - 1];
                return (
                  <div 
                    key={p._id} 
                    className={`patient-card ${selectedPatient?._id === p._id ? 'active' : ''}`}
                    onClick={() => setSelectedPatient(p)}
                  >
                    <div className="patient-card-header">
                      <div className="patient-name">{p.name}</div>
                      <span className="patient-meta">{p.age} y/o • {p.gender}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Bone Loss: <strong>{latest?.bone_loss_average}mm</strong>
                      </span>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePatient(p._id);
                        }}
                      >
                        <Trash2 size={13} hover={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Details Panel */}
        <section className="glass-panel detail-panel">
          {selectedPatient ? (
            <>
              {/* Profile Details Header */}
              <div className="detail-header">
                <div>
                  <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {selectedPatient.name}
                    <button 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem', display: 'inline-flex', alignItems: 'center' }} 
                      title="Edit Patient Details"
                      onClick={openEditPatientModal}
                    >
                      <Edit size={16} />
                    </button>
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Age: <strong>{selectedPatient.age}</strong></span>
                    <span>Gender: <strong>{selectedPatient.gender}</strong></span>
                    <span>Created: <strong>{new Date(selectedPatient.created_at).toLocaleDateString()}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-stable">Clinical Record #{selectedPatient.history.length}</span>
                </div>
              </div>

              {/* Tabs for Digital Twin vs Analytics & Guidelines */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', margin: '1rem 0 0.5rem 0' }}>
                <button 
                  className={`auth-tab ${selectedTab === 'twin' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('twin')}
                  style={{ flex: 'none', padding: '0.75rem 1.5rem', fontSize: '0.9rem', borderBottom: '2px solid' }}
                >
                  <Activity size={15} style={{ marginRight: '0.5rem', display: 'inline' }} />
                  Digital Twin Simulator
                </button>
                <button 
                  className={`auth-tab ${selectedTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('analytics')}
                  style={{ flex: 'none', padding: '0.75rem 1.5rem', fontSize: '0.9rem', borderBottom: '2px solid' }}
                >
                  <BookOpen size={15} style={{ marginRight: '0.5rem', display: 'inline' }} />
                  Analytics & Guidelines
                </button>
              </div>

              {selectedTab === 'twin' ? (
                <>
                  {/* Baseline stats grid */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Smoker</div>
                      <div className="stat-value" style={{ color: selectedPatient.history[selectedPatient.history.length - 1].smoking ? 'var(--danger)' : 'var(--success)' }}>
                        {selectedPatient.history[selectedPatient.history.length - 1].smoking ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">HbA1c Level</div>
                      <div className="stat-value" style={{ color: selectedPatient.history[selectedPatient.history.length - 1].hba1c >= 6.5 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {selectedPatient.history[selectedPatient.history.length - 1].hba1c}%
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Plaque Index</div>
                      <div className="stat-value">
                        {selectedPatient.history[selectedPatient.history.length - 1].plaque_index}%
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">BOP (Bleeding)</div>
                      <div className="stat-value">
                        {selectedPatient.history[selectedPatient.history.length - 1].bleeding_on_probing}%
                      </div>
                    </div>
                  </div>

                  {/* Simulation Graph + Digital Twin Sliders */}
                  <DigitalTwin 
                    patient={selectedPatient} 
                    onUpdateRecord={handleUpdateRecord} 
                    token={token}
                  />

                  {/* History timeline */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} /> Clinical History Timeline
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedPatient.history.map((record, index) => (
                        <div 
                          key={index}
                          style={{ 
                            padding: '0.75rem 1rem', 
                            background: 'rgba(255,255,255,0.01)', 
                            border: '1px solid rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.85rem'
                          }}
                        >
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Record {index + 1}: {new Date(record.timestamp).toLocaleDateString()}
                          </span>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <span>Plaque: <strong>{record.plaque_index}%</strong></span>
                            <span>BOP: <strong>{record.bleeding_on_probing}%</strong></span>
                            <span>Bone Loss Avg: <strong style={{ color: 'var(--primary)' }}>{record.bone_loss_average}mm</strong></span>
                            <span>Attachment Loss Avg: <strong style={{ color: 'var(--accent)' }}>{record.attachment_loss_average}mm</strong></span>
                          </div>
                        </div>
                      )).reverse()}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                  {/* Analytics Summary Card */}
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.15rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} /> Clinic Patient Analytics Insights
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div className="stat-card">
                        <div className="stat-label">Total Patients</div>
                        <div className="stat-value">{patients.length}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Avg. Patient Age</div>
                        <div className="stat-value">
                          {patients.length > 0 
                            ? Math.round(patients.reduce((acc, p) => acc + p.age, 0) / patients.length) 
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Active Smokers</div>
                        <div className="stat-value" style={{ color: 'var(--danger)' }}>
                          {patients.length > 0
                            ? `${Math.round((patients.filter(p => p.history[p.history.length - 1]?.smoking).length / patients.length) * 100)}%`
                            : '0%'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AAP Guidelines Interactive Diagnostic helper */}
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={18} /> AAP Periodontitis Staging & Grading (2017)
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Clinical guidelines utility based on the American Academy of Periodontology criteria. Use to reference staging and grading definitions.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Staging Guidelines</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          <div><strong>Stage I (Initial):</strong> Interdental CAL 1-2 mm, Max bone loss &lt;15%. No tooth loss.</div>
                          <div><strong>Stage II (Moderate):</strong> Interdental CAL 3-4 mm, Bone loss 15%-33%. No tooth loss.</div>
                          <div><strong>Stage III (Severe):</strong> Interdental CAL &ge;5 mm, Bone loss &gt;33% (middle third). &le;4 teeth lost.</div>
                          <div><strong>Stage IV (Advanced):</strong> Interdental CAL &ge;5 mm, Bone loss beyond middle third. &ge;5 teeth lost. Masticatory dysfunction.</div>
                        </div>
                      </div>

                      <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Grading Guidelines</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          <div><strong>Grade A (Slow rate):</strong> No bone loss over 5 years. Heavy plaque relative to destruction. Non-smoker, non-diabetic.</div>
                          <div><strong>Grade B (Moderate rate):</strong> &lt;2 mm bone loss over 5 years. Destruction matches plaque levels. Smokes &lt;10 cigs/day or HbA1c &lt;7.0%.</div>
                          <div><strong>Grade C (Rapid rate):</strong> &ge;2 mm bone loss over 5 years. Destruction exceeds plaque. Smokes &ge;10 cigs/day or HbA1c &ge;7.0%.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem', color: 'var(--text-secondary)' }}>
              <Users size={48} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
              <h3>No Patient Selected</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Please select a patient from the list or create a new clinical profile.</p>
            </div>
          )}
        </section>
      </main>

      {/* Modal for creating a new Patient */}
      {modalOpen && (
        <div className="modal-overlay">
          <form className="modal-content glass-panel" onSubmit={handleCreatePatient}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Add Patient Profile
            </h3>

            <div className="control-group">
              <label className="control-label">Full Name</label>
              <input 
                type="text" 
                required 
                className="search-input" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="e.g. John Doe"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="control-group">
                <label className="control-label">Age</label>
                <input 
                  type="number" 
                  required 
                  className="search-input" 
                  value={newAge} 
                  onChange={(e) => setNewAge(e.target.value)} 
                />
              </div>
              <div className="control-group">
                <label className="control-label">Gender</label>
                <select 
                  className="search-input" 
                  value={newGender} 
                  onChange={(e) => setNewGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Initial Clinical Record</h4>
              
              <div className="toggle-container" style={{ margin: '0.5rem 0' }}>
                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    className="toggle-checkbox" 
                    checked={newSmoking} 
                    onChange={(e) => setNewSmoking(e.target.checked)} 
                  />
                  Smoking Status
                </label>
                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    className="toggle-checkbox" 
                    checked={newDiabetes} 
                    onChange={(e) => setNewDiabetes(e.target.checked)} 
                  />
                  Diabetic Status
                </label>
              </div>

              {newDiabetes && (
                <div className="control-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="control-label">HbA1c Level (%) - {newHba1c}%</label>
                  <input 
                    type="range" 
                    min="4.5" 
                    max="12.0" 
                    step="0.1" 
                    value={newHba1c} 
                    onChange={(e) => setNewHba1c(parseFloat(e.target.value))} 
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="control-group">
                  <label className="control-label">Plaque Index (%)</label>
                  <input 
                    type="number" 
                    className="search-input" 
                    min="0" 
                    max="100" 
                    value={newPlaque} 
                    onChange={(e) => setNewPlaque(parseInt(e.target.value))} 
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">BOP (%)</label>
                  <input 
                    type="number" 
                    className="search-input" 
                    min="0" 
                    max="100" 
                    value={newBop} 
                    onChange={(e) => setNewBop(parseInt(e.target.value))} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div className="control-group">
                  <label className="control-label">Bone Loss (mm)</label>
                  <input 
                    type="number" 
                    className="search-input" 
                    step="0.1" 
                    min="0.0" 
                    max="12.0" 
                    value={newBoneLoss} 
                    onChange={(e) => setNewBoneLoss(parseFloat(e.target.value))} 
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">Attachment Loss (mm)</label>
                  <input 
                    type="number" 
                    className="search-input" 
                    step="0.1" 
                    min="0.0" 
                    max="15.0" 
                    value={newAttachLoss} 
                    onChange={(e) => setNewAttachLoss(parseFloat(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn">
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for editing a Patient */}
      {editPatientModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content glass-panel" onSubmit={handleUpdatePatient}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Edit Patient Demographics
            </h3>

            <div className="control-group">
              <label className="control-label">Full Name</label>
              <input 
                type="text" 
                required 
                className="search-input" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                placeholder="e.g. John Doe"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="control-group">
                <label className="control-label">Age</label>
                <input 
                  type="number" 
                  required 
                  className="search-input" 
                  value={editAge} 
                  onChange={(e) => setEditAge(e.target.value)} 
                />
              </div>
              <div className="control-group">
                <label className="control-label">Gender</label>
                <select 
                  className="search-input" 
                  value={editGender} 
                  onChange={(e) => setEditGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditPatientModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for Settings & Profile edit */}
      {settingsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} style={{ color: 'var(--primary)' }} /> Settings & Profile
            </h3>

            {/* Modal internal tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }}>
              <button 
                className={`auth-tab ${settingsTab === 'profile' ? 'active' : ''}`}
                onClick={() => setSettingsTab('profile')}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', flex: 'none', borderBottom: '2px solid' }}
              >
                Dentist Profile
              </button>
              <button 
                className={`auth-tab ${settingsTab === 'prefs' ? 'active' : ''}`}
                onClick={() => setSettingsTab('prefs')}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', flex: 'none', borderBottom: '2px solid' }}
              >
                Preferences
              </button>
              <button 
                className={`auth-tab ${settingsTab === 'about' ? 'active' : ''}`}
                onClick={() => setSettingsTab('about')}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', flex: 'none', borderBottom: '2px solid' }}
              >
                About App
              </button>
            </div>

            {settingsTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="control-group">
                  <label className="control-label">Dentist Name</label>
                  <input 
                    type="text" 
                    required 
                    className="search-input" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="search-input" 
                    value={profileEmail} 
                    onChange={(e) => setProfileEmail(e.target.value)} 
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">Change Password (Leave blank to keep current)</label>
                  <input 
                    type="password" 
                    className="search-input" 
                    value={profilePassword} 
                    onChange={(e) => setProfilePassword(e.target.value)} 
                    placeholder="New password (min 6 chars)"
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSettingsModalOpen(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn">
                    Save Profile
                  </button>
                </div>
              </form>
            )}

            {settingsTab === 'prefs' && (
              <form onSubmit={handleSavePrefs} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="control-group">
                  <label className="control-label">Default Patient Gender</label>
                  <select 
                    className="search-input" 
                    value={defaultGender} 
                    onChange={(e) => {
                      setDefaultGender(e.target.value);
                    }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="toggle-container" style={{ margin: '0.5rem 0' }}>
                  <label className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      className="toggle-checkbox" 
                      checked={defaultSmoking} 
                      onChange={(e) => {
                        setDefaultSmoking(e.target.checked);
                      }} 
                    />
                    Default Smoking Status for New Patients
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setSettingsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn">
                    Save Preferences
                  </button>
                </div>
              </form>
            )}

            {settingsTab === 'about' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                  <Shield size={40} style={{ color: 'var(--primary)', flex: 'none' }} />
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>PerioTwin™ Prognosis Gateway</h4>
                    <div>Version 1.0.0 (Production Build)</div>
                  </div>
                </div>

                <p>
                  PerioTwin™ uses a state-of-the-art dual AI architecture to simulate periodontal disease trajectories. 
                  A Random Forest risk classification model determines whether a clinical profile is <strong>Stable</strong> or <strong>Progressing</strong>.
                </p>
                <p>
                  A recurrent neural network (LSTM time-series model) generates a 12-month trajectory forecasting average bone degradation and clinical attachment loss.
                </p>
                <p style={{ fontSize: '0.8rem', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                  Developed by Clinical AI Division. Certified for clinical research and prognostic mock-simulation.
                </p>
                
                <div className="modal-actions">
                  <button type="button" className="btn" onClick={() => setSettingsModalOpen(false)}>
                    Understood
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
