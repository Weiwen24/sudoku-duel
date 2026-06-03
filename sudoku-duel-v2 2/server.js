const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Puzzle Bank ─────────────────────────────────────────────────────────────
const PUZZLES = {
  Easy: [
    { grid: '530070000600195000098000060800060003400803001700020006060000280000419005000080079', solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179', diff: 'Easy' },
    { grid: '003020600900305001001806400008102900700000008006708200002609500800203009005010300', solution: '483921657967345821251876493548132976729564138136798245372689514814253769695417382', diff: 'Easy' },
    { grid: '200000600300200005060030020000800300070000090004005000030060040700001006008000001', solution: '284917635391286475567034928156849372873562194924375861435621749719453286648790513', diff: 'Easy' }
  ],
  Medium: [
    { grid: '000000000010020030005600700004030200070800010003050600500060100080040050000000000', solution: '637418529918527436245639718764931285572846913893752641356284197189473652421965873', diff: 'Medium' },
    { grid: '020000000000600003074080000000003002080040010600500000000010780500009000000000040', solution: '126437958895621473374985126457813962983246517612579384249168735531792648768354291', diff: 'Medium' },
    { grid: '600120390008095061902000005007040802050090010408050700900000207860450109037081004', solution: '645127398718395461932864175197643852253978614486251739914536287861742953375819024', diff: 'Medium' }
  ],
  Hard: [
    { grid: '800000000003600000070090200060005300400080700100004056009500001800200090007600000', solution: '812753649943682175675491283168945372439278751752164836926537418581324967347816523', diff: 'Hard' },
    { grid: '200080300060070084030500209000105408000000000402706000301007040720040060004010003', solution: '245189376169273584837564219976125438518394762423786951391657842752948163684312795', diff: 'Hard' },
    { grid: '000000000000003085001020000000507000004000100090000000500000073002010000000040009', solution: '987654321246173985351928746128537694634892157795461832519286473472319568863745219', diff: 'Hard' }
  ]
};

const rooms = {};

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms[code] ? genCode() : code;
}

function randomPuzzle(diff) {
  const pool = PUZZLES[diff] || PUZZLES['Medium'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function cleanupRoom(code) {
  if (rooms[code] && rooms[code].players.length === 0) {
    delete rooms[code];
    console.log(`Room ${code} deleted (empty)`);
  }
}

function sanitizeRoom(room) {
  return {
    code: room.code, status: room.status, startTime: room.startTime,
    puzzle: room.puzzle, difficulty: room.difficulty,
    players: room.players.map(p => ({
      id: p.id, name: p.name, progress: p.progress,
      finished: p.finished, time: p.time, isHost: p.isHost
    }))
  };
}

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('create_room', ({ name, difficulty }) => {
    const code = genCode();
    const diff = ['Easy','Medium','Hard'].includes(difficulty) ? difficulty : 'Medium';
    rooms[code] = {
      code, puzzle: randomPuzzle(diff), difficulty: diff,
      status: 'waiting', startTime: null,
      players: [{ id: socket.id, name: name || 'Player 1', progress: 0, finished: false, time: null, isHost: true }]
    };
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('room_joined', { code, room: sanitizeRoom(rooms[code]), playerId: socket.id });
    console.log(`Room ${code} created by ${name} (${diff})`);
  });

  socket.on('join_room', ({ name, code }) => {
    const room = rooms[code];
    if (!room) { socket.emit('join_error', 'Room not found'); return; }
    if (room.status === 'playing') { socket.emit('join_error', 'Game already in progress'); return; }
    if (room.players.length >= 4) { socket.emit('join_error', 'Room is full (max 4 players)'); return; }
    room.players.push({ id: socket.id, name: name || 'Player', progress: 0, finished: false, time: null, isHost: false });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('room_joined', { code, room: sanitizeRoom(room), playerId: socket.id });
    io.to(code).emit('room_updated', sanitizeRoom(room));
    console.log(`${name} joined room ${code}`);
  });

  socket.on('start_game', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) return;
    if (room.players.length < 2) { socket.emit('start_error', 'Need at least 2 players'); return; }
    room.status = 'playing';
    room.startTime = Date.now();
    room.puzzle = randomPuzzle(room.difficulty);
    io.to(code).emit('game_started', { room: sanitizeRoom(room) });
    console.log(`Game started in room ${code}`);
  });

  socket.on('update_progress', ({ progress }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.progress = progress;
    socket.to(code).emit('progress_updated', { playerId: socket.id, progress });
  });

  socket.on('player_finished', ({ time }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.finished) return;
    player.finished = true; player.time = time; player.progress = 100;
    io.to(code).emit('player_finished', { playerId: socket.id, name: player.name, time, room: sanitizeRoom(room) });
    console.log(`${player.name} finished in room ${code} (${time}s)`);
    if (room.players.every(p => p.finished)) {
      io.to(code).emit('game_over', { room: sanitizeRoom(room) });
    }
  });

  socket.on('play_again', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) return;
    room.status = 'waiting'; room.startTime = null;
    room.puzzle = randomPuzzle(room.difficulty);
    room.players.forEach(p => { p.finished = false; p.time = null; p.progress = 0; });
    io.to(code).emit('room_updated', sanitizeRoom(room));
    io.to(code).emit('back_to_waiting');
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    const idx = room.players.findIndex(p => p.id === socket.id);
    if (idx === -1) return;
    const leaving = room.players.splice(idx, 1)[0];
    console.log(`${leaving.name} disconnected from room ${code}`);
    if (leaving.isHost && room.players.length > 0) room.players[0].isHost = true;
    io.to(code).emit('player_left', { playerId: socket.id, name: leaving.name, room: sanitizeRoom(room) });
    cleanupRoom(code);
  });
});

server.listen(PORT, () => console.log(`Sudoku Duel running on port ${PORT}`));
