/**
 * Standard socket event names used in the application.
 * Using a central file prevents typos and makes it easy for the client and server to stay in sync.
 */
export const SOCKET_EVENTS = {
  // Connection & Auth
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  ERROR: "error",

  // Presence tracking
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  PRESENCE_CHANGE: "presence:change",

  // Chat Rooms
  JOIN_CHAT: "chat:join",
  LEAVE_CHAT: "chat:leave",
  CHAT_DELETED: "chat:deleted",

  // Message Events
  MESSAGE_SEND: "message:send",         // Client -> Server
  MESSAGE_NEW: "message:new",           // Server -> Clients in room
  MESSAGE_EDITED: "message:edited",     // Server -> Clients in room
  MESSAGE_DELETED: "message:deleted",   // Server -> Clients in room
  MESSAGE_READ: "message:read",         // Server -> Clients in room
  REACTION_CHANGED: "reaction:change",  // Server -> Clients in room

  // Typing Status
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
