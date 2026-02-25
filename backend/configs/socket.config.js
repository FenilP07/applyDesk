import { Server } from "socket.io";
import http from "http";

let io;

export const initSocket = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("join-room", (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`User joined room: ${userId}`);
      }
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });

  return server;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
