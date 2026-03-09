import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CheckSquare, LogOut, Users, Settings } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const { currentUser, logout } = useAuth();

    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="sidebar glass-panel">
            <div className="sidebar-header">
                <h2 className="title-gradient">OnboardFlow</h2>
                <div className="user-badge">
                    <span className="role-dot" data-role={currentUser?.role}></span>
                    {currentUser?.name || 'User'}
                </div>
            </div>

            <nav className="sidebar-nav">
                {isAdmin ? (
                    <>
                        <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/admin/interns" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Users size={20} />
                            <span>Interns</span>
                        </NavLink>
                        <NavLink to="/admin/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Settings size={20} />
                            <span>Settings</span>
                        </NavLink>
                    </>
                ) : (
                    <>
                        <NavLink to="/intern" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <LayoutDashboard size={20} />
                            <span>My Progress</span>
                        </NavLink>
                        <NavLink to="/intern/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <CheckSquare size={20} />
                            <span>Assigned Tasks</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item logout-btn" onClick={logout}>
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
