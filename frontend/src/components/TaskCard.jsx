import { useState, useRef } from 'react';
import API from '../services/api';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',                badge: 'bg-amber-100 text-amber-700' },
    submitted: { label: 'Submitted for Approval', badge: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completed',              badge: 'bg-emerald-100 text-emerald-700' },
    rejected:  { label: 'Rejected',               badge: 'bg-red-100 text-red-600' },
};

// Small inline SVG icons
const IconPersonal = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const IconAssigned = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);
const IconCamera = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IconWarning = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);
const IconPending = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const IconSubmitted = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const IconCheck = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const IconX = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const STATUS_ICON = {
    pending:   <IconPending />,
    submitted: <IconSubmitted />,
    completed: <IconCheck />,
    rejected:  <IconX />,
};

export default function TaskCard({ task, userId, onComplete, onRefresh }) {
    const [uploading, setUploading] = useState(false);
    const [submittingProof, setSubmittingProof] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const assignment = task.assignments?.find((a) => {
        const id = a.user?._id || a.user?.toString?.() || a.user;
        return id === userId;
    });

    const status = assignment?.status || 'pending';
    const adminComment = assignment?.adminComment;
    const isCompleted = status === 'completed';
    const isRejected = status === 'rejected';
    const isSubmitted = status === 'submitted';
    const isPersonal = task.taskType === 'personal';
    const requiresProof = task.requiresProof;

    const deadlineDate = task.deadline ? new Date(task.deadline) : null;
    const deadlineStr = deadlineDate
        ? deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;
    const isOverdue = deadlineDate && !isCompleted && deadlineDate < new Date();

    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const [submitError, setSubmitError] = useState(null);

    const handleSubmitProof = async () => {
        if (!selectedFile) return;
        setSubmittingProof(true);
        setSubmitError(null);
        try {
            const formData = new FormData();
            formData.append('proof', selectedFile);
            await API.post(`/tasks/${task._id}/submit-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSelectedFile(null);
            setPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (onRefresh) onRefresh();
        } catch (err) {
            setSubmitError(err?.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setSubmittingProof(false);
        }
    };

    return (
        <div
            className={`bg-white rounded-xl border transition-all duration-200 flex flex-col gap-0 overflow-hidden
        ${isCompleted
                    ? 'border-emerald-100 shadow-sm opacity-75'
                    : isRejected
                        ? 'border-red-200 shadow-sm'
                        : 'border-surface-100 shadow-card hover:-translate-y-0.5 hover:shadow-md'
                }`}
        >
            {/* Top accent stripe */}
            <div className={`h-1 w-full ${isCompleted ? 'bg-emerald-400' :
                isRejected ? 'bg-red-400' :
                    isSubmitted ? 'bg-blue-400' :
                        isPersonal ? 'bg-blue-400' :
                            'bg-brand-500'
                }`} />

            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge text-xs gap-1 ${isPersonal ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                        {isPersonal ? <IconPersonal /> : <IconAssigned />}
                        {isPersonal ? 'Personal' : 'Assigned'}
                    </span>
                    <span className={`badge text-xs gap-1 ${cfg.badge}`}>
                        {STATUS_ICON[status]}
                        {cfg.label}
                    </span>
                    {requiresProof && !isPersonal && (
                        <span className="badge text-xs gap-1 bg-purple-100 text-purple-700">
                            <IconCamera />
                            Proof Required
                        </span>
                    )}
                    {isOverdue && !isCompleted && (
                        <span className="badge text-xs gap-1 bg-red-100 text-red-600">
                            <IconWarning />
                            Overdue
                        </span>
                    )}
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

                {/* Rejection comment */}
                {isRejected && adminComment && (
                    <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                        <p className="text-xs font-semibold text-red-700 mb-0.5">Admin Comment:</p>
                        <p className="text-xs text-red-600 leading-relaxed">{adminComment}</p>
                        <p className="text-xs text-red-400 mt-1.5">Please resubmit with a corrected screenshot.</p>
                    </div>
                )}

                {/* Submitted — awaiting review */}
                {isSubmitted && (
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-xs text-blue-600 font-medium">Awaiting admin review…</p>
                    </div>
                )}

                {/* Proof upload section */}
                {requiresProof && !isPersonal && !isCompleted && !isSubmitted && (
                    <div className="rounded-lg border border-surface-100 bg-surface-50 p-3 space-y-2">
                        <p className="text-xs font-semibold text-surface-700">Upload Screenshot</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="text-xs text-surface-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200 cursor-pointer w-full"
                        />
                        {preview && (
                            <div className="relative">
                                <img src={preview} alt="Preview" className="w-full h-24 object-cover rounded-lg border border-surface-100" />
                                <button
                                    onClick={() => { setSelectedFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                        {selectedFile && (
                            <button
                                onClick={handleSubmitProof}
                                disabled={submittingProof}
                                className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all"
                            >
                                {submittingProof ? (
                                    <>
                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        Submit Proof
                                    </>
                                )}
                            </button>
                        )}
                        {submitError && (
                            <p className="text-xs text-red-500 font-medium">{submitError}</p>
                        )}
                    </div>
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

                    {!isCompleted && !isSubmitted && (!requiresProof || isPersonal) && onComplete && (
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
