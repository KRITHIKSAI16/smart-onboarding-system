import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminLinks = [
    {
        to: '/super-admin',
        label: 'Platform',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    },
];

const AdminLinks = [
    {
        to: '/admin',
        label: 'Dashboard',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
        to: '/chat',
        label: 'Messages',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    },
];

const InternLinks = [
    {
        to: '/dashboard',
        label: 'My Tasks',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
        to: '/chat',
        label: 'Messages',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    },
    {
        to: '/forum',
        label: 'Forum',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
    },
];

function CompanyLogo({ company, size = 8 }) {
    const [imgErr, setImgErr] = useState(false);
    const cls = `w-${size} h-${size} rounded-lg`;
    if (company?.logo && !imgErr) {
        return (
            <img
                src={company.logo}
                alt={company.name}
                className={`${cls} object-contain bg-white p-0.5 border border-white/20`}
                onError={() => setImgErr(true)}
            />
        );
    }
    return (
        <div
            className={`${cls} flex items-center justify-center text-white text-xs font-bold shrink-0`}
            style={{ backgroundColor: company?.primaryColor || '#6366f1' }}
        >
            {company?.name?.[0] || 'S'}
        </div>
    );
}

export default function Sidebar() {
    const { user, isAdmin, isSuperAdmin, company, logout } = useAuth();
    const navigate = useNavigate();

    const links = isSuperAdmin ? SuperAdminLinks : isAdmin ? AdminLinks : InternLinks;
    const accentColor = company?.primaryColor || '#6366f1';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="flex flex-col w-64 min-h-screen bg-surface-900 text-white shrink-0">
            {/* Logo / Company Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-800">
                {company ? (
                    <CompanyLogo company={company} size={8} />
                ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-glow" style={{ backgroundColor: accentColor }}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                )}
                <div>
                    <p className="text-sm font-bold leading-tight">{company?.name || 'SmartOnboard'}</p>
                    <p className="text-[10px] text-surface-400 capitalize">{user?.role?.replace('_', ' ') || 'Portal'}</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                ? 'text-white shadow-glow'
                                : 'text-surface-400 hover:text-white hover:bg-surface-800'
                            }`
                        }
                        style={({ isActive }) => isActive ? { backgroundColor: accentColor } : {}}
                    >
                        {link.icon}
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            {/* User + Logout */}
            <div className="px-3 py-4 border-t border-surface-800 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 text-white"
                        style={{ backgroundColor: accentColor }}
                    >
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-[10px] text-surface-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-surface-400 hover:text-red-400 hover:bg-surface-800 transition-all duration-150"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                </button>
            </div>
        </aside>
    );
}
