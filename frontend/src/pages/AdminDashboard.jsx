import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AnalyticsChart from '../components/AnalyticsChart';
import API from '../services/api';

const INIT_TASK = { title: '', description: '', deadline: '', requiresProof: false, assignedUsers: [] };

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

// --- Proof Image Modal ---
function ProofModal({ imageUrl, onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="relative max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Close
                </button>
                <img src={imageUrl} alt="Proof Screenshot" className="w-full rounded-2xl shadow-2xl border border-white/10" />
            </div>
        </div>
    );
}

// --- Reject Modal ---
function RejectModal({ onConfirm, onClose, loading }) {
    const [comment, setComment] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                <h3 className="text-base font-bold text-surface-800 mb-1">Reject Proof</h3>
                <p className="text-xs text-surface-400 mb-4">Provide a reason so the intern can resubmit.</p>
                <textarea
                    className="input resize-none w-full mb-4"
                    rows={3}
                    placeholder="e.g. Screenshot does not show GitHub profile."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    autoFocus
                />
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button
                        onClick={() => onConfirm(comment)}
                        disabled={loading || !comment.trim()}
                        className="btn-danger"
                    >
                        {loading ? 'Rejecting…' : 'Reject & Notify'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState([]);
    const [interns, setInterns] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [internProgress, setInternProgress] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [form, setForm] = useState(INIT_TASK);
    const [toast, setToast] = useState(null);
    const [loadingChart, setLoadingChart] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [proofModal, setProofModal] = useState(null); // url string
    const [rejectTarget, setRejectTarget] = useState(null); // { taskId, userId }
    const [rejectLoading, setRejectLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // key: `${taskId}_${userId}`

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

    const fetchInterns = useCallback(async () => {
        try {
            const res = await API.get('/auth/interns');
            if (res.data && res.data.length > 0) {
                setInterns(res.data);
                return;
            }
        } catch {
            // fall through to fallback
        }
        // Fallback: derive from intern-progress (guaranteed to have the real interns)
        try {
            const res = await API.get('/tasks/admin/intern-progress');
            const derived = (res.data || []).map((ip) => ({
                _id: ip.internId,
                name: ip.internName,
                email: ip.internEmail || '',
            }));
            setInterns(derived);
        } catch {
            // both sources failed
        }
    }, []);

    const fetchPendingApprovals = useCallback(async () => {
        try {
            const res = await API.get('/tasks/admin/pending-approvals');
            setPendingApprovals(res.data);
        } catch {
            // silently ignore
        }
    }, []);

    const fetchInternProgress = useCallback(async () => {
        try {
            const res = await API.get('/tasks/admin/intern-progress');
            setInternProgress(res.data);
        } catch {
            // silently ignore
        }
    }, []);

    const fetchOverdueTasks = useCallback(async () => {
        try {
            const res = await API.get('/tasks/admin/overdue-tasks');
            setOverdueTasks(res.data);
        } catch {
            // silently ignore
        }
    }, []);

    const fetchAll = useCallback(async () => {
        await Promise.all([
            fetchAnalytics(),
            fetchInterns(),
            fetchPendingApprovals(),
            fetchInternProgress(),
            fetchOverdueTasks(),
        ]);
    }, [fetchAnalytics, fetchInterns, fetchPendingApprovals, fetchInternProgress, fetchOverdueTasks]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const assignedUsers = form.assignedUsers;
            if (assignedUsers.length === 0) {
                showToast('Please select at least one intern', 'error');
                setSubmitting(false);
                return;
            }
            await API.post('/tasks', {
                title: form.title,
                description: form.description,
                deadline: form.deadline || undefined,
                taskType: 'admin',
                requiresProof: form.requiresProof,
                assignedUsers,
            });
            showToast('Task created and assigned successfully! ✅');
            setForm(INIT_TASK);
            await fetchAll();
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

    const handleApprove = async (taskId, userId) => {
        const key = `${taskId}_${userId}`;
        setActionLoading(key);
        try {
            await API.put(`/tasks/${taskId}/approve/${userId}`);
            showToast('Proof approved! ✅');
            await fetchAll();
        } catch (err) {
            showToast(err?.response?.data?.message || 'Approval failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (comment) => {
        if (!rejectTarget) return;
        setRejectLoading(true);
        try {
            await API.put(`/tasks/${rejectTarget.taskId}/reject/${rejectTarget.userId}`, { comment });
            showToast('Proof rejected and intern notified.');
            setRejectTarget(null);
            await fetchAll();
        } catch (err) {
            showToast(err?.response?.data?.message || 'Rejection failed', 'error');
        } finally {
            setRejectLoading(false);
        }
    };

    const toggleIntern = (id) => {
        setForm((p) => ({
            ...p,
            assignedUsers: p.assignedUsers.includes(id)
                ? p.assignedUsers.filter((i) => i !== id)
                : [...p.assignedUsers, id],
        }));
    };

    // Compute stats from deduplicated analytics
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

                {/* Modals */}
                {proofModal && <ProofModal imageUrl={proofModal} onClose={() => setProofModal(null)} />}
                {rejectTarget && (
                    <RejectModal
                        onConfirm={handleReject}
                        onClose={() => setRejectTarget(null)}
                        loading={rejectLoading}
                    />
                )}

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-slide-up max-w-xs ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-surface-900 text-white'
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
                            <button onClick={fetchAll} className="btn-secondary text-xs px-3 py-1.5 gap-1.5">
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

                    {/* ── Pending Approvals ── */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <h2 className="text-base font-bold text-surface-800">Pending Approvals</h2>
                            {pendingApprovals.length > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold ml-1">
                                    {pendingApprovals.length}
                                </span>
                            )}
                        </div>

                        {pendingApprovals.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-2xl mb-2">🎉</p>
                                <p className="text-surface-400 text-sm font-medium">No pending approvals — all caught up!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-surface-100">
                                            <th className="text-left pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Intern</th>
                                            <th className="text-left pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Task</th>
                                            <th className="text-left pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Proof</th>
                                            <th className="text-right pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-50">
                                        {pendingApprovals.map((item) => {
                                            const key = `${item.taskId}_${item.internId || item.userId}`;
                                            const userId = item.internId || item.userId;
                                            return (
                                                <tr key={key} className="hover:bg-surface-50/80 transition-colors">
                                                    <td className="py-3 pr-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                                                                {(item.internName || '?')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-surface-800 text-xs">{item.internName || 'Unknown'}</p>
                                                                <p className="text-surface-400 text-xs">{item.internEmail || ''}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <p className="font-medium text-surface-700 text-xs max-w-[200px] truncate">{item.taskTitle}</p>
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        {item.proofImage ? (
                                                            <button
                                                                onClick={() => setProofModal(item.proofImage)}
                                                                className="group relative w-16 h-12 rounded-lg overflow-hidden border border-surface-100 hover:border-brand-300 transition-all shadow-sm hover:shadow-md shrink-0"
                                                                title="Click to view full screenshot"
                                                            >
                                                                <img
                                                                    src={item.proofImage}
                                                                    alt="Proof"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <div className="w-16 h-12 rounded-lg border border-dashed border-surface-200 flex items-center justify-center">
                                                                <span className="text-xs text-surface-300">None</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <button
                                                                onClick={() => handleApprove(item.taskId, userId)}
                                                                disabled={actionLoading === key}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all"
                                                            >
                                                                {actionLoading === key ? (
                                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                                                ) : (
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                )}
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectTarget({ taskId: item.taskId, userId })}
                                                                disabled={actionLoading === key}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold transition-all"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── Bottom panels: Intern Progress + Overdue ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Intern Progress */}
                        <div className="card">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
                                    {icons.users('w-4 h-4 text-brand-600')}
                                </div>
                                <h2 className="text-base font-bold text-surface-800">Intern Progress</h2>
                            </div>
                            {internProgress.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-2xl mb-2">👤</p>
                                    <p className="text-surface-400 text-sm">No intern data yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-surface-100">
                                                <th className="text-left pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Intern</th>
                                                <th className="text-center pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Assigned</th>
                                                <th className="text-center pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Completed</th>
                                                <th className="text-center pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Pending</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-50">
                                            {internProgress.map((intern) => {
                                                const rate = intern.assigned > 0
                                                    ? Math.round((intern.completed / intern.assigned) * 100)
                                                    : 0;
                                                return (
                                                    <tr key={intern.internId} className="hover:bg-surface-50/80">
                                                        <td className="py-3 pr-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold shrink-0">
                                                                    {(intern.internName || '?')[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-medium text-surface-800">{intern.internName}</p>
                                                                    <div className="w-20 h-1 rounded-full bg-surface-100 mt-1">
                                                                        <div
                                                                            className={`h-1 rounded-full ${rate >= 75 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                                                                            style={{ width: `${rate}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className="text-xs font-bold text-surface-700">{intern.assigned}</span>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className="text-xs font-bold text-emerald-600">{intern.completed}</span>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className={`text-xs font-bold ${intern.pending > 0 ? 'text-amber-600' : 'text-surface-400'}`}>{intern.pending}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Overdue Tasks */}
                        <div className="card">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h2 className="text-base font-bold text-surface-800">Overdue Tasks</h2>
                                {overdueTasks.length > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold ml-1">
                                        {overdueTasks.length}
                                    </span>
                                )}
                            </div>
                            {overdueTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-2xl mb-2">✅</p>
                                    <p className="text-surface-400 text-sm">No overdue tasks — great!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-surface-100">
                                                <th className="text-left pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Intern</th>
                                                <th className="text-left pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Task</th>
                                                <th className="text-right pb-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-50">
                                            {overdueTasks.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-red-50/50">
                                                    <td className="py-3 pr-4">
                                                        <p className="text-xs font-medium text-surface-800">{item.internName}</p>
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <p className="text-xs text-surface-600 max-w-[160px] truncate">{item.taskTitle}</p>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            {new Date(item.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
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

                                {/* Requires Proof Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-100">
                                    <div>
                                        <p className="text-xs font-semibold text-surface-700">Requires Proof Verification?</p>
                                        <p className="text-xs text-surface-400 mt-0.5">Intern must upload a screenshot for this task.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, requiresProof: !p.requiresProof }))}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.requiresProof ? 'bg-brand-600' : 'bg-surface-200'}`}
                                        role="switch"
                                        aria-checked={form.requiresProof}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${form.requiresProof ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>

                                {/* Assign Interns — Checkbox list */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="label mb-0">Assign Interns *</label>
                                        {interns.length > 0 && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm((p) => ({ ...p, assignedUsers: interns.map((i) => i._id) }))}
                                                    className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-surface-300 text-xs">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm((p) => ({ ...p, assignedUsers: [] }))}
                                                    className="text-xs text-surface-400 hover:text-surface-600 font-semibold"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {loadingChart ? (
                                        <div className="flex items-center gap-2 py-4 text-xs text-surface-400">
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                            Loading interns…
                                        </div>
                                    ) : interns.length === 0 ? (
                                        <p className="text-xs text-red-500 font-medium py-2">No interns found — make sure interns are registered.</p>
                                    ) : (
                                        <div className="rounded-xl border border-surface-100 bg-surface-50 p-3 space-y-1.5 max-h-48 overflow-y-auto">
                                            {interns.map((intern) => (
                                                <label key={intern._id} className={`flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg transition-colors ${form.assignedUsers.includes(intern._id) ? 'bg-brand-50 border border-brand-100' : 'hover:bg-white border border-transparent'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={form.assignedUsers.includes(intern._id)}
                                                        onChange={() => toggleIntern(intern._id)}
                                                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${form.assignedUsers.includes(intern._id) ? 'bg-brand-200 text-brand-800' : 'bg-violet-100 text-violet-700'}`}>
                                                            {(intern.name || '?')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-surface-800">{intern.name}</p>
                                                            {intern.email && <p className="text-xs text-surface-400">{intern.email}</p>}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {form.assignedUsers.length > 0 && (
                                        <p className="text-xs text-brand-600 mt-1.5 font-medium">
                                            ✓ {form.assignedUsers.length} intern{form.assignedUsers.length > 1 ? 's' : ''} selected
                                        </p>
                                    )}
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
                                <div className="flex justify-end pt-1">
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
