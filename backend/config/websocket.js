// config/websocket.js
const { Server } = require("socket.io");

let io = null;

const WS_PATH = "/ws";

const init = (server) => {
  if (io) {
    console.log("⚠️ Socket.IO server already initialized");
    return io;
  }

  io = new Server(server, {
    path: WS_PATH,
    clientTracking: true,
  });

  io.on("connection", (socket) => {
    console.log(
      `✅ Socket.IO client connected | ${socket.handshake.address}`
    );

    socket.on("message", (message) => {
      // Reserved for future client -> server messages.
      console.log("📩 WS message:", message.toString());
    });

    socket.on("error", (error) => {
      console.error("❌ Socket.IO client error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `❌ Client disconnected | reason=${reason}`
      );
    });
  });

  io.on("error", (error) => {
    console.error("❌ Socket.IO server error:", error);
  });

  console.log(`🚀 Socket.IO server initialized on ${WS_PATH}`);

  return io;
};

const getWSS = () => io;

const broadcast = (payload) => {
  if (!io) return 0;

  try {
    io.emit("message", payload);
    return io.engine.clientsCount;
  } catch (error) {
    console.error("❌ Socket.IO send error:", error.message);
    return 0;
  }
};

const sendToClient = (socket, payload) => {
  if (!socket) return false;

  try {
    socket.emit("message", payload);
    return true;
  } catch (error) {
    console.error(
      "❌ Socket.IO client send error:",
      error.message
    );
    return false;
  }
};

const close = () => {
  if (!io) return;

  try {
    io.close();
  } catch (error) {
    console.error(
      "❌ Socket.IO close error:",
      error.message
    );
  }

  io = null;
};

module.exports = {
  init,
  getWSS,
  broadcast,
  sendToClient,
  close,
  WS_PATH,
};