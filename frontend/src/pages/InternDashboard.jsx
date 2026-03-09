import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ProgressBar from '../components/ProgressBar';
import TaskCard from '../components/TaskCard';
import { Loader2, ClipboardCheck } from 'lucide-react';
import './Dashboard.css';

const InternDashboard = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState({ totalTasks: 0, completed: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            // GET /api/tasks — returns tasks assigned to the logged-in user (via JWT)
            const [tasksRes, progressRes] = await Promise.all([
                axios.get('/api/tasks'),
                axios.get('/api/tasks/progress'),
            ]);

            setTasks(tasksRes.data);
            setProgress(progressRes.data); // { totalTasks, completed, pending, progress: "75%" }
        } catch (error) {
            console.error('Error fetching tasks/progress:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    // Called by TaskCard after a successful PUT /api/tasks/:taskId/complete
    const handleTaskUpdate = (taskId) => {
        // Update the local task's assignment status so UI reflects completion instantly
        setTasks(prev =>
            prev.map(t => {
                if (t._id !== taskId) return t;
                return {
                    ...t,
                    assignments: t.assignments.map(a =>
                        a.user === currentUser.id || a.user?._id === currentUser.id
                            ? { ...a, status: 'completed' }
                            : a
                    )
                };
            })
        );
        // Refresh progress from API
        axios.get('/api/tasks/progress').then(res => setProgress(res.data)).catch(() => { });
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1 className="title-gradient">
                            Welcome, {currentUser?.name?.split(' ')[0]}!
                        </h1>
                        <p className="subtitle">Track and complete your onboarding tasks below.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="flex-center" style={{ height: '300px' }}>
                        <Loader2 className="spinner" size={40} color="var(--primary)" />
                    </div>
                ) : (
                    <div className="dashboard-content">
                        {/* Progress Bar uses data from GET /api/tasks/progress */}
                        <ProgressBar
                            total={progress.totalTasks}
                            completed={progress.completed}
                        />

                        <div className="tasks-section">
                            <h2 className="section-title">
                                <ClipboardCheck size={22} /> Assigned Tasks
                            </h2>
                            {tasks.length === 0 ? (
                                <div className="empty-state glass-panel">
                                    <p>🎉 No tasks assigned yet. Check back soon!</p>
                                </div>
                            ) : (
                                <div className="task-list">
                                    {tasks.map(task => (
                                        <TaskCard
                                            key={task._id}
                                            task={task}
                                            userId={currentUser.id}
                                            onTaskUpdate={handleTaskUpdate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InternDashboard;
