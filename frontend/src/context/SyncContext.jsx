import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/apiConfig';

export const SyncContext = createContext(0);

export const SyncProvider = ({ children }) => {
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    // Dinamik IP'yi alarak bağlan
    const socketUrl = SOCKET_URL;
    const socket = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[SyncContext] Connected to network sync server:', socket.id);
    });

    socket.on('dataChanged', () => {
      console.log('[SyncContext] Received dataChanged event, forcing UI refresh...');
      // Incrementing syncKey forces any useEffect depending on it to re-run
      setSyncKey(prev => prev + 1);
    });

    socket.on('disconnect', () => {
      console.log('[SyncContext] Disconnected from network sync server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SyncContext.Provider value={syncKey}>
      {children}
    </SyncContext.Provider>
  );
};
