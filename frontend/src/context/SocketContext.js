/**
 * Socket Context
 * Manages WebSocket connections for real-time updates
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const socketUrl = process.env.REACT_APP_SERVER_URL || 
                       (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000');
      
      const newSocket = io(socketUrl, {
        auth: {
          userId: user._id,
          role: user.role
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
        
        // Join appropriate rooms based on user role
        if (user.role === 'doctor' || user.role === 'hospital_admin') {
          if (user.hospitalId) {
            const hospitalId = typeof user.hospitalId === 'object' ? user.hospitalId._id : user.hospitalId;
            console.log('Doctor/Admin joining hospital room:', `hospital-${hospitalId}`);
            newSocket.emit('join-hospital', hospitalId);
          }
        }
        
        if (user.role === 'doctor') {
          const doctorId = user._id;
          console.log('Doctor joining doctor room:', `doctor-${doctorId}`);
          newSocket.emit('join-doctor', doctorId);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      // Listen for real-time updates
      newSocket.on('new-appointment', (data) => {
        toast.success(data.message);
      });

      newSocket.on('appointment-updated', (data) => {
        toast(data.message, {
          icon: 'ℹ️',
          style: {
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd'
          }
        });
      });

      newSocket.on('appointment-cancelled', (data) => {
        toast.error(data.message);
      });

      newSocket.on('queue-updated', (data) => {
        // Handle queue updates
        console.log('Queue updated:', data);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  // Close existing socket when user logs out
  useEffect(() => {
    if (!isAuthenticated && socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [isAuthenticated, socket]);

  // Join hospital room
  const joinHospitalRoom = (hospitalId) => {
    if (socket && connected) {
      socket.emit('join-hospital', hospitalId);
    }
  };

  // Join doctor room
  const joinDoctorRoom = (doctorId) => {
    if (socket && connected) {
      socket.emit('join-doctor', doctorId);
    }
  };

  // Emit custom events
  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  // Listen for custom events
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Remove event listeners
  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    joinHospitalRoom,
    joinDoctorRoom,
    emit,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};