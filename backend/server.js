import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import http from 'http'
import {Server} from 'socket.io'  
import connectDB from './config/db.js'
import authRoutes from "./routes/authRoutes.js";
import boardRoutes from './routes/boardRoutes.js';
import listRoutes from './routes/listRoutes.js';
import cardRoutes from './routes/cardRoutes.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors({origin: process.env.CLIENT_URL || '*'}));
app.use(express.json());

//Routes
app.use("/api/auth", authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

app.get('/', (req,res)=>{
    res.send('Kanban api is running..');
});

// ---- Socket.io setup ----

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Client joins a "room" per board — events only broadcast within that room
  socket.on('joinBoard', (boardId) => {
    socket.join(boardId);
  });

  socket.on('leaveBoard', (boardId) => {
    socket.leave(boardId);
  });

  // Relay events: frontend emits after a successful REST call,
  // we broadcast to everyone else in that board's room (not the sender)
  socket.on('listCreated', ({ boardId, list }) => {
    socket.to(boardId).emit('listCreated', list);
  });

  socket.on('listDeleted', ({ boardId, listId }) => {
    socket.to(boardId).emit('listDeleted', listId);
  });

  socket.on('cardCreated', ({ boardId, card }) => {
    socket.to(boardId).emit('cardCreated', card);
  });

  socket.on('cardUpdated', ({ boardId, card }) => {
    socket.to(boardId).emit('cardUpdated', card);
  });

  socket.on('cardMoved', ({ boardId, card }) => {
    socket.to(boardId).emit('cardMoved', card);
  });

  socket.on('cardDeleted', ({ boardId, cardId }) => {
    socket.to(boardId).emit('cardDeleted', cardId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
