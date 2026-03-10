import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title }) {
    const { user, company } = useAuth();
    const [imgErr, setImgErr] = useState(false);

    const accentColor = company?.primaryColor || '#6366f1';

    const roleBadge =
        user?.role === 'super_admin' ? 'bg-amber-100 text-amber-700' :
        user?.role === 'admin'       ? 'bg-violet-100 text-violet-700' :
                                       'bg-emerald-100 text-emerald-700';

    const roleLabel =
        user?.role === 'super_admin' ? 'Super Admin' :
        user?.role === 'admin'       ? 'Admin' : 'Intern';

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-surface-100 shrink-0">
            <h1 className="text-lg font-bold text-surface-800">{title}</h1>

            <div className="flex items-center gap-3">
                {/* Company badge */}
                {company && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-surface-100 bg-surface-50">
                        {company.logo && !imgErr ? (
                            <img
                                src={company.logo}
                                alt={company.name}
                                className="w-4 h-4 object-contain"
                                onError={() => setImgErr(true)}
                            />
                        ) : (
                            <div className="w-4 h-4 rounded-sm flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: accentColor }}>
                                {company.name[0]}
                            </div>
                        )}
                        <span className="text-xs font-semibold text-surface-600">{company.name}</span>
                    </div>
                )}

                <span className={`badge capitalize ${roleBadge}`}>{roleLabel}</span>

                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase"
                        style={{ backgroundColor: accentColor }}
                    >
                        {user?.name?.[0] || 'U'}
                    </div>
                    <span className="text-sm font-medium text-surface-700 hidden sm:block">{user?.name}</span>
                </div>
            </div>
        </header>
    );
}
