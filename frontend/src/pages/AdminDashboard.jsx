import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Mail, CheckCircle, Clock, BarChart2, Loader2 } from 'lucide-react';
import './Dashboard.css';

const AdminDashboard = () => {
    // Backend GET /api/tasks/admin/task-analytics returns:
    // [{ task: "Title", assigned: N, completed: N, pending: N, completionRate: "75%" }, ...]
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [reminderMsg, setReminderMsg] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Correct endpoint: GET /api/tasks/admin/task-analytics
            const res = await axios.get('/api/tasks/admin/task-analytics');
            setAnalytics(res.data);
        } catch (error) {
            console.error('Analytics fetch error:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminders = async () => {
        // Correct endpoint: POST /api/tasks/admin/send-reminders
        setSendingReminders(true);
        setReminderMsg('');
        try {
            const res = await axios.post('/api/tasks/admin/send-reminders');
            setReminderMsg(res.data.message || 'Reminders sent!');
        } catch (error) {
            setReminderMsg(error.response?.data?.message || 'Failed to send reminders.');
        } finally {
            setSendingReminders(false);
            setTimeout(() => setReminderMsg(''), 5000);
        }
    };

    // Derive stats from analytics
    const totalTasks = analytics.length;
    const totalAssigned = analytics.reduce((sum, t) => sum + t.assigned, 0);
    const totalCompleted = analytics.reduce((sum, t) => sum + t.completed, 0);
    const overallRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    // Normalize for chart: parse completionRate "75%" → 75
    const chartData = analytics.map(item => ({
        name: item.task,
        completed: item.completed,
        pending: item.pending,
        completionRate: parseInt(item.completionRate) || 0
    }));

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1 className="title-gradient">Admin Dashboard</h1>
                        <p className="subtitle">Monitor intern onboarding progress and send reminders.</p>
                    </div>

                    {/* Send All Reminders Button - POST /api/tasks/admin/send-reminders */}
                    <button
                        className="btn-remind-all"
                        onClick={handleSendReminders}
                        disabled={sendingReminders}
                        title="Send email reminders to all interns with pending tasks"
                    >
                        {sendingReminders
                            ? <><Loader2 className="spinner" size={18} /> Sending...</>
                            : <><Mail size={18} /> Send Reminders</>
                        }
                    </button>
                </header>

                {reminderMsg && (
                    <div className={`reminder-toast ${reminderMsg.includes('Failed') ? 'error' : 'success'}`}>
                        {reminderMsg}
                    </div>
                )}

                {loading ? (
                    <div className="flex-center" style={{ height: '300px' }}>
                        <Loader2 className="spinner" size={40} color="var(--primary)" />
                    </div>
                ) : (
                    <div className="dashboard-content">
                        {/* Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card glass-panel">
                                <div className="stat-icon flex-center" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)' }}>
                                    <BarChart2 size={24} />
                                </div>
                                <div>
                                    <div className="stat-value">{totalTasks}</div>
                                    <div className="stat-label">Total Task Types</div>
                                </div>
                            </div>
                            <div className="stat-card glass-panel">
                                <div className="stat-icon flex-center" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <div className="stat-value">{overallRate}%</div>
                                    <div className="stat-label">Overall Completion</div>
                                </div>
                            </div>
                            <div className="stat-card glass-panel">
                                <div className="stat-icon flex-center" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <div className="stat-value">{totalAssigned - totalCompleted}</div>
                                    <div className="stat-label">Pending Assignments</div>
                                </div>
                            </div>
                        </div>

                        {/* Analytics Bar Chart */}
                        <div className="chart-container glass-panel" style={{ marginTop: '24px' }}>
                            <h2 className="section-title">Task Completion Analytics</h2>
                            {analytics.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', padding: '24px 0' }}>No task data available yet.</p>
                            ) : (
                                <div style={{ height: 320, marginTop: '20px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="var(--text-muted)"
                                                tick={{ fontSize: 12 }}
                                                angle={-30}
                                                textAnchor="end"
                                            />
                                            <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                                contentStyle={{
                                                    background: 'var(--bg-dark)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '8px',
                                                    color: 'var(--text-main)'
                                                }}
                                                formatter={(value, name) => [value, name === 'completionRate' ? 'Completion %' : name]}
                                            />
                                            <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.completionRate === 100 ? 'var(--success)' : 'var(--primary)'}
                                                    />
                                                ))}
                                            </Bar>
                                            <Bar dataKey="pending" name="Pending" fill="rgba(245,158,11,0.5)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Task Analytics Table */}
                        <div className="admin-intern-list" style={{ marginTop: '36px' }}>
                            <h2 className="section-title">Task Breakdown</h2>
                            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Task Title</th>
                                            <th>Assigned</th>
                                            <th>Completed</th>
                                            <th>Pending</th>
                                            <th>Completion %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                                    No tasks found.
                                                </td>
                                            </tr>
                                        ) : (
                                            analytics.map((item, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{item.task}</td>
                                                    <td>{item.assigned}</td>
                                                    <td>
                                                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>{item.completed}</span>
                                                    </td>
                                                    <td>
                                                        <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{item.pending}</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div className="mini-progress">
                                                                <div
                                                                    className="mini-progress-fill"
                                                                    style={{
                                                                        width: item.completionRate,
                                                                        background: parseInt(item.completionRate) === 100
                                                                            ? 'var(--success)' : 'var(--primary)'
                                                                    }}
                                                                />
                                                            </div>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                {item.completionRate}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
