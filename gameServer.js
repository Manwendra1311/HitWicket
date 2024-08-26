const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
    grid: Array(5).fill().map(() => Array(5).fill(null)),  
    players: {
        A: {
            characters: { P1: [0, 0], P2: [0, 1], P3: [0, 2], H1: [0, 3], H2: [0, 4] },  
        },
        B: {
            characters: { P1: [4, 0], P2: [4, 1], P3: [4, 2], H1: [4, 3], H2: [4, 4] },  
        }
    },
    turn: 'A', 
    winner: null
};

function broadcastGameState() {
    const stateMessage = JSON.stringify({ type: 'gameState', gameState });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(stateMessage);
        }
    });
}

function handleMove(player, move) {
    if (gameState.turn !== player || gameState.winner) return;

    const [char, direction] = move.split(':');
    const position = gameState.players[player].characters[char];

    if (!position) return;

    let [x, y] = position;

    switch (direction) {
        case 'F':
            x -= 1;
            break;
        case 'B':
            x += 1;
            break;
        case 'L':
            y -= 1;
            break;
        case 'R':
            y += 1;
            break;
    
    }


    if (x < 0 || x > 4 || y < 0 || y > 4) return;

    const opponent = player === 'A' ? 'B' : 'A';
    const opponentChar = Object.keys(gameState.players[opponent].characters).find(
        key => gameState.players[opponent].characters[key][0] === x &&
               gameState.players[opponent].characters[key][1] === y
    );

    if (opponentChar) {
        delete gameState.players[opponent].characters[opponentChar];
        if (Object.keys(gameState.players[opponent].characters).length === 0) {
            gameState.winner = player;
        }
    }

    gameState.players[player].characters[char] = [x, y];

    gameState.turn = opponent;

    broadcastGameState();
}

wss.on('connection', ws => {
    ws.send(JSON.stringify({ type: 'gameState', gameState }));

    ws.on('message', message => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'move') {
            handleMove(parsedMessage.player, parsedMessage.move);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server started on ws://localhost:8080');
