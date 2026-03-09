import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import InternDashboard from './pages/InternDashboard';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, requiredRole }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
    }
    return children;
}

function RoleRedirect() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute requiredRole="intern">
                        <InternDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<RoleRedirect />} />
        </Routes>
    );
}
