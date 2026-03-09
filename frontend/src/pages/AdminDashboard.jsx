import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AnalyticsChart from '../components/AnalyticsChart';
import API from '../services/api';

const INIT_TASK = { title: '', description: '', deadline: '', assignedUsers: '' };

// Icon components
const icons = {
    tasks: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    users: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    check: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    clock: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const STAT_CONFIG = [
    { key: 'totalTasks', label: 'Task Types', icon: icons.tasks, colors: { bg: 'bg-brand-50', border: 'border-brand-100', iconBg: 'bg-brand-100', text: 'text-brand-700', iconCls: 'w-5 h-5 text-brand-600' } },
    { key: 'totalAssigned', label: 'Total Assigned', icon: icons.users, colors: { bg: 'bg-violet-50', border: 'border-violet-100', iconBg: 'bg-violet-100', text: 'text-violet-700', iconCls: 'w-5 h-5 text-violet-600' } },
    { key: 'totalCompleted', label: 'Completed', icon: icons.check, colors: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', text: 'text-emerald-700', iconCls: 'w-5 h-5 text-emerald-600' } },
    { key: 'totalPending', label: 'Pending', icon: icons.clock, colors: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', text: 'text-amber-700', iconCls: 'w-5 h-5 text-amber-600' } },
];

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState([]);
    const [form, setForm] = useState(INIT_TASK);
    const [toast, setToast] = useState(null);
    const [loadingChart, setLoadingChart] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sendingReminders, setSendingReminders] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await API.get('/tasks/admin/task-analytics');
            setAnalytics(res.data);
        } catch {
            showToast('Failed to load analytics', 'error');
        } finally {
            setLoadingChart(false);
        }
    }, []);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const assignedUsers = form.assignedUsers.split(',').map((id) => id.trim()).filter(Boolean);
            if (assignedUsers.length === 0) {
                showToast('Please enter at least one User ID', 'error');
                setSubmitting(false);
                return;
            }
            await API.post('/tasks', {
                title: form.title,
                description: form.description,
                deadline: form.deadline || undefined,
                taskType: 'admin',
                assignedUsers,
            });
            showToast('Task created and assigned successfully! ✅');
            setForm(INIT_TASK);
            await fetchAnalytics();
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to create task', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendReminders = async () => {
        setSendingReminders(true);
        try {
            const res = await API.post('/tasks/admin/send-reminders');
            showToast(res.data?.message || 'Reminder emails sent! 📧');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to send reminders', 'error');
        } finally {
            setSendingReminders(false);
        }
    };

    // Compute stats from deduplicated analytics (same dedup logic as chart)
    const dedupedMap = new Map();
    analytics.forEach((d) => {
        const existing = dedupedMap.get(d.task);
        if (!existing || d.assigned > existing.assigned) dedupedMap.set(d.task, d);
    });
    const deduped = Array.from(dedupedMap.values());
    const aggStats = {
        totalTasks: deduped.length,
        totalAssigned: deduped.reduce((s, a) => s + (a.assigned || 0), 0),
        totalCompleted: deduped.reduce((s, a) => s + (a.completed || 0), 0),
        totalPending: deduped.reduce((s, a) => s + (a.pending || 0), 0),
    };

    const overallRate = aggStats.totalAssigned > 0
        ? Math.round((aggStats.totalCompleted / aggStats.totalAssigned) * 100)
        : 0;

    return (
        <div className="flex h-screen overflow-hidden bg-surface-50">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar title="Admin Dashboard" />

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-slide-up max-w-xs ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-surface-900 text-white'
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

                    {/* Stats row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {STAT_CONFIG.map((s) => (
                            <div key={s.key} className={`rounded-xl p-4 flex items-center gap-4 border ${s.colors.bg} ${s.colors.border}`}>
                                <div className={`w-10 h-10 rounded-xl ${s.colors.iconBg} flex items-center justify-center shrink-0`}>
                                    {s.icon(s.colors.iconCls)}
                                </div>
                                <div>
                                    <p className={`text-2xl font-extrabold ${s.colors.text}`}>{aggStats[s.key]}</p>
                                    <p className="text-xs text-surface-500 font-medium">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Analytics Chart */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-base font-bold text-surface-800">Task Analytics</h2>
                                <p className="text-xs text-surface-400 mt-0.5">
                                    Overall completion rate:&nbsp;
                                    <span className={`font-bold ${overallRate >= 75 ? 'text-emerald-600' : overallRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                                        {overallRate}%
                                    </span>
                                </p>
                            </div>
                            <button onClick={fetchAnalytics} className="btn-secondary text-xs px-3 py-1.5 gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                        {loadingChart ? (
                            <div className="h-64 flex items-center justify-center gap-2 text-surface-400 text-sm">
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                Loading analytics…
                            </div>
                        ) : (
                            <AnalyticsChart data={analytics} />
                        )}
                    </div>

                    {/* Create Task + Reminders */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Create Task Form — 3 columns */}
                        <div className="lg:col-span-3 card">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h2 className="text-base font-bold text-surface-800">Create Onboarding Task</h2>
                            </div>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="label">Task Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. Submit ID Proof"
                                        required
                                        className="input"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Deadline *</label>
                                        <input
                                            type="date"
                                            value={form.deadline}
                                            onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                                            required
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Assign User IDs *</label>
                                        <input
                                            type="text"
                                            value={form.assignedUsers}
                                            onChange={(e) => setForm((p) => ({ ...p, assignedUsers: e.target.value }))}
                                            placeholder="id1, id2, …"
                                            required
                                            className="input"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Description <span className="normal-case font-normal text-surface-400">(optional)</span></label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Task description…"
                                        rows={2}
                                        className="input resize-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <p className="text-xs text-surface-400">
                                        <svg className="w-3.5 h-3.5 inline mr-1 text-surface-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Enter MongoDB User IDs separated by commas
                                    </p>
                                    <button type="submit" disabled={submitting} className="btn-primary">
                                        {submitting ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                                Creating…
                                            </>
                                        ) : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Reminders — 2 columns */}
                        <div className="lg:col-span-2 card flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-base font-bold text-surface-800">Send Reminders</h2>
                            </div>
                            <p className="text-xs text-surface-500 mb-4 leading-relaxed">
                                Email all interns who have pending tasks with a deadline within the next <strong>7 days</strong>.
                            </p>

                            {/* Stats preview */}
                            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 mb-4 flex items-center justify-between">
                                <span className="text-xs text-amber-700 font-medium">Pending tasks in system</span>
                                <span className="text-lg font-bold text-amber-700">{aggStats.totalPending}</span>
                            </div>

                            <button
                                onClick={handleSendReminders}
                                disabled={sendingReminders}
                                className="btn-danger w-full justify-center mt-auto py-3"
                            >
                                {sendingReminders ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                        Sending emails…
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Send Reminder Emails
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
