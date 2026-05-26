import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

// ── Credential Modal ────────────────────────────────────────────────────────
function CredentialModal({ creds, onClose }) {
    const [copied, setCopied] = useState('');
    const copy = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };
    const Row = ({ label, value, copyKey }) => (
        <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-amber-400/70 w-20 shrink-0 font-mono uppercase tracking-wider">{label}</span>
            <span className="text-xs font-mono font-semibold text-amber-100 flex-1 truncate">{value}</span>
            <button
                onClick={() => copy(value, copyKey)}
                className={`text-xs font-mono shrink-0 px-2 py-0.5 rounded border transition-all ${copied === copyKey
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-amber-500/10'
                    }`}
            >
                {copied === copyKey ? 'COPIED' : 'COPY'}
            </button>
        </div>
    );
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f0f0f] border border-amber-500/30 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
                style={{ boxShadow: '0 0 40px rgba(245, 158, 11, 0.15)' }}>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white font-mono">ACCOUNT CREATED</h3>
                        <p className="text-xs text-amber-400/60 font-mono">Share these credentials securely.</p>
                    </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 mb-4">
                    <Row label="Name" value={creds.name} copyKey="name" />
                    <Row label="Email" value={creds.email} copyKey="email" />
                    <Row label="Password" value={creds.password} copyKey="password" />
                    <Row label="Company" value={creds.company} copyKey="company" />
                </div>
                <p className="text-xs text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mb-4 font-mono">
                    ! User must change password on first login.
                </p>
                <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold font-mono transition-all"
                >
                    DONE
                </button>
            </div>
        </div>
    );
}

// ── Company Logo ──────────────────────────────────────────────────────────
function CompanyLogo({ company, size = 'md' }) {
    const [imgErr, setImgErr] = useState(false);
    const s = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
    if (company.logo && !imgErr) {
        return (
            <img
                src={company.logo}
                alt={company.name}
                className={`${s} rounded-lg object-contain bg-white/10 p-0.5 border border-white/10`}
                onError={() => setImgErr(true)}
            />
        );
    }
    return (
        <div
            className={`${s} rounded-lg flex items-center justify-center text-white font-bold shrink-0`}
            style={{ backgroundColor: company.primaryColor || '#f59e0b' }}
        >
            {company.name[0]}
        </div>
    );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ value, label, icon, accent = '#f59e0b' }) {
    return (
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03] p-5 flex flex-col gap-3 group hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]"
                    style={{ backgroundColor: `${accent}15` }}>
                    <span style={{ color: accent }}>{icon}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors" />
            </div>
            <div>
                <p className="text-3xl font-black text-white font-mono leading-none">{value ?? '—'}</p>
                <p className="text-xs text-white/40 font-mono uppercase tracking-widest mt-1.5">{label}</p>
            </div>
            {/* subtle glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `radial-gradient(circle at 0% 0%, ${accent}08 0%, transparent 60%)` }} />
        </div>
    );
}

// ── Terminal-style Section Header ─────────────────────────────────────────
function SectionHeader({ prompt, title, count }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <span className="text-amber-500 font-mono text-sm font-bold shrink-0">{prompt}</span>
            <h2 className="text-sm font-bold text-white/80 font-mono uppercase tracking-wider">{title}</h2>
            {count !== undefined && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-mono font-bold border border-amber-500/20">
                    {count}
                </span>
            )}
        </div>
    );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [companies, setCompanies] = useState([]);
    const [stats, setStats] = useState(null);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creds, setCreds] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [activeTab, setActiveTab] = useState('companies'); // 'companies' | 'create-company' | 'create-admin'

    const [companyForm, setCompanyForm] = useState({ name: '', domain: '', logo: '', primaryColor: '#f59e0b' });
    const [adminForm, setAdminForm] = useState({ name: '', companyId: '' });
    const [submittingCompany, setSubmittingCompany] = useState(false);
    const [submittingAdmin, setSubmittingAdmin] = useState(false);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

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
            showToast(`Company "${companyForm.name}" created successfully.`);
            setCompanyForm({ name: '', domain: '', logo: '', primaryColor: '#f59e0b' });
            setActiveTab('companies');
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
            setActiveTab('companies');
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

    const TABS = [
        { id: 'companies', label: 'Companies', prompt: '01' },
        { id: 'create-company', label: 'New Company', prompt: '02' },
        { id: 'create-admin', label: 'New Admin', prompt: '03' },
    ];

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── Credential Modal ── */}
            {creds && <CredentialModal creds={creds} onClose={() => setCreds(null)} />}

            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-5 right-5 z-40 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-mono font-semibold max-w-xs border transition-all
                    ${toast.type === 'error'
                        ? 'bg-red-950 border-red-500/30 text-red-300'
                        : 'bg-[#0f0f0f] border-emerald-500/30 text-emerald-300'
                    }`}
                    style={{ boxShadow: toast.type === 'error' ? '0 0 20px rgba(239,68,68,0.15)' : '0 0 20px rgba(16,185,129,0.15)' }}>
                    {toast.type !== 'error'
                        ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    }
                    {toast.msg}
                </div>
            )}

            {/* ── Top Bar ── */}
            <header className="shrink-0 border-b border-white/[0.06] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-sm font-black tracking-tight font-mono">SMARTONBOARD</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <span className="text-xs text-white/30 font-mono uppercase tracking-widest">PLATFORM CONTROL</span>
                </div>

                {/* Clock + User */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 text-right">
                        <div>
                            <p className="text-xs font-mono font-bold text-amber-400">{timeStr}</p>
                            <p className="text-[10px] font-mono text-white/30">{dateStr}</p>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-black text-xs font-black">
                            {user?.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-semibold text-white/80">{user?.name}</p>
                            <p className="text-[10px] text-white/30 font-mono">SUPER_ADMIN</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-white/40 hover:text-red-400 hover:border-red-500/30 font-mono transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        EXIT
                    </button>
                </div>
            </header>

            {/* ── Hero / Welcome ── */}
            <div className="shrink-0 px-6 py-8 border-b border-white/[0.04]"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, transparent 60%)' }}>
                <p className="text-xs font-mono text-amber-500/70 mb-2 tracking-widest">{'< PLATFORM OVERVIEW />'}</p>
                <h1 className="text-4xl font-black tracking-tight text-white leading-none mb-1">
                    Hello, <span className="text-amber-400">{user?.name?.split(' ')[0] || 'Admin'}</span>
                </h1>
                <p className="text-sm text-white/30 font-mono mt-2">Manage companies, admins, and monitor platform health.</p>

                {/* Stat row */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <StatCard
                        value={loading ? '...' : stats?.companies}
                        label="Companies"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        accent="#f59e0b"
                    />
                    <StatCard
                        value={loading ? '...' : stats?.admins}
                        label="Admins"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                        accent="#a78bfa"
                    />
                    <StatCard
                        value={loading ? '...' : stats?.interns}
                        label="Interns"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        accent="#34d399"
                    />
                </div>
            </div>

            {/* ── Main Body ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── Left: Tab Nav ── */}
                <nav className="shrink-0 w-48 border-r border-white/[0.06] py-6 px-3 flex flex-col gap-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group
                                ${activeTab === tab.id
                                    ? 'bg-amber-500/15 border border-amber-500/25 text-white'
                                    : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03] border border-transparent'
                                }`}
                        >
                            <span className={`text-[10px] font-mono font-bold shrink-0 transition-colors
                                ${activeTab === tab.id ? 'text-amber-400' : 'text-white/20 group-hover:text-white/40'}`}>
                                {tab.prompt}
                            </span>
                            <span className="text-xs font-mono font-semibold tracking-wide truncate">
                                {tab.label.toUpperCase()}
                            </span>
                        </button>
                    ))}

                    <div className="mt-auto pt-4 border-t border-white/[0.04]">
                        <div className="px-3 py-2">
                            <p className="text-[10px] text-white/20 font-mono uppercase tracking-wider mb-1">Platform</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ── Right: Content ── */}
                <main className="flex-1 overflow-y-auto p-6">

                    {/* ── TAB: Companies List ── */}
                    {activeTab === 'companies' && (
                        <div>
                            <SectionHeader prompt="$" title="All Companies" count={companies.length} />

                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
                                    ))}
                                </div>
                            ) : companies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                                        <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <p className="text-white/30 text-sm font-mono">NO COMPANIES YET</p>
                                    <p className="text-white/20 text-xs font-mono mt-1">Use tab 02 to create one</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {companies.map((co) => (
                                        <div key={co._id}
                                            className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-amber-500/20 transition-all duration-200">
                                            {/* Color dot + Logo */}
                                            <div className="relative shrink-0">
                                                <CompanyLogo company={co} size="md" />
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080808]"
                                                    style={{ backgroundColor: co.primaryColor || '#f59e0b' }} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white/90">{co.name}</p>
                                                <p className="text-xs text-white/30 font-mono">{co.domain || 'no domain'}</p>
                                            </div>

                                            {/* Counts */}
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-center">
                                                    <p className="text-sm font-black text-violet-400 font-mono">{co.adminCount ?? 0}</p>
                                                    <p className="text-[9px] text-white/20 font-mono uppercase tracking-wider">ADMINS</p>
                                                </div>
                                                <div className="w-px h-6 bg-white/[0.06]" />
                                                <div className="text-center">
                                                    <p className="text-sm font-black text-emerald-400 font-mono">{co.internCount ?? 0}</p>
                                                    <p className="text-[9px] text-white/20 font-mono uppercase tracking-wider">INTERNS</p>
                                                </div>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(co._id, co.name)}
                                                disabled={deletingId === co._id}
                                                className="shrink-0 w-8 h-8 rounded-lg border border-red-500/0 hover:border-red-500/30 hover:bg-red-500/10 flex items-center justify-center text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete company"
                                            >
                                                {deletingId === co._id
                                                    ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                                    : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                }
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quick action */}
                            <button
                                onClick={() => setActiveTab('create-company')}
                                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-amber-500/20 text-amber-500/50 hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5 text-xs font-mono font-semibold tracking-wider transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                ADD COMPANY
                            </button>
                        </div>
                    )}

                    {/* ── TAB: Create Company ── */}
                    {activeTab === 'create-company' && (
                        <div className="max-w-lg">
                            <SectionHeader prompt="$" title="Create Company" />

                            <form onSubmit={handleCreateCompany} className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-amber-400/70 uppercase tracking-widest mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={companyForm.name}
                                        onChange={(e) => setCompanyForm((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Google"
                                        className="sa-input"
                                    />
                                </div>

                                {/* Domain */}
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-amber-400/70 uppercase tracking-widest mb-2">
                                        Domain
                                    </label>
                                    <input
                                        type="text"
                                        value={companyForm.domain}
                                        onChange={(e) => setCompanyForm((p) => ({ ...p, domain: e.target.value }))}
                                        placeholder="e.g. google.onboard"
                                        className="sa-input"
                                    />
                                    <p className="text-[10px] font-mono text-white/20 mt-1.5">
                                        Intern emails will be: {'<firstname>@' + (companyForm.domain || 'domain')}
                                    </p>
                                </div>

                                {/* Logo URL */}
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-amber-400/70 uppercase tracking-widest mb-2">
                                        Logo URL
                                    </label>
                                    <input
                                        type="url"
                                        value={companyForm.logo}
                                        onChange={(e) => setCompanyForm((p) => ({ ...p, logo: e.target.value }))}
                                        placeholder="https://..."
                                        className="sa-input"
                                    />
                                </div>

                                {/* Brand Color */}
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-amber-400/70 uppercase tracking-widest mb-2">
                                        Brand Color
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={companyForm.primaryColor}
                                                onChange={(e) => setCompanyForm((p) => ({ ...p, primaryColor: e.target.value }))}
                                                className="w-12 h-10 rounded-lg border border-white/10 bg-white/5 cursor-pointer p-0.5 appearance-none"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={companyForm.primaryColor}
                                            onChange={(e) => setCompanyForm((p) => ({ ...p, primaryColor: e.target.value }))}
                                            className="sa-input flex-1 font-mono"
                                            placeholder="#f59e0b"
                                        />
                                        {/* Live swatch preview */}
                                        <div className="w-10 h-10 rounded-lg border border-white/10 shrink-0 flex items-center justify-center text-white text-xs font-black"
                                            style={{ backgroundColor: companyForm.primaryColor }}>
                                            {companyForm.name?.[0]?.toUpperCase() || 'A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setActiveTab('companies')}
                                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/[0.03] text-xs font-mono font-bold transition-all">
                                        CANCEL
                                    </button>
                                    <button type="submit" disabled={submittingCompany}
                                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-mono font-black transition-all">
                                        {submittingCompany ? 'CREATING...' : 'CREATE COMPANY'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── TAB: Create Admin ── */}
                    {activeTab === 'create-admin' && (
                        <div className="max-w-lg">
                            <SectionHeader prompt="$" title="Create Company Admin" />

                            <form onSubmit={handleCreateAdmin} className="space-y-5">
                                {/* Admin Name */}
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-amber-400/70 uppercase tracking-widest mb-2">
                                        Admin Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={adminForm.name}
                                        onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. HR Manager"
                                        className="sa-input"
                                    />
                                </div>

                                {/* Company Select */}
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-amber-400/70 uppercase tracking-widest mb-2">
                                        Company *
                                    </label>
                                    <select
                                        required
                                        value={adminForm.companyId}
                                        onChange={(e) => setAdminForm((p) => ({ ...p, companyId: e.target.value }))}
                                        className="sa-input"
                                    >
                                        <option value="">Select a company...</option>
                                        {companies.map((co) => (
                                            <option key={co._id} value={co._id}>{co.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Credentials preview */}
                                {adminForm.companyId && (() => {
                                    const co = companies.find((c) => c._id === adminForm.companyId);
                                    if (!co) return null;
                                    const domain = co.domain || `${co.name.toLowerCase().replace(/\s+/g, '')}.onboard`;
                                    return (
                                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
                                            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Generated Credentials Preview</p>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5 text-amber-400/60 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                <span className="text-xs font-mono text-white/60">admin@{domain}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5 text-amber-400/60 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                <span className="text-xs font-mono text-white/60">Temp@123 (must change on login)</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setActiveTab('companies')}
                                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/[0.03] text-xs font-mono font-bold transition-all">
                                        CANCEL
                                    </button>
                                    <button type="submit" disabled={submittingAdmin}
                                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-mono font-black transition-all">
                                        {submittingAdmin
                                            ? <span className="flex items-center justify-center gap-2">
                                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                                CREATING...
                                              </span>
                                            : 'CREATE ADMIN'
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </main>
            </div>

            {/* Inline styles for sa-input */}
            <style>{`
                .sa-input {
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    border-radius: 0.625rem;
                    border: 1px solid rgba(255,255,255,0.08);
                    background-color: rgba(255,255,255,0.03);
                    font-size: 0.8125rem;
                    color: rgba(255,255,255,0.85);
                    font-family: 'Inter', system-ui, sans-serif;
                    outline: none;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }
                .sa-input::placeholder {
                    color: rgba(255,255,255,0.2);
                }
                .sa-input:focus {
                    border-color: rgba(245,158,11,0.5);
                    box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
                }
                .sa-input option {
                    background-color: #111;
                    color: #fff;
                }
            `}</style>
        </div>
    );
}
