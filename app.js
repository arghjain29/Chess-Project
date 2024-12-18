const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

//! important for Socket.io to work 
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';


app.get('/', (req, res) => {
    res.render('index');
});

function checkPlayersReady() {
    if (players.white && players.black) {
        io.emit('playersReady');
    } else {
        io.emit('waitingForPlayer');
    }
}

io.on('connection', (Usocket) => {
    console.log('User connected with socket id:', Usocket.id);
    if (!players.white) {
        players.white = Usocket.id;
        Usocket.emit('playerRole', 'w');
        checkPlayersReady();
    } else if (!players.black) {
        players.black = Usocket.id;
        Usocket.emit('playerRole', 'b');
        checkPlayersReady();
    } else {
        Usocket.emit('spectatorRole');
    }

    Usocket.on('disconnect', () => {
        if (Usocket.id === players.white) {
            delete players.white;
        } else if (Usocket.id === players.black) {
            delete players.black;
        }
        checkPlayersReady();
    });

    Usocket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && Usocket.id !== players.white) return;
            if (chess.turn() === 'b' && Usocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit('move', move)
                io.emit('boardState', chess.fen());
            } else {
                console.log('Invalid move: ', move);
                Usocket.emit('Invalid move', move);
            }
        } catch (error) {
            Usocket.emit('move', { error: error.message });

        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});