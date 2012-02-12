(function() {

  $(document).ready(function() {
    var battleID, cerere, checkCerere, enemy, hand, hasBid, jocCurent, licitatii, myTurn, nrTure, socket, tromf, turn, username;
    checkCerere = function(card) {
      var cardColor, cardValue;
      cardValue = card.data("cardValue");
      cardColor = card.data("cardColor");
      return true;
    };
    socket = void 0;
    username = "";
    turn = void 0;
    hasBid = false;
    enemy = "";
    battleID = void 0;
    licitatii = 0;
    hand = void 0;
    nrTure = 0;
    cerere = void 0;
    jocCurent = void 0;
    tromf = null;
    myTurn = false;
    console.log('ready');
    $("#submit").click(function() {
      username = $("#user").val();
      socket = io.connect("http://localhost:5555");
      $("#connection").remove();
      socket.emit("register_player", {
        username: username
      });
      socket.on('game_start', function(data) {});
      console.log('starting game');
      socket.on('hand_available', function(hand) {
        console.log('displaying hand');
        $("#carti").show();
        return $(".carte").each(function(index, card) {
          $(card).html(hand[index].cardValue + hand[index].cardColor);
          $(card).data("cardValue", hand[index].cardValue);
          return $(card).data("cardColor", hand[index].cardColor);
        });
      });
      socket.on('can_bid', function() {
        return $("#licitatii").show();
      });
      socket.on('has_bid', function(data) {
        return console.log('has_bid', data.player, data.amount);
      });
      socket.on('can_pick_tromf', function() {
        return $('#tromfii').show();
      });
      socket.on('bid_winner', function(username) {
        return console.log('got a winner:', username);
      });
      socket.on('tromf_picked', function(value) {
        console.log('tromf:', value);
        return tromf = value;
      });
      socket.on('your_turn', function() {
        console.log('my turn');
        return myTurn = true;
      });
      socket.on('end_turn', function(data) {
        return console.log('end_turn', data);
      });
      socket.on('end_game', function(data) {
        return console.log('end_game', data);
      });
      return socket.on('card_played', function(data) {
        return console.log(data.player, 'played', data.card);
      });
    });
    $(".cate").live("click", function() {
      var value;
      value = $(this).data("value");
      socket.emit("bid_hand", value);
      return $("#licitatii").hide();
    });
    $(".tromf").live("click", function() {
      var value;
      value = $(this).data("value");
      socket.emit("pick_tromf", value);
      return $('#tromfii').hide();
    });
    return $(".carte").live("click", function() {
      if (!myTurn) {
        console.log('not your turn');
        return;
      }
      socket.emit("play_card", {
        cardValue: $(this).data("cardValue"),
        cardColor: $(this).data("cardColor")
      });
      myTurn = false;
      return $(this).remove();
    });
  });

}).call(this);
