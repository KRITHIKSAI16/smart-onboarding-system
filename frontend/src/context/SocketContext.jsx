import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token || !user) {
            // Disconnect if logged out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
                setOnlineUsers([]);
            }
            return;
        }

        // Don't connect for super_admin
        if (user.role === 'super_admin') return;

        // Connect
        const newSocket = io('http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('[Socket] Connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        // Online users tracking
        newSocket.on('online-users', (users) => {
            setOnlineUsers(users);
        });

        newSocket.on('user-online', ({ userId }) => {
            setOnlineUsers((prev) => [...new Set([...prev, userId])]);
        });

        newSocket.on('user-offline', ({ userId }) => {
            setOnlineUsers((prev) => prev.filter((id) => id !== userId));
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
        };
    }, [token, user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
