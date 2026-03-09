import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import InternDashboard from './pages/InternDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/intern'} replace />;
    }

    return children;
};

function AppRoutes() {
    const { currentUser } = useAuth();

    return (
        <Routes>
            <Route path="/" element={
                currentUser ? (
                    <Navigate to={currentUser.role === 'admin' ? '/admin' : '/intern'} replace />
                ) : (
                    <Login />
                )
            } />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/intern"
                element={
                    <ProtectedRoute allowedRoles={['intern']}>
                        <InternDashboard />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="app-container">
                    <AppRoutes />
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
