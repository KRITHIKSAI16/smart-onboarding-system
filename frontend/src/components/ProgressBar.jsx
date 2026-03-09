import React, { useEffect, useState } from 'react';
import './ProgressBar.css';

const ProgressBar = ({ total, completed }) => {
    const [width, setWidth] = useState(0);

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    useEffect(() => {
        // Add a slight delay for the animation effect on mount/update
        const timer = setTimeout(() => {
            setWidth(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    return (
        <div className="progress-container glass-panel">
            <div className="progress-header">
                <h3 className="progress-title">Onboarding Progress</h3>
                <span className="progress-text">{percentage}% Fully Completed</span>
            </div>

            <div className="progress-track">
                <div
                    className="progress-fill"
                    style={{ width: `${width}%` }}
                >
                    {width > 10 && <div className="progress-glow"></div>}
                </div>
            </div>

            <div className="progress-stats">
                <span>{completed} Completed</span>
                <span>{total - completed} Pending</span>
            </div>
        </div>
    );
};

export default ProgressBar;
