import { createContext, useContext, useState, useCallback } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);

    const saveSession = (userData, tokenData) => {
        setUser(userData);
        setToken(tokenData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', tokenData);
    };

    const login = useCallback(async (email, password) => {
        const res = await API.post('/auth/login', { email, password });
        const { user: userData, token: tokenData } = res.data;
        saveSession(userData, tokenData);
        return userData;
    }, []);

    const register = useCallback(async (name, email, password, role) => {
        await API.post('/auth/register', { name, email, password, role });
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }, []);

    const changePassword = useCallback(async (newPassword) => {
        await API.put('/auth/change-password', { newPassword });
        // Clear the flag locally so redirect doesn't loop
        setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, mustChangePassword: false };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const isAdmin      = user?.role === 'admin';
    const isSuperAdmin = user?.role === 'super_admin';
    const company      = user?.company || null;

    return (
        <AuthContext.Provider value={{
            user, token, login, register, logout,
            changePassword, isAdmin, isSuperAdmin, company,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
