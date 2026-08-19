import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../auth/data/authService';
import { dashboardService } from '../data/dashboardService';
import type { DashboardStats, CarEntry, Alert } from '../model/DashboardTypes';
import { LayoutDashboard, Car, Map, List, BarChart, Settings, Search, LogOut, CheckCircle, FileText, User } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [entries, setEntries] = useState<CarEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      const s = await dashboardService.getStats();
      const e = await dashboardService.getRecentEntries();
      const a = await dashboardService.getAlerts();
      setStats(s);
      setEntries(e);
      setAlerts(a);
    };

    loadData();
  }, [user, navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!stats) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Car size={24} />
          <h2>Parking Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a href="#" className="nav-item">
            <Car size={18} /> Vehicles
          </a>
          <a href="#" className="nav-item">
            <Map size={18} /> Parking Map
          </a>
          <a href="#" className="nav-item">
            <List size={18} /> Entry/Exit Log
          </a>
          <a href="#" className="nav-item">
            <BarChart size={18} /> Reports
          </a>
          <a href="#" className="nav-item">
            <Settings size={18} /> Settings
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="profile-avatar">
            <User size={16} />
          </div>
          <div className="profile-info">
            <div className="profile-name">Marcus Vance</div>
            <div className="profile-role">Operations Manager</div>
          </div>
          <button onClick={handleLogout} className="btn-logout-icon" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="header-titles">
            <h1>Dashboard</h1>
            <p className="text-muted">Main Terminal • Lot A-D Configuration</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Search plate, spot or owner..." className="search-input" />
            </div>
            <div className="date-display">
              <strong>Oct 24, 2025</strong><br/>14:32:05 PM
            </div>
          </div>
        </header>

        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-header">
              <span className="stat-title">TOTAL CAPACITY</span>
              <Car size={16} className="text-muted" />
            </div>
            <div className="stat-value">{stats.totalCapacity}</div>
            <div className="stat-desc">Across Zones A, B, C, & D</div>
          </div>
          <div className="stat-box">
            <div className="stat-header">
              <span className="stat-title">OCCUPIED SPACES</span>
            </div>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {stats.occupiedSpaces} <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>72% Occupancy</span>
            </div>
            <div className="stat-desc">87 Active vehicle parkings</div>
          </div>
          <div className="stat-box">
            <div className="stat-header">
              <span className="stat-title">AVAILABLE SPACES</span>
              <CheckCircle size={16} className="text-muted" />
            </div>
            <div className="stat-value" style={{ color: 'var(--success-color)' }}>{stats.availableSpaces}</div>
            <div className="stat-desc">Ready for immediate entries</div>
          </div>
          <div className="stat-box">
            <div className="stat-header">
              <span className="stat-title">REVENUE TODAY</span>
              <FileText size={16} className="text-muted" />
            </div>
            <div className="stat-value">${stats.revenueToday.toLocaleString()}</div>
            <div className="stat-desc">+14.2% from yesterday average</div>
          </div>
        </div>

        <div className="middle-row">
          <div className="chart-box">
            <div className="box-header">
              <div>
                <h3>Occupancy Over Time</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Live 7 days historical tracking</p>
              </div>
            </div>
            <div className="chart-mock">
              <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="line-chart">
                <polyline 
                  fill="none" 
                  stroke="var(--primary-color)" 
                  strokeWidth="2" 
                  points="0,100 70,80 140,120 210,60 280,100 350,40 420,50 500,60" 
                />
              </svg>
              <div className="chart-labels">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>

          <div className="activity-box">
            <div className="box-header">
              <h3>Recent Activity Feed</h3>
            </div>
            <table className="activity-table">
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
                    <td className="font-medium">
                      <Car size={14} className="text-muted" style={{ marginRight: '6px', verticalAlign: 'middle' }}/> 
                      {entry.licensePlate}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>Spot {entry.spot}</td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{entry.entryTime}</td>
                    <td className="td-right">
                      <span className={`badge ${entry.status === 'entry' ? 'badge-success' : 'badge-danger'}`}>
                        {entry.status === 'entry' ? 'Entry' : 'Exit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="alerts-section">
          <h3>Alerts & Violations</h3>
          <div className="alerts-grid">
            {alerts.map((alert, index) => {
              // Alternate badge colors for the mock
              let badgeClass = "badge-warning";
              if (index === 1) badgeClass = "badge-danger";
              
              return (
                <div key={alert.id} className="alert-card">
                  <div className="alert-header">
                    <span className={`badge ${badgeClass}`}>{alert.type}</span>
                    <span className="text-muted">Spot {alert.spot}</span>
                  </div>
                  <div className="alert-plate">{alert.licensePlate}</div>
                  <div className="alert-details">{alert.details}</div>
                  <button className="btn-outline mt-auto">Inspect Spot</button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
