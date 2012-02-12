$(document).ready ->
    checkCerere = (card) ->
        cardValue = card.data("cardValue")
        cardColor = card.data("cardColor")
        true
    socket = undefined
    username = ""
    turn = undefined
    hasBid = false
    enemy = ""
    battleID = undefined
    licitatii = 0
    hand = undefined
    nrTure = 0
    cerere = undefined
    jocCurent = undefined


    tromf = null
    myTurn = false

    console.log 'ready'

    $("#submit").click ->
        username = $("#user").val()
        socket = io.connect("http://localhost:5555")
        $("#connection").remove()
        socket.emit "register_player",
            username: username

        socket.on 'game_start', (data) ->
        console.log 'starting game'

        socket.on 'hand_available', (hand) ->
            console.log 'displaying hand'

            $("#carti").show()

            $(".carte").each (index, card) ->
                $(card).html hand[index].cardValue + hand[index].cardColor
                $(card).data "cardValue", hand[index].cardValue
                $(card).data "cardColor", hand[index].cardColor

        socket.on 'can_bid', ->
            $("#licitatii").show()

        socket.on 'has_bid', (data) ->
            console.log 'has_bid', data.player, data.amount

        socket.on 'can_pick_tromf', ->
            $('#tromfii').show()

        socket.on 'bid_winner', (username) ->
            console.log 'got a winner:', username

        socket.on 'tromf_picked', (value) ->
            console.log 'tromf:', value
            tromf = value

        socket.on 'your_turn', ->
            console.log 'my turn'
            myTurn = true

        socket.on 'end_turn', (data) ->
            console.log 'end_turn', data

        socket.on 'end_game', (data) ->
            console.log 'end_game', data

        socket.on 'card_played', (data) ->
            console.log data.player, 'played', data.card


    $(".cate").live "click", ->
        value = $(this).data("value")
        socket.emit "bid_hand", value
        $("#licitatii").hide()

    $(".tromf").live "click", ->
        value = $(this).data("value")
        socket.emit "pick_tromf", value
        $('#tromfii').hide()


    $(".carte").live "click", ->
        if not myTurn
            console.log 'not your turn'
            return

        socket.emit "play_card",
            cardValue: $(this).data("cardValue")
            cardColor: $(this).data("cardColor")

        myTurn = false
        $(this).remove()
