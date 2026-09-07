import { io } from "socket.io-client";

// =====================================================
// SOCKET.IO URL
// =====================================================
const getSocketUrl = () => {
  const configured = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_WS_URL;

  if (configured) {
    return String(configured)
      .trim()
      .replace(/^ws:\/\//i, "http://")
      .replace(/^wss:\/\//i, "https://")
      .replace(/\/+$/, "")
      .replace(/\/ws$/i, "")
      .replace(/\/socket\.io$/i, "");
  }

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `http://${window.location.hostname}:5007`;
  }

  return window.location.origin;
};

// =====================================================
// SOCKET.IO PATH
// =====================================================
const SOCKET_PATH = import.meta.env.VITE_SOCKET_IO_PATH || "/ws";

let socket = null;
let shouldReconnect = true;
const listeners = new Set();

const notify = (event, data = {}) => {
  const payload = {
    event,
    ...(data && typeof data === "object" ? data : { data }),
  };

  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      console.error("❌ Socket listener error:", error);
    }
  });
};

const connect = () => {
  if (!shouldReconnect || typeof window === "undefined") return;
  if (socket?.connected) return;
  if (socket?.active) return;

  const url = getSocketUrl();
  console.log(`🔌 Connecting Socket.IO: ${url}${SOCKET_PATH}`);

  socket = io(url, {
    path: SOCKET_PATH,
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log(`✅ Socket.IO connected | id=${socket.id} | transport=${socket.io.engine.transport.name}`);
    notify("socketStatus", {
      status: "connected",
      socketId: socket.id,
      transport: socket.io.engine.transport.name,
    });
  });

  socket.io.engine.on("upgrade", () => {
    console.log(`⬆️ Socket.IO transport upgraded | transport=${socket.io.engine.transport.name}`);
    notify("socketStatus", {
      status: "upgraded",
      transport: socket.io.engine.transport.name,
    });
  });

  socket.io.engine.on("upgradeError", (error) => {
    console.error("❌ Socket.IO WebSocket upgrade error:", error);
    notify("socketStatus", {
      status: "upgrade_error",
      message: error?.message || "WebSocket upgrade failed",
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Socket.IO disconnected | reason=${reason}`);
    notify("socketStatus", {
      status: "disconnected",
      reason,
    });
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket.IO connection error:", error?.message);
    notify("socketStatus", {
      status: "error",
      message: error?.message || "Socket.IO connection error",
    });
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log(`🔄 Socket.IO reconnect attempt #${attempt}`);
    notify("socketStatus", {
      status: "reconnecting",
      attempt,
    });
  });

  socket.io.on("reconnect", (attempt) => {
    console.log(`✅ Socket.IO reconnected after ${attempt} attempt(s)`);
    notify("socketStatus", {
      status: "reconnected",
      attempt,
      socketId: socket.id,
    });
  });

  socket.io.on("reconnect_error", (error) => {
    console.error("❌ Socket.IO reconnect error:", error?.message);
  });

  socket.onAny((event, data) => {
    notify(event, data);
  });
};

export const subscribeSocket = (listener) => {
  if (typeof listener !== "function") {
    throw new TypeError("subscribeSocket requires a function");
  }

  listeners.add(listener);
  shouldReconnect = true;
  connect();

  return () => {
    listeners.delete(listener);
  };
};

export const sendSocket = (event, data = {}, callback) => {
  if (!event) {
    console.warn("⚠️ Socket.IO emit skipped: event is required");
    return false;
  }

  if (!socket?.connected) {
    console.warn(`⚠️ Socket.IO emit skipped: socket not connected | event=${event}`);
    return false;
  }

  try {
    socket.emit(event, data, callback);
    return true;
  } catch (error) {
    console.error("❌ Socket.IO emit error:", error);
    return false;
  }
};

export const disconnectSocket = () => {
  shouldReconnect = false;
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.io?.removeAllListeners();
      socket.disconnect();
    } catch (error) {
      console.error("❌ Socket.IO disconnect error:", error);
    }
    socket = null;
  }
  listeners.clear();
};

export const getSocketState = () => {
  if (!socket) return "CLOSED";
  if (socket.connected) return "OPEN";
  if (socket.active) return "CONNECTING";
  return "CLOSED";
};

export const getSocket = () => socket;

export const getSocketConfig = () => ({
  url: getSocketUrl(),
  path: SOCKET_PATH,
  state: getSocketState(),
  connected: Boolean(socket?.connected),
  socketId: socket?.id || null,
  transport: socket?.io?.engine?.transport?.name || null,
});