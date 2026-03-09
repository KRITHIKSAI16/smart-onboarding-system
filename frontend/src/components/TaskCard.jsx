export default function TaskCard({ task, userId, onComplete }) {
    const assignment = task.assignments?.find(
        (a) => {
            const id = a.user?._id || a.user?.toString?.() || a.user;
            return id === userId;
        }
    );
    const isCompleted = assignment?.status === 'completed';
    const isPersonal = task.taskType === 'personal';

    const deadlineDate = task.deadline ? new Date(task.deadline) : null;
    const deadlineStr = deadlineDate
        ? deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    const isOverdue = deadlineDate && !isCompleted && deadlineDate < new Date();

    return (
        <div
            className={`bg-white rounded-xl border transition-all duration-200 flex flex-col gap-0 overflow-hidden
        ${isCompleted
                    ? 'border-emerald-100 shadow-sm opacity-75'
                    : 'border-surface-100 shadow-card hover:-translate-y-0.5 hover:shadow-md'
                }`}
        >
            {/* Top accent stripe */}
            <div className={`h-1 w-full ${isCompleted ? 'bg-emerald-400' :
                    isPersonal ? 'bg-blue-400' :
                        'bg-brand-500'
                }`} />

            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge text-xs ${isPersonal
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-violet-100 text-violet-700'
                        }`}>
                        {isPersonal ? '🙋 Personal' : '📋 Assigned'}
                    </span>
                    <span className={`badge text-xs ${isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : isOverdue
                                ? 'bg-red-100 text-red-600'
                                : 'bg-amber-100 text-amber-700'
                        }`}>
                        {isCompleted ? '✓ Completed' : isOverdue ? '⚠ Overdue' : '⏳ Pending'}
                    </span>
                </div>

                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-bold leading-snug flex-1 ${isCompleted ? 'text-surface-400 line-through' : 'text-surface-800'}`}>
                        {task.title}
                    </h3>
                    {isCompleted && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Description */}
                {task.description && (
                    <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">{task.description}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t border-surface-50">
                    {deadlineStr ? (
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue && !isCompleted ? 'text-red-500' : 'text-surface-400'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {deadlineStr}
                        </div>
                    ) : (
                        <span className="text-xs text-surface-300">No deadline</span>
                    )}

                    {!isCompleted && onComplete && (
                        <button
                            onClick={() => onComplete(task._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all duration-150 shrink-0"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Complete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
