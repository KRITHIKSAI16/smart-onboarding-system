import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

// ── Credential display card ────────────────────────────────────────────────
function CredentialCard({ creds, onClose }) {
    const [copied, setCopied] = useState('');
    const copy = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };
    const Row = ({ label, value, copyKey }) => (
        <div className="flex items-center justify-between gap-3 py-2 border-b border-surface-50 last:border-0">
            <span className="text-xs text-surface-500 w-20 shrink-0">{label}</span>
            <span className="text-xs font-mono font-semibold text-surface-800 flex-1 truncate">{value}</span>
            <button
                onClick={() => copy(value, copyKey)}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium shrink-0"
            >
                {copied === copyKey ? '✓ Copied' : 'Copy'}
            </button>
        </div>
    );
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-surface-800">Account Created!</h3>
                        <p className="text-xs text-surface-400">Share these credentials securely.</p>
                    </div>
                </div>
                <div className="rounded-xl bg-surface-50 border border-surface-100 p-3 mb-4">
                    <Row label="Name"     value={creds.name}     copyKey="name"     />
                    <Row label="Email"    value={creds.email}    copyKey="email"    />
                    <Row label="Password" value={creds.password} copyKey="password" />
                    <Row label="Company"  value={creds.company}  copyKey="company"  />
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 mb-4">
                    ⚠ User must change password on first login.
                </p>
                <button onClick={onClose} className="btn-primary w-full justify-center">Done</button>
            </div>
        </div>
    );
}

// ── Company logo with fallback ────────────────────────────────────────────
function CompanyLogo({ company }) {
    const [imgErr, setImgErr] = useState(false);
    if (company.logo && !imgErr) {
        return (
            <img
                src={company.logo}
                alt={company.name}
                className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-surface-100"
                onError={() => setImgErr(true)}
            />
        );
    }
    return (
        <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: company.primaryColor || '#6366f1' }}
        >
            {company.name[0]}
        </div>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ value, label, color, icon }) {
    return (
        <div className={`rounded-xl p-4 flex items-center gap-4 border ${color.bg} ${color.border}`}>
            <div className={`w-10 h-10 rounded-xl ${color.iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
            <div>
                <p className={`text-2xl font-extrabold ${color.text}`}>{value ?? '—'}</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [companies, setCompanies]    = useState([]);
    const [stats, setStats]            = useState(null);
    const [toast, setToast]            = useState(null);
    const [loading, setLoading]        = useState(true);
    const [creds, setCreds]            = useState(null);          // generated credentials to show
    const [deletingId, setDeletingId]  = useState(null);

    // Forms
    const [companyForm, setCompanyForm] = useState({ name: '', domain: '', logo: '', primaryColor: '#6366f1' });
    const [adminForm,   setAdminForm]   = useState({ name: '', companyId: '' });
    const [submittingCompany, setSubmittingCompany] = useState(false);
    const [submittingAdmin,   setSubmittingAdmin]   = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchAll = useCallback(async () => {
        try {
            const [compRes, statsRes] = await Promise.all([
                API.get('/companies'),
                API.get('/auth/platform-stats'),
            ]);
            setCompanies(compRes.data);
            setStats(statsRes.data);
        } catch {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        setSubmittingCompany(true);
        try {
            await API.post('/companies', companyForm);
            showToast(`Company "${companyForm.name}" created! 🏢`);
            setCompanyForm({ name: '', domain: '', logo: '', primaryColor: '#6366f1' });
            await fetchAll();
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to create company', 'error');
        } finally {
            setSubmittingCompany(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setSubmittingAdmin(true);
        try {
            const res = await API.post('/auth/create-admin', adminForm);
            setCreds(res.data.credentials);
            setAdminForm({ name: '', companyId: '' });
            await fetchAll();
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to create admin', 'error');
        } finally {
            setSubmittingAdmin(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setDeletingId(id);
        try {
            await API.delete(`/companies/${id}`);
            showToast(`"${name}" deleted.`);
            await fetchAll();
        } catch {
            showToast('Failed to delete company', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-surface-50">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar title="Super Admin — Platform Control" />

                {/* Modals */}
                {creds && <CredentialCard creds={creds} onClose={() => setCreds(null)} />}

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-slide-up max-w-xs ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-surface-900 text-white'}`}>
                        {toast.type !== 'error' && <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        {toast.msg}
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Platform Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            value={stats?.companies}
                            label="Companies"
                            color={{ bg: 'bg-brand-50', border: 'border-brand-100', iconBg: 'bg-brand-100', text: 'text-brand-700' }}
                            icon={<svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        />
                        <StatCard
                            value={stats?.admins}
                            label="Admins"
                            color={{ bg: 'bg-violet-50', border: 'border-violet-100', iconBg: 'bg-violet-100', text: 'text-violet-700' }}
                            icon={<svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                        />
                        <StatCard
                            value={stats?.interns}
                            label="Interns"
                            color={{ bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', text: 'text-emerald-700' }}
                            icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        />
                    </div>

                    {/* Main grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Companies list — 3 cols */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="card">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    </div>
                                    <h2 className="text-base font-bold text-surface-800">Companies</h2>
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold ml-1">{companies.length}</span>
                                </div>

                                {loading ? (
                                    <div className="space-y-3">
                                        {[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-surface-100 animate-pulse" />)}
                                    </div>
                                ) : companies.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-2xl mb-2">🏢</p>
                                        <p className="text-surface-400 text-sm">No companies yet. Create one below.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {companies.map((co) => (
                                            <div key={co._id} className="flex items-center gap-3 p-3 rounded-xl border border-surface-100 bg-white hover:bg-surface-50 transition-colors">
                                                <CompanyLogo company={co} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-surface-800 truncate">{co.name}</p>
                                                    <p className="text-xs text-surface-400">{co.domain || '—'}</p>
                                                </div>
                                                {/* Color swatch */}
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 rounded-full border border-surface-200" style={{ backgroundColor: co.primaryColor }} />
                                                </div>
                                                {/* Counts */}
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-violet-700">{co.adminCount ?? 0}</p>
                                                        <p className="text-[10px] text-surface-400">admins</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-emerald-700">{co.internCount ?? 0}</p>
                                                        <p className="text-[10px] text-surface-400">interns</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(co._id, co.name)}
                                                    disabled={deletingId === co._id}
                                                    className="shrink-0 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                                                    title="Delete company"
                                                >
                                                    {deletingId === co._id
                                                        ? <svg className="w-3.5 h-3.5 animate-spin text-red-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                                        : <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    }
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Create Company Form */}
                            <div className="card border-2 border-dashed border-surface-200 bg-surface-50/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    </div>
                                    <h3 className="text-sm font-bold text-surface-700">Create Company</h3>
                                </div>
                                <form onSubmit={handleCreateCompany} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Company Name *</label>
                                        <input type="text" required value={companyForm.name}
                                            onChange={(e) => setCompanyForm((p) => ({ ...p, name: e.target.value }))}
                                            placeholder="e.g. Google" className="input" />
                                    </div>
                                    <div>
                                        <label className="label">Domain</label>
                                        <input type="text" value={companyForm.domain}
                                            onChange={(e) => setCompanyForm((p) => ({ ...p, domain: e.target.value }))}
                                            placeholder="e.g. google.onboard" className="input" />
                                    </div>
                                    <div>
                                        <label className="label">Logo URL</label>
                                        <input type="url" value={companyForm.logo}
                                            onChange={(e) => setCompanyForm((p) => ({ ...p, logo: e.target.value }))}
                                            placeholder="https://..." className="input" />
                                    </div>
                                    <div>
                                        <label className="label">Brand Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={companyForm.primaryColor}
                                                onChange={(e) => setCompanyForm((p) => ({ ...p, primaryColor: e.target.value }))}
                                                className="h-10 w-12 rounded-lg border border-surface-200 cursor-pointer p-0.5" />
                                            <input type="text" value={companyForm.primaryColor}
                                                onChange={(e) => setCompanyForm((p) => ({ ...p, primaryColor: e.target.value }))}
                                                className="input flex-1" />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2 flex justify-end">
                                        <button type="submit" disabled={submittingCompany} className="btn-primary">
                                            {submittingCompany ? 'Creating…' : '+ Create Company'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Create Admin panel — 2 cols */}
                        <div className="lg:col-span-2 card flex flex-col">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                </div>
                                <h2 className="text-base font-bold text-surface-800">Create Company Admin</h2>
                            </div>

                            <form onSubmit={handleCreateAdmin} className="space-y-4 flex-1">
                                <div>
                                    <label className="label">Admin Name *</label>
                                    <input type="text" required value={adminForm.name}
                                        onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. HR Manager" className="input" />
                                </div>
                                <div>
                                    <label className="label">Company *</label>
                                    <select required value={adminForm.companyId}
                                        onChange={(e) => setAdminForm((p) => ({ ...p, companyId: e.target.value }))}
                                        className="input"
                                    >
                                        <option value="">Select a company…</option>
                                        {companies.map((co) => (
                                            <option key={co._id} value={co._id}>{co.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Email preview */}
                                {adminForm.companyId && (() => {
                                    const co = companies.find((c) => c._id === adminForm.companyId);
                                    if (!co) return null;
                                    const domain = co.domain || `${co.name.toLowerCase().replace(/\s+/g, '')}.onboard`;
                                    return (
                                        <div className="rounded-xl bg-surface-50 border border-surface-100 p-3 space-y-1">
                                            <p className="text-xs text-surface-500 font-medium">Generated credentials preview</p>
                                            <p className="text-xs font-mono text-surface-800">📧 admin@{domain}</p>
                                            <p className="text-xs font-mono text-surface-800">🔑 Temp@123</p>
                                        </div>
                                    );
                                })()}

                                <div className="mt-auto pt-2">
                                    <button type="submit" disabled={submittingAdmin} className="btn-primary w-full justify-center">
                                        {submittingAdmin ? (
                                            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Creating…</>
                                        ) : 'Create Admin & Get Credentials'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
