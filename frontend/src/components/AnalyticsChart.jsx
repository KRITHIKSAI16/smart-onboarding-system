import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface-900 text-white rounded-xl px-4 py-3 shadow-2xl text-xs space-y-1.5 border border-surface-700">
            <p className="font-bold text-sm mb-2 text-surface-100">{label}</p>
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                        <span className="text-surface-300 capitalize">{entry.name}</span>
                    </span>
                    <span className="font-bold text-white">{entry.value}</span>
                </div>
            ))}
            {payload[0] && (
                <div className="pt-1.5 mt-1 border-t border-surface-700 flex justify-between">
                    <span className="text-surface-400">Completion</span>
                    <span className="font-bold text-emerald-400">
                        {payload[0].payload.assigned > 0
                            ? Math.round((payload[0].payload.completed / payload[0].payload.assigned) * 100)
                            : 0}%
                    </span>
                </div>
            )}
        </div>
    );
};

export default function AnalyticsChart({ data }) {
    if (!data?.length) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <p className="text-surface-400 text-sm">No analytics data available yet</p>
            </div>
        );
    }

    // Deduplicate by task title — keep the most-assigned version
    const dedupedMap = new Map();
    data.forEach((d) => {
        const existing = dedupedMap.get(d.task);
        if (!existing || d.assigned > existing.assigned) {
            dedupedMap.set(d.task, d);
        }
    });
    const deduped = Array.from(dedupedMap.values());

    const chartData = deduped.map((d) => ({
        ...d,
        name: d.task?.length > 20 ? d.task.slice(0, 18) + '…' : d.task,
        fullName: d.task,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, left: -10, bottom: 55 }}
                barGap={4}
                barCategoryGap="35%"
            >
                <defs>
                    <linearGradient id="gradAssigned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={60}
                />
                <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 6 }} />
                <Legend
                    wrapperStyle={{ paddingTop: 12, fontSize: 12, fontFamily: 'Inter' }}
                    iconType="circle"
                    iconSize={8}
                />
                <Bar dataKey="assigned" name="Assigned" fill="url(#gradAssigned)" radius={[5, 5, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="url(#gradCompleted)" radius={[5, 5, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="url(#gradPending)" radius={[5, 5, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
