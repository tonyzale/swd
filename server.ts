
//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
import http = require('http');
import path = require('path');
import async = require('async');
import socketio = require('socket.io');
import express = require('express');

import destiny = require('./game/game');
import fs = require('fs');
let card_db = new destiny.CardDB(JSON.parse(fs.readFileSync('game/cards.json').toString()));
let deck_text = fs.readFileSync('game/deck.txt').toString();
let p1 = new destiny.Player('p1', 0, deck_text, card_db);
let p2 = new destiny.Player('p2', 1, deck_text, card_db);
let game = new destiny.GameState(p1, p2);

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
let router = express();
let server = http.createServer(router);
let game_io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, '../swd-client/dist')));
let messages: Chat[] = [];
let sockets: GameSocket[] = [];

interface GameSocket extends SocketIO.Socket {
    name: string;
}

function sendModal(socket: GameSocket, m: Modal) {
    socket.emit('modal', JSON.stringify(m));
}

function sendChat(socket: GameSocket, chat: Chat) {
    socket.emit('message', chat);
}

game_io.on('connection', function(socket: GameSocket) {
    messages.forEach(function(data) {
        sendChat(socket, data);
    });

    socket.emit('state', JSON.stringify(game.GetGameStateForPlayer(0)));
    socket.emit('moves', JSON.stringify(
        game.GetAvailableActions(0).map(function(v: destiny.TurnAction) {
            return v.serialized;
        })));

    sockets.push(socket);

    socket.on('disconnect', function() {
        sockets.splice(sockets.indexOf(socket), 1);
        updateRoster();
    });

    socket.on('message', function(msg: string) {
        console.log(`got message:${msg}`);
        if (!msg)
            return;
        let data = { name: socket.name, text: msg };
        broadcast('message', data);
        messages.push(data);
    });

    socket.on('identify', function(name: string) {
        socket.name = name || 'Anonymous';
    });

    socket.on('choice', function(choice: string) {
        let selection: ModalSelection = JSON.parse(choice);
        console.log('Got choice: ' + choice);
        game.UpdateState(0, selection.choice);
        /*
            sendModal(socket, {
              id: 'gotchoice',
              title: 'Received',
              text: 'Got your choice of ' + choice
            });*/
        socket.emit('state', JSON.stringify(game.GetGameStateForPlayer(0)));

    });

    socket.on('move-selection', function(move: any) {
        let data = {
            name: socket.name,
            text: 'Played: ' + move.name
        };
        broadcast('message', data);
        messages.push(data);
    });

    function updateRoster() {
        async.map(
            sockets,
            function(socket, callback) {
                callback(socket.name);
            },
            function(err, names) {
                broadcast('roster', names);
            }
        );
    }

    function broadcast(event: string, data: any) {
        sockets.forEach(function(socket) {
            socket.emit(event, data);
        });
    }
});
server.listen((<any>process.env).PORT || 3000, (<any>process.env).IP || "0.0.0.0", function() {
    let addr = server.address();
    console.log("Chat server listening at", addr.address + ":" + addr.port);
});

