import React, { useState } from 'react';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';
import './TaskCard.css';
import axios from 'axios';

const TaskCard = ({ task, userId, onTaskUpdate }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    // The task.assignments array holds per-user status.
    // We find THIS intern's assignment to know if they've completed it.
    const myAssignment = task.assignments?.find(
        a => a.user === userId || a.user?._id === userId || a.user?.toString() === userId
    );
    const isCompleted = myAssignment?.status === 'completed';

    const handleComplete = async () => {
        if (isCompleted || isUpdating) return;
        setIsUpdating(true);
        try {
            // Correct endpoint: PUT /api/tasks/:taskId/complete
            await axios.put(`/api/tasks/${task._id}/complete`);
            if (onTaskUpdate) onTaskUpdate(task._id);
        } catch (error) {
            console.error('Failed to complete task:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Failed to mark task as complete.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className={`task-card glass-panel ${isCompleted ? 'completed' : ''}`}>
            <div className="task-content">
                <div className="task-type-badge">{task.taskType || 'admin'}</div>
                <h3 className="task-title">{task.title}</h3>
                {task.description && <p className="task-desc">{task.description}</p>}

                {task.deadline && (
                    <div className="task-meta">
                        <span className="deadline">
                            <Clock size={14} />
                            Due: {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                )}
            </div>

            <button
                className={`task-complete-btn ${isCompleted ? 'done' : ''}`}
                onClick={handleComplete}
                disabled={isCompleted || isUpdating}
                title={isCompleted ? 'Completed' : 'Mark as Complete'}
            >
                {isUpdating ? <Loader2 className="spinner" size={20} /> : <CheckCircle size={24} />}
            </button>

            {isCompleted && <div className="completion-overlay"></div>}
        </div>
    );
};

export default TaskCard;
