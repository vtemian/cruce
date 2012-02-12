var io = require('socket.io').listen(5555);
var users = new Array();
var clients = new Array();
var game = new Array();
var onlineBattles = new Array();
var licitatii = new Array();
var score = new Array();

io.sockets.on('connection', function (socket) {
	socket.emit('identified', { message: 'handshaking' });
	
    socket.on('handshaking', function (data) {
        users.push(data.user);
        clients.push(socket);
        
        for(var i=0; i<clients.length; i++){
            clients[i].emit('online', {'online': clients.length});
        }
        var user = users.indexOf(data.user);
	if(game.length>0 && (game.indexOf(clients[user]) == -1)){
		decks = create_game();
		console.log(decks);
		game[0].emit('battle', {'enemy': data.user, 'free': true, 'deck': decks.firstDeck})
		var user1 = clients.indexOf(game[0]);
		socket.emit('battle', {'enemy': users[user1], 'free': false, 'deck': decks.secondDeck});
		game.splice(0, 1);
		
		onlineBattles.push([data.user, users[user1]]);
		
		licitatii.push({'cate':0});
		score.push(0);
		
	}else{
		if(!game.length)
		game.push(clients[user]);
	}
    });
    
    socket.on('licitatii', function(data){
    	var user = data.user;
    	
    	var licitat = data.cate;
    	//console.log(licitat);
	var k;
	for(var index in onlineBattles){
		var userIndex = onlineBattles[index].indexOf(user);
		console.log(licitatii[index]);
           	if(userIndex != -1){
           		if(licitat > licitatii[index].cate){licitatii[index] = {'cate':licitat, 'user':user};k=userIndex;}
           		if(userIndex)
                    		var alalalt = onlineBattles[index][0];
                	else
                    		var alalalt = onlineBattles[index][1];

                    	clients[users.indexOf(alalalt)].emit('licitatii', {licitatie: licitatii[index], battleID: index});
                    	clients[users.indexOf(onlineBattles[index][userIndex])].emit('licitatii', {licitatie: licitatii[index], battleID: index});

           	}
	}  	
    	
    });
    
    socket.on('tromf', function(data){
	licitatii[data.battleID]['tromf'] = data.tromf;
	
	clients[users.indexOf(onlineBattles[data.battleID][0])].emit('tromfAles', {'tromf':data.tromf});
	clients[users.indexOf(onlineBattles[data.battleID][1])].emit('tromfAles', {'tromf':data.tromf});
    })
    
    socket.on('licitatiiOver', function(data){
    	if(licitatii[data.battleID]['over'] == undefined){
		var leader = licitatii[data.battleID].user;
		licitatii[data.battleID]['over'] = true;
		var userIndex = onlineBattles[data.battleID].indexOf(leader);
		if(userIndex){
			clients[users.indexOf(onlineBattles[data.battleID][0])].emit('sealegetromf');
			clients[users.indexOf(onlineBattles[data.battleID][1])].emit('alegetromf');
		}else{
			clients[users.indexOf(onlineBattles[data.battleID][1])].emit('sealegetromf');
			clients[users.indexOf(onlineBattles[data.battleID][0])].emit('alegetromf');
		}
    	}
    })
    socket.on('oferta', function(data){
    
    	var tromf = licitatii[data.battleID]['tromf'];
    	var cardValue = data.cardValue;
    	var cardColor = data.cardColor;
    	//daca exista deja o cerere
    	if(licitatii[data.battleID]['cerere'] != undefined ){
    		check_carte(licitatii[data.battleID]['cerere'], cardValue, cardColor, tromf);
    		licitatii[data.battleID]['cerere'] = undefined;
    	}else{
    		licitatii[data.battleID]['cerere'] = {
    			'cardValue': cardValue,
    			'cardColor': cardColor
    		}
    		console.log('a')
    		var userIndex = onlineBattles[data.battleID].indexOf(data.user);
    		if(userIndex){
			clients[users.indexOf(onlineBattles[data.battleID][0])].emit('cerere', {'cardValue': cardValue, cardColor: 'cardColor'});
		}else{
			clients[users.indexOf(onlineBattles[data.battleID][1])].emit('cerere', {'cardValue': cardValue, cardColor: 'cardColor'});
		}
    	}
    })
    function check_carte(cerere, ofertaValue, ofertaColor, tromf){
    
    }
    socket.on('disconnect', function (data){
        var index = clients.indexOf(socket);

        //droping the user from the curent game!
        var user = users[index];
        var onlineUser = gameDroping(user);
        console.log(onlineUser);
        if(users.indexOf(onlineUser) != -1)
            clients[users.indexOf(onlineUser)].emit('disconnectGame', {message: 'decedat'});

        clients.splice(index, 1);
        users.splice(index, 1);
        index = game.indexOf(socket);
        if(index != -1){
            game.splice(index, 1);
        }
        for(var i=0; i<clients.length; i++){
            clients[i].emit('on', {'online': clients.length});
        }
    });
    function gameDroping(dropedUser){
        for(var index in onlineBattles){
            var userIndex = onlineBattles[index].indexOf(dropedUser);
            if(userIndex != -1){
                if(userIndex)
                    return onlineBattles[index][0];
                else
                    return onlineBattles[index][1];
            }
        }
        return false;
    }
    function create_game(){
    	var deck = new Array(
    		{
    			'cardValue': 2,
    			'cardColor': 'v'
    		},
    		{
    			'cardValue': 3,
    			'cardColor': 'v'
    		},
    		{
    			'cardValue': 4,
    			'cardColor': 'v'
    		},
    		{
    			'cardValue': 0,
    			'cardColor': 'v'
    		},
    		{
    			'cardValue': 10,
    			'cardColor': 'v'
    		},
    		{
    			'cardValue': 11,
    			'cardColor': 'v'
    		},
    		{
    			'cardValue': 2,
    			'cardColor': 'r'
    		},
    		{
    			'cardValue': 3,
    			'cardColor': 'r'
    		},
    		{
    			'cardValue': 4,
    			'cardColor': 'r'
    		},
    		{
    			'cardValue': 0,
    			'cardColor': 'r'
    		},
    		{
    			'cardValue': 10,
    			'cardColor': 'r'
    		},
    		{
    			'cardValue': 11,
    			'cardColor': 'r'
    		},
		{
    			'cardValue': 2,
    			'cardColor': 'd'
    		},
    		{
    			'cardValue': 3,
    			'cardColor': 'd'
    		},
    		{
    			'cardValue': 4,
    			'cardColor': 'd'
    		},
    		{
    			'cardValue': 0,
    			'cardColor': 'd'
    		},
    		{
    			'cardValue': 10,
    			'cardColor': 'd'
    		},
    		{
    			'cardValue': 11,
    			'cardColor': 'd'
    		},
    		{
    			'cardValue': 2,
    			'cardColor': 'm'
    		},
    		{
    			'cardValue': 3,
    			'cardColor': 'm'
    		},
    		{
    			'cardValue': 4,
    			'cardColor': 'm'
    		},
    		{
    			'cardValue': 0,
    			'cardColor': 'm'
    		},
    		{
    			'cardValue': 10,
    			'cardColor': 'm'
    		},
    		{
    			'cardValue': 11,
    			'cardColor': 'm'
    		}
    	);
	
	var numbers = new Array();
	result = setDeck(deck, numbers);
	var firstDeck = result.myDeck;
	numbers = result.numbers;
	result = setDeck(deck, numbers);
	var secondDeck = result.myDeck;
	
	return {
		'firstDeck': firstDeck,
		'secondDeck': secondDeck
	}
	    	
    }
    function setDeck(deck, numbers){
    	var myDeck = new Array();
    	for(var i=1; i<=6; i++){
		var randomnumber = Math.floor(Math.random()*25)
		index = numbers.indexOf(randomnumber);
		while(index != -1){
			var randomnumber = Math.floor(Math.random()*25)
			index = numbers.indexOf(randomnumber);
		}
		numbers.push(randomnumber);
		myDeck.push(deck[randomnumber-1]);
	}
	
	return {'myDeck': myDeck, 'numbers': numbers}
    }
});
