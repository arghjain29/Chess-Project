const socket = io();
const chess = new Chess();

const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

function updateRoleMessage(role) {
    const roleText = role === 'w' ? 'White Piece' : 'Black Piece';
    document.querySelector('h3').innerHTML = `You are playing as ${roleText}`;
}

const getPieceUnicode = (piece) => {
    const pieceMap = {
        p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
        P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
    };
    return pieceMap[piece.type] || '';
};

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + squareindex) % 2 === 0 ? 'light' : 'dark');

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;
                // console.log('Draggable attribute:', pieceElement.draggable);


                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        // console.log('Dragging started:', pieceElement);
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareindex };
                        pieceElement.classList.add('dragging');
                        e.dataTransfer.setData('text/plain', '');
                    }
                });
                pieceElement.addEventListener('dragend', (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                    pieceElement.classList.remove('dragging');
                });
                squareElement.appendChild(pieceElement);

            }
            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }

};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };
    socket.emit('move', move);
};

socket.on('playerRole', (role) => {
    playerRole = role;
    const roleText = role === 'w' ? 'White Piece' : 'Black Piece';
    document.querySelector('h3').innerHTML = `You are playing as ${roleText}`;
    renderBoard();

});

socket.on('spectatorRole', () => {
    playerRole = null;
    document.querySelector('h3').innerHTML = `You are watching as a Spectator`;
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});

// Show waiting message
socket.on('waitingForPlayer', () => {
    document.querySelector('h3').innerHTML = `Waiting for another player to join...`;
    const chessboard = document.getElementById('chessboard');
    chessboard.classList.add('hidden');
});

// Start game when both players are ready
socket.on('playersReady', () => {
    if (playerRole) {
        // Update the role message
        updateRoleMessage(playerRole);
    } else {
        document.querySelector('h3').innerHTML = `Game is starting!`;
    }
    const chessboard = document.getElementById('chessboard');
    chessboard.classList.remove('hidden');
    renderBoard();
});

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
});

// renderBoard();

