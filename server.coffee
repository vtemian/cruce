
io = require('socket.io').listen(5555)

MIN_CLIENTS = 2

PLAYER_TURNS =
    2: 2
    3: 8
    4: 6
    6: 4

class ClientList
    constructor: ->
        @clients = {}

    add: (client) ->
        console.log 'New player', client.username, client.socket.id
        @clients[client.socket.id] = client

    remove: (socket) ->
        console.log 'removed socket'
        delete @clients[socket.id]

    get: (socket) ->
        return @clients[socket.id]

    length: ->
        return @clients.length

class Player
    constructor: (@username, @socket) ->
        @cards = []
        @score = 0

    addScore: (score) ->
        @score += score

class Game
    constructor: ->
        @players = []
        @deck = []
        @currentBidderIndex = -1
        @maxBid = 0
        @tromfColor = null
        @startingPlayer = null

        @turnNumber = 0
        @currentTurn = []
        @currentPlayerIndex = -1

    initializeDeck: ->
        deckValues =
            v: [2, 3, 4, 0, 10, 11]
            r: [2, 3, 4, 0, 10, 11]
            m: [2, 3, 4, 0, 10, 11]
            d: [2, 3, 4, 0, 10, 11]

        for color, values of deckValues
            for value in values
                @deck.push {cardValue: value, cardColor: color}

    addPlayer: (player) ->
        if player?
            @players.push(player)


    distributeHand: (player) ->
        for i in [1..6]
            index = Math.floor(Math.random() * @deck.length)
            player.cards.push @deck[index]
            @deck.slice index, 1

        console.log 'sending cards', player.cards
        player.socket.emit 'hand_available', player.cards

    start: ->
        for player in @players
            player.game = @
            player.socket.emit 'game_start'

        @initializeDeck()

        for player in @players
            @distributeHand(player)

        @currentBidderIndex = @players.length - 1

        @players[@currentBidderIndex].socket.emit 'can_bid'

    bid: (player, amount) ->
        @broadcast 'has_bid',
                   player: player.username
                   amount: amount

        if amount > @maxBid
            @maxBid = amount
            @startingPlayer = player

        if @currentBidderIndex > 0
            @currentBidderIndex--
            @players[@currentBidderIndex].socket.emit 'can_bid'
        else
            @broadcast 'bid_winner', @startingPlayer.username
            @startingPlayer.socket.emit 'can_pick_tromf'


    pickTromf: (player, color) ->
        @tromfColor = color
        @broadcast 'tromf_picked', @tromfColor
        @startTurn()


    startTurn: ->
        @turnNumber++

        console.log 'turn?', @turnNumber, @players.length, PLAYER_TURNS[@players.length]
        if @turnNumber > PLAYER_TURNS[@players.length]
            @endGame()
            return

        console.log 'starting turn', @turnNumber
        @currentPlayerIndex = @players.indexOf(@startingPlayer)
        @players[@currentPlayerIndex].socket.emit 'your_turn'


    endGame: ->
        console.log 'END GAME!!!!!!!!!!!!!'
        winner = null

        for player in @players
            if not winner or player.score > winner.score
                winner = player

        @broadcast 'end_game',
            player: winner.username
            score: winner.score


    getWinningPlayer: ->
        winningPlay = @currentTurn[0]

        for play in @currentTurn
            currentCard = play.card

            if currentCard.cardColor == @tromfColor
                if winningPlay.card.cardColor != @tromfColor or currentCard.value > winningPlay.card.cardValue
                    winningPlay = play
            else if currentCard.cardColor == winningPlay.card.cardColor and currentCard.cardValue > winningPlay.card.cardValue
                winningPlay = play

        console.log 'winning player', winningPlay, winningPlay.player.username
        return winningPlay.player

    getWinningScore: ->
        score = 0

        for play in @currentTurn
            score += play.card.cardValue

        return score


    endTurn: ->
        console.log 'end turn!!!'
        winningPlayer = @getWinningPlayer()

        score = @getWinningScore()
        winningPlayer.addScore(score)
        @broadcast 'end_turn',
            player: winningPlayer.username
            score: score

        @currentTurn = []

        @startTurn()



    nextInTurn: ->
        @currentPlayerIndex--
        if @currentPlayerIndex < 0
            @currentPlayerIndex = @players.length - 1

        if @currentPlayerIndex == @players.indexOf(@startingPlayer)
            @endTurn()
            return

        @players[@currentPlayerIndex].socket.emit 'your_turn'

    playCard: (player, cardData) ->
        @currentTurn.push
            player: player
            card: cardData

        @broadcast 'card_played',
            player: player.username
            card: cardData

        @nextInTurn()


    broadcast: (event, data) ->
        for player in @players
            player.socket.emit event, data


clients = new ClientList()

freeClients = []

io.sockets.on 'connection', (socket) ->
    socket.on 'register_player', (data) ->
        player = new Player(data.username, socket)
        clients.add(player)
        freeClients.push(player)

        if freeClients.length >= MIN_CLIENTS
            game = new Game()

            for i in [1..MIN_CLIENTS]
                game.addPlayer(freeClients.pop())

            game.start()


    socket.on 'bid_hand', (amount) ->
        player = clients.get(socket)
        player.game.bid(player, amount)

    socket.on 'pick_tromf', (value) ->
        player = clients.get(socket)
        player.game.pickTromf(player, value)

    socket.on 'play_card', (cardData) ->
        player = clients.get(socket)
        player.game.playCard(player, cardData)

    socket.on 'disconnect', ->
        clients.remove(socket)
