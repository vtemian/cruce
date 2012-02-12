(function() {
  var ClientList, Game, MIN_CLIENTS, PLAYER_TURNS, Player, clients, freeClients, io;

  io = require('socket.io').listen(5555);

  MIN_CLIENTS = 2;

  PLAYER_TURNS = {
    2: 2,
    3: 8,
    4: 6,
    6: 4
  };

  ClientList = (function() {

    function ClientList() {
      this.clients = {};
    }

    ClientList.prototype.add = function(client) {
      console.log('New player', client.username, client.socket.id);
      return this.clients[client.socket.id] = client;
    };

    ClientList.prototype.remove = function(socket) {
      console.log('removed socket');
      return delete this.clients[socket.id];
    };

    ClientList.prototype.get = function(socket) {
      return this.clients[socket.id];
    };

    ClientList.prototype.length = function() {
      return this.clients.length;
    };

    return ClientList;

  })();

  Player = (function() {

    function Player(username, socket) {
      this.username = username;
      this.socket = socket;
      this.cards = [];
      this.score = 0;
    }

    Player.prototype.addScore = function(score) {
      return this.score += score;
    };

    return Player;

  })();

  Game = (function() {

    function Game() {
      this.players = [];
      this.deck = [];
      this.currentBidderIndex = -1;
      this.maxBid = 0;
      this.tromfColor = null;
      this.startingPlayer = null;
      this.turnNumber = 0;
      this.currentTurn = [];
      this.currentPlayerIndex = -1;
    }

    Game.prototype.initializeDeck = function() {
      var color, deckValues, value, values, _results;
      deckValues = {
        v: [2, 3, 4, 0, 10, 11],
        r: [2, 3, 4, 0, 10, 11],
        m: [2, 3, 4, 0, 10, 11],
        d: [2, 3, 4, 0, 10, 11]
      };
      _results = [];
      for (color in deckValues) {
        values = deckValues[color];
        _results.push((function() {
          var _i, _len, _results2;
          _results2 = [];
          for (_i = 0, _len = values.length; _i < _len; _i++) {
            value = values[_i];
            _results2.push(this.deck.push({
              cardValue: value,
              cardColor: color
            }));
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    Game.prototype.addPlayer = function(player) {
      if (player != null) return this.players.push(player);
    };

    Game.prototype.distributeHand = function(player) {
      var i, index;
      for (i = 1; i <= 6; i++) {
        index = Math.floor(Math.random() * this.deck.length);
        player.cards.push(this.deck[index]);
        this.deck.slice(index, 1);
      }
      console.log('sending cards', player.cards);
      return player.socket.emit('hand_available', player.cards);
    };

    Game.prototype.start = function() {
      var player, _i, _j, _len, _len2, _ref, _ref2;
      _ref = this.players;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        player.game = this;
        player.socket.emit('game_start');
      }
      this.initializeDeck();
      _ref2 = this.players;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        player = _ref2[_j];
        this.distributeHand(player);
      }
      this.currentBidderIndex = this.players.length - 1;
      return this.players[this.currentBidderIndex].socket.emit('can_bid');
    };

    Game.prototype.bid = function(player, amount) {
      this.broadcast('has_bid', {
        player: player.username,
        amount: amount
      });
      if (amount > this.maxBid) {
        this.maxBid = amount;
        this.startingPlayer = player;
      }
      if (this.currentBidderIndex > 0) {
        this.currentBidderIndex--;
        return this.players[this.currentBidderIndex].socket.emit('can_bid');
      } else {
        this.broadcast('bid_winner', this.startingPlayer.username);
        return this.startingPlayer.socket.emit('can_pick_tromf');
      }
    };

    Game.prototype.pickTromf = function(player, color) {
      this.tromfColor = color;
      this.broadcast('tromf_picked', this.tromfColor);
      return this.startTurn();
    };

    Game.prototype.startTurn = function() {
      this.turnNumber++;
      console.log('turn?', this.turnNumber, this.players.length, PLAYER_TURNS[this.players.length]);
      if (this.turnNumber > PLAYER_TURNS[this.players.length]) {
        this.endGame();
        return;
      }
      console.log('starting turn', this.turnNumber);
      this.currentPlayerIndex = this.players.indexOf(this.startingPlayer);
      return this.players[this.currentPlayerIndex].socket.emit('your_turn');
    };

    Game.prototype.endGame = function() {
      var player, winner, _i, _len, _ref;
      console.log('END GAME!!!!!!!!!!!!!');
      winner = null;
      _ref = this.players;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        if (!winner || player.score > winner.score) winner = player;
      }
      return this.broadcast('end_game', {
        player: winner.username,
        score: winner.score
      });
    };

    Game.prototype.getWinningPlayer = function() {
      var currentCard, play, winningPlay, _i, _len, _ref;
      winningPlay = this.currentTurn[0];
      _ref = this.currentTurn;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        play = _ref[_i];
        currentCard = play.card;
        if (currentCard.cardColor === this.tromfColor) {
          if (winningPlay.card.cardColor !== this.tromfColor || currentCard.value > winningPlay.card.cardValue) {
            winningPlay = play;
          }
        } else if (currentCard.cardColor === winningPlay.card.cardColor && currentCard.cardValue > winningPlay.card.cardValue) {
          winningPlay = play;
        }
      }
      console.log('winning player', winningPlay, winningPlay.player.username);
      return winningPlay.player;
    };

    Game.prototype.getWinningScore = function() {
      var play, score, _i, _len, _ref;
      score = 0;
      _ref = this.currentTurn;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        play = _ref[_i];
        score += play.card.cardValue;
      }
      return score;
    };

    Game.prototype.endTurn = function() {
      var score, winningPlayer;
      console.log('end turn!!!');
      winningPlayer = this.getWinningPlayer();
      score = this.getWinningScore();
      winningPlayer.addScore(score);
      this.broadcast('end_turn', {
        player: winningPlayer.username,
        score: score
      });
      this.currentTurn = [];
      return this.startTurn();
    };

    Game.prototype.nextInTurn = function() {
      this.currentPlayerIndex--;
      if (this.currentPlayerIndex < 0) {
        this.currentPlayerIndex = this.players.length - 1;
      }
      if (this.currentPlayerIndex === this.players.indexOf(this.startingPlayer)) {
        this.endTurn();
        return;
      }
      return this.players[this.currentPlayerIndex].socket.emit('your_turn');
    };

    Game.prototype.playCard = function(player, cardData) {
      this.currentTurn.push({
        player: player,
        card: cardData
      });
      this.broadcast('card_played', {
        player: player.username,
        card: cardData
      });
      return this.nextInTurn();
    };

    Game.prototype.broadcast = function(event, data) {
      var player, _i, _len, _ref, _results;
      _ref = this.players;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        _results.push(player.socket.emit(event, data));
      }
      return _results;
    };

    return Game;

  })();

  clients = new ClientList();

  freeClients = [];

  io.sockets.on('connection', function(socket) {
    socket.on('register_player', function(data) {
      var game, i, player;
      player = new Player(data.username, socket);
      clients.add(player);
      freeClients.push(player);
      if (freeClients.length >= MIN_CLIENTS) {
        game = new Game();
        for (i = 1; 1 <= MIN_CLIENTS ? i <= MIN_CLIENTS : i >= MIN_CLIENTS; 1 <= MIN_CLIENTS ? i++ : i--) {
          game.addPlayer(freeClients.pop());
        }
        return game.start();
      }
    });
    socket.on('bid_hand', function(amount) {
      var player;
      player = clients.get(socket);
      return player.game.bid(player, amount);
    });
    socket.on('pick_tromf', function(value) {
      var player;
      player = clients.get(socket);
      return player.game.pickTromf(player, value);
    });
    socket.on('play_card', function(cardData) {
      var player;
      player = clients.get(socket);
      return player.game.playCard(player, cardData);
    });
    return socket.on('disconnect', function() {
      return clients.remove(socket);
    });
  });

}).call(this);
