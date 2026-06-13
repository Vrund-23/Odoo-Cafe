import { Server } from "socket.io";

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};

const emitEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  } else {
    console.warn(`[Socket] Cannot emit ${event}, io not initialized.`);
  }
};

export {
  initSocket,
  getIo,
  emitEvent
};
