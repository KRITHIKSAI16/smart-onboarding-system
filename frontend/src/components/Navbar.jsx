import { useAuth } from '../context/AuthContext';

export default function Navbar({ title }) {
    const { user } = useAuth();

    const roleBadge = user?.role === 'admin'
        ? 'bg-violet-100 text-violet-700'
        : 'bg-emerald-100 text-emerald-700';

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-surface-100 shrink-0">
            <h1 className="text-lg font-bold text-surface-800">{title}</h1>
            <div className="flex items-center gap-3">
                <span className={`badge ${roleBadge} capitalize`}>{user?.role}</span>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <span className="text-sm font-medium text-surface-700 hidden sm:block">{user?.name}</span>
                </div>
            </div>
        </header>
    );
}
