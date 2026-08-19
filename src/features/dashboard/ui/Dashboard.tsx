import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../auth/data/authService';
import { dashboardService } from '../data/dashboardService';
import type { DashboardStats, CarEntry } from '../model/DashboardTypes';
import { LogOut, Car, DollarSign, ParkingCircle, Activity, UserCircle } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [entries, setEntries] = useState<CarEntry[]>([]);
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
      setStats(s);
      setEntries(e);
    };

    loadData();
  }, [user, navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!stats) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav glass-panel">
        <div className="nav-brand">
          <ParkingCircle size={32} className="text-primary" />
          <h2>Parking Admin</h2>
        </div>
        <div className="nav-actions">
          <div className="user-profile">
            <UserCircle size={24} />
            <span>{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <header className="page-header">
          <h1>Today's Overview</h1>
          <p className="text-muted">Real-time parking statistics</p>
        </header>

        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <div className="stat-icon-wrapper bg-blue">
              <Car size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalCarsToday}</h3>
              <p>Total Cars Today</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon-wrapper bg-green">
              <Activity size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.currentlyParked}</h3>
              <p>Currently Parked</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon-wrapper bg-yellow">
              <ParkingCircle size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.availableSpots}</h3>
              <p>Available Spots</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon-wrapper bg-purple">
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <h3>${stats.totalRevenue.toFixed(2)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>

        <section className="recent-entries glass-panel">
          <div className="section-header">
            <h2>Recent Activity</h2>
          </div>
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>License Plate</th>
                  <th>Entry Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
                    <td className="font-medium">{entry.licensePlate}</td>
                    <td>{new Date(entry.entryTime).toLocaleTimeString()}</td>
                    <td>
                      <span className={`status-badge ${entry.status}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};
