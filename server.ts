
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
let card_db = new destiny.CardDB();
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
(<any>game_io).set('log level',2);

router.use(express.static(path.resolve(__dirname, 'client')));
let messages = [];
let sockets = [];

game_io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });
    
    socket.emit('state', JSON.stringify(game));
    socket.emit('moves', JSON.stringify(
      game.GetAvailableActions(0).map(function(v){
        return v.serialized;
      })));

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      let text = String(msg || '');

      if (!text)
        return;

      (<any>socket).get('name', function (err, name) {
        let data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      (<any>socket).set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
    
    socket.on('choice', function(choice) {
      console.log('Got choice: ' + choice);
      socket.emit('modal', JSON.stringify({
        id: 'gotchoice',
        title: 'Received',
        text: 'Got your choice of ' + choice
      }));
    });

    socket.on('move-selection', function(move) {
      (<any>socket).get('name', function(err, name) {
        let data = {
          name: name,
          text: 'Played: ' + move.name
        };
        broadcast('message', data);
        messages.push(data);
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen((<any>process.env).PORT || 3000, (<any>process.env).IP || "0.0.0.0", function(){
  let addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
