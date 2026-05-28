import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login              from './pages/Login';
import Register           from './pages/Register';
import InternDashboard    from './pages/InternDashboard';
import AdminDashboard     from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ChangePassword     from './pages/ChangePassword';
import ChatPage           from './pages/ChatPage';
import ForumPage          from './pages/ForumPage';

function ProtectedRoute({ children, requiredRole }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;

    const isAdminLike = user.role === 'admin' || user.role === 'super_admin';

    // Force password change on first login
    if (user.mustChangePassword && window.location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    if (requiredRole === 'admin'       && !isAdminLike)          return <Navigate to="/dashboard"   replace />;
    if (requiredRole === 'super_admin' && user.role !== 'super_admin') return <Navigate to="/admin" replace />;
    if (requiredRole === 'intern'      && user.role !== 'intern') return <Navigate to="/admin"      replace />;

    return children;
}

function RoleRedirect() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
    if (user.role === 'super_admin') return <Navigate to="/super-admin" replace />;
    if (user.role === 'admin')       return <Navigate to="/admin"       replace />;
    return <Navigate to="/dashboard" replace />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/change-password" element={<ChangePassword />} />

            <Route
                path="/super-admin"
                element={
                    <ProtectedRoute requiredRole="super_admin">
                        <SuperAdminDashboard />
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
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute requiredRole="intern">
                        <InternDashboard />
                    </ProtectedRoute>
                }
            />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute requiredRole="intern"><ForumPage /></ProtectedRoute>} />
            <Route path="*" element={<RoleRedirect />} />
        </Routes>
    );
}
