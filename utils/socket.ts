import { io } from 'socket.io-client';

const API_URL = 'http://192.168.244.128:9000/';

let socketInstance: any = null;

export const initializeSocket = (token: string) => {
  if (!socketInstance) {
    socketInstance = io(API_URL, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
};

export const getSocket = () => {
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

// Chat related socket functions
export const joinChat = (chatId: string) => {
  const socket = getSocket();
  socket.emit('join-chat', { chatId });
};

export const leaveChat = (chatId: string) => {
  const socket = getSocket();
  socket.emit('leave-chat', { chatId });
};

export const sendMessage = (chatId: string, message: string) => {
  const socket = getSocket();
  socket.emit('send-message', { chatId, message });
};

export const onMessageReceived = (callback: (message: any) => void) => {
  const socket = getSocket();
  socket.on('message-received', callback);
};

export const onUserJoined = (callback: (user: any) => void) => {
  const socket = getSocket();
  socket.on('user-joined', callback);
};

export const onUserLeft = (callback: (user: any) => void) => {
  const socket = getSocket();
  socket.on('user-left', callback);
};

export const onTyping = (callback: (data: { userId: string; isTyping: boolean }) => void) => {
  const socket = getSocket();
  socket.on('typing', callback);
};

export const emitTyping = (chatId: string, isTyping: boolean) => {
  const socket = getSocket();
  socket.emit('typing', { chatId, isTyping });
};

export const removeAllListeners = () => {
  const socket = getSocket();
  socket.removeAllListeners();
}; 