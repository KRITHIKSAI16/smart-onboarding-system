import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const INITIAL_FORM = { title: '', description: '', deadline: '' };

function StatCard({ value, label, color, icon }) {
    return (
        <div className={`flex-1 rounded-xl p-4 flex items-center gap-4 border ${color.bg} ${color.border}`}>
            <div className={`w-10 h-10 rounded-xl ${color.iconBg} flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div>
                <p className={`text-2xl font-extrabold ${color.text}`}>{value}</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function InternDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [toast, setToast] = useState(null);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completing, setCompleting] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAll = useCallback(async () => {
        try {
            const [tasksRes, progressRes] = await Promise.all([
                API.get('/tasks'),
                API.get('/tasks/progress'),
            ]);
            setTasks(tasksRes.data);
            setProgress(progressRes.data);
        } catch {
            showToast('Failed to load data', 'error');
        } finally {
            setLoadingTasks(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleComplete = async (taskId) => {
        setCompleting(taskId);
        try {
            await API.put(`/tasks/${taskId}/complete`);
            showToast('Task completed! 🎉 Great work!');
            await fetchAll();
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to complete task', 'error');
        } finally {
            setCompleting(null);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.post('/tasks', {
                title: form.title,
                description: form.description,
                deadline: form.deadline || undefined,
                taskType: 'personal',
                assignedUsers: [user.id],
            });
            showToast('Personal task created successfully!');
            setForm(INITIAL_FORM);
            await fetchAll();
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to create task', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const progressPct = progress ? parseFloat(progress.progress) : 0;
    const onboardingTasks = tasks.filter((t) => t.taskType !== 'personal');
    const personalTasks = tasks.filter((t) => t.taskType === 'personal');

    const statCards = [
        {
            value: progress?.totalTasks ?? '—',
            label: 'Total Tasks',
            color: { bg: 'bg-brand-50', border: 'border-brand-100', iconBg: 'bg-brand-100', text: 'text-brand-700' },
            icon: <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
        },
        {
            value: progress?.completed ?? '—',
            label: 'Completed',
            color: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', text: 'text-emerald-700' },
            icon: <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
        {
            value: progress?.pending ?? '—',
            label: 'Pending',
            color: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', text: 'text-amber-700' },
            icon: <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-surface-50">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar title="My Dashboard" />

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-slide-up max-w-xs ${toast.type === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-surface-900 text-white'
                        }`}>
                        {toast.type !== 'error' && (
                            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {toast.msg}
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Progress Section */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold text-surface-800">Onboarding Progress</h2>
                                <p className="text-xs text-surface-400 mt-0.5">
                                    {progressPct === 100
                                        ? '🎉 Congratulations! All tasks complete!'
                                        : `Keep going — you're ${progressPct}% there`}
                                </p>
                            </div>
                            {progressPct === 100 && (
                                <span className="badge bg-emerald-100 text-emerald-700 text-xs">🏆 Complete</span>
                            )}
                        </div>

                        <ProgressBar progress={progressPct} label="Overall completion" />

                        {/* Stats row */}
                        <div className="flex gap-3 mt-5">
                            {statCards.map((s) => (
                                <StatCard key={s.label} {...s} />
                            ))}
                        </div>
                    </div>

                    {/* Onboarding Tasks */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-sm font-bold text-surface-700">Assigned Onboarding Tasks</h2>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">{onboardingTasks.length}</span>
                        </div>
                        {loadingTasks ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-36 rounded-xl bg-surface-100 animate-pulse" />
                                ))}
                            </div>
                        ) : onboardingTasks.length === 0 ? (
                            <div className="card text-center py-10">
                                <p className="text-2xl mb-2">📭</p>
                                <p className="text-surface-500 text-sm font-medium">No onboarding tasks assigned yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {onboardingTasks.map((task) => (
                                    <div key={task._id} className={completing === task._id ? 'opacity-50 pointer-events-none' : ''}>
                                        <TaskCard task={task} userId={user?.id} onComplete={handleComplete} onRefresh={fetchAll} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Personal Tasks */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-sm font-bold text-surface-700">Personal Tasks</h2>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{personalTasks.length}</span>
                        </div>

                        {!loadingTasks && personalTasks.length === 0 && (
                            <div className="card text-center py-8 mb-4">
                                <p className="text-2xl mb-2">✏️</p>
                                <p className="text-surface-500 text-sm font-medium">No personal tasks yet. Add one below!</p>
                            </div>
                        )}

                        {personalTasks.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {personalTasks.map((task) => (
                                    <div key={task._id} className={completing === task._id ? 'opacity-50 pointer-events-none' : ''}>
                                        <TaskCard task={task} userId={user?.id} onComplete={handleComplete} onRefresh={fetchAll} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Create Personal Task */}
                        <div className="card border-2 border-dashed border-surface-200 bg-surface-50/50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-bold text-surface-700">Create Personal Task</h3>
                            </div>
                            <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="What do you need to do?"
                                        required
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Deadline <span className="normal-case text-surface-400 font-normal">(optional)</span></label>
                                    <input
                                        type="date"
                                        value={form.deadline}
                                        onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                                        className="input"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="label">Description <span className="normal-case text-surface-400 font-normal">(optional)</span></label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Add some details…"
                                        rows={2}
                                        className="input resize-none"
                                    />
                                </div>
                                <div className="sm:col-span-2 flex justify-end">
                                    <button type="submit" disabled={submitting} className="btn-primary">
                                        {submitting ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                                Creating…
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                Add Task
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
