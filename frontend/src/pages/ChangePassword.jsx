import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function ChangePassword() {
    const { changePassword, logout } = useAuth();
    const navigate = useNavigate();
    const [form, setForm]     = useState({ newPassword: '', confirm: '' });
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (form.newPassword !== form.confirm) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await changePassword(form.newPassword);
            // Re-read user role from localStorage to determine redirect
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'super_admin') navigate('/super-admin', { replace: true });
            else if (user.role === 'admin')  navigate('/admin',       { replace: true });
            else                             navigate('/dashboard',   { replace: true });
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-900 via-surface-900 to-surface-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `linear-gradient(rgba(99,102,241,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.5) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />

            <div className="relative w-full max-w-md animate-slide-up">
                {/* Icon */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">Set New Password</h1>
                    <p className="text-surface-400 mt-1 text-sm">Your account requires a password change before continuing.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">New Password</label>
                            <input
                                type="password"
                                value={form.newPassword}
                                onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                                placeholder="Minimum 6 characters"
                                required
                                minLength={6}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Confirm Password</label>
                            <input
                                type="password"
                                value={form.confirm}
                                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                                placeholder="Re-enter password"
                                required
                                className="input"
                            />
                        </div>

                        {/* Password strength hint */}
                        {form.newPassword && (
                            <div className="flex gap-1 mt-1">
                                {[1,2,3,4].map((i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                        form.newPassword.length >= i * 3
                                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-yellow-400' : 'bg-emerald-500'
                                            : 'bg-surface-100'
                                    }`} />
                                ))}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center py-3"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                    Saving…
                                </>
                            ) : 'Set Password & Continue'}
                        </button>
                    </form>

                    <button
                        onClick={() => { logout(); navigate('/login', { replace: true }); }}
                        className="mt-4 w-full text-center text-xs text-surface-400 hover:text-surface-600"
                    >
                        Sign out instead
                    </button>
                </div>
            </div>
        </div>
    );
}
