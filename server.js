import dotenv from "dotenv";
dotenv.config();

import express from 'express';
const PORT = process.env.PORT || 5000;
import cors from 'cors';
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

// Socket.io server
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// store online users
export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middlewares
app.use(express.json({ limit: "4mb" }));
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use('/api/auth', userRouter);
app.use('/api/messages', messageRouter);

await connectDB();

// 🚀 START SERVER (always, including production)
server.listen(PORT, () => {
  console.log("Server started on PORT:", PORT);
});

export default server;
