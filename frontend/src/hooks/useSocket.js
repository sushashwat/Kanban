import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Pure app ke liye ek hi shared socket instance
let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, { autoConnect: true });
  }
  return socketInstance;
};

// Join the specific board room when a user opens/closes the board
export const useBoardRoom = (boardId) => {
  const socket = useRef(getSocket());

  useEffect(() => {
    if (!boardId) return;
    const s = socket.current;
    s.emit('joinBoard', boardId);

    return () => {
      s.emit('leaveBoard', boardId);
    };
  }, [boardId]);

  return socket.current;
};