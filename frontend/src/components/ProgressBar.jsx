export default function ProgressBar({ progress, label }) {
    // Accept "75%" string or number 75
    const raw = typeof progress === 'string' ? parseFloat(progress) : progress;
    const pct = isNaN(raw) ? 0 : Math.min(Math.max(raw, 0), 100);

    const color =
        pct >= 80 ? 'from-emerald-500 to-emerald-400' :
            pct >= 50 ? 'from-brand-500 to-brand-400' :
                pct >= 25 ? 'from-amber-500 to-amber-400' :
                    'from-red-500 to-red-400';

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-surface-600">{label || 'Progress'}</span>
                <span className="text-sm font-bold text-surface-800">{pct}%</span>
            </div>
            <div className="h-3 w-full bg-surface-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
