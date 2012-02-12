var io = require('socket.io').listen(5555);
var users = new Array();
var clients = new Array();
var game = new Array();
var onlineBattles = new Array();
var onlineBattlesMircea = new Array();
var licitatii = new Array();
var score = new Array();
var nr_jucatori = 2;
var nrJocuri = 0;

io.sockets.on('connection', function (socket) {
	socket.emit('identified', { message: 'handshaking' });
	
	function getJocActiv(){
		for(var i=0;i<onlineBattlesMircea.length; i++){
			if(onlineBattlesMircea[i].players.length<nr_jucatori){
				return onlineBattlesMircea[i];
			}
		}
		var jocNou = 
			{
			  'jocId': nrJocuri//++
			 ,'players': new Array()
			 ,'deck':  getAllCards()
			 ,'sockets': new Array()
			};
		onlineBattlesMircea.push(jocNou);
		return jocNou;
	}

    socket.on('join_new_game', function (data) {
		console.log('join_new_game: am primit:' + data);
		var joc = getJocActiv();
		joc.sockets.push(socket);
		var player = {
			'id':joc.players.length
			, 'userdata':data
			, 'hand':setDeckMircea(joc.deck)
			, 'licitare':-1
			};
		joc.players.push(player);
		//anunta adversarii ca a intrat un nou jucator
		for(var i=0; i<joc.players.length; i++){
			if(joc.players[i].userdata.user != player.userdata.user){
				console.log('player=' + joc.players[i]);
				var aSocket = joc.sockets[i];
				aSocket.emit('newplayeronline', {'id':i,'player': player});
			}
		}
		console.log('join_new_game: dupa  push');
		if(joc.players.length == nr_jucatori){
			for(p in joc.players){
				console.log(joc.players[p]);
				joc.sockets[p].emit('startbattle', {'joc': 
					{
						'jocId': joc.id
						,'players':joc.players
						, 'currentplayerindex':p}});
			}
		}
	});	
	
    socket.on('handshaking', function (data) {
		console.log('id-ul este: ' + socket.id);
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

	function getJoc(indexJoc){
	
		if(indexJoc<=onlineBattlesMircea.length){
			return onlineBattlesMircea[indexJoc];
		}
		return null;
	}
	
	function findPlayer(joc, name){
		for(p in joc.players){
			if(joc.players[p].userdata.username == name){
				return joc.players[p];
			}
		}
		return null;
	}
	
	function poateSaLiciteze(joc, player){
		for(p in joc.players){
	
			if(joc.players[p].id == player.id){
			
				if(joc.players[p].licitare==-1){
					return true;
				}
			}
			
			if(player.licitare == -1)
			 {
			 return false;
			 }
		}
	}
	
    socket.on('licitatii', function(data){
    	var user = data.user;
    	var licitat = data.cate;
		console.log("licitatii jocId "+data)
		var jocCurent = getJoc(data.jocId);
		console.log("licitatii joc "+jocCurent)
		if(jocCurent){
			var player = findPlayer(jocCurent, data.user);
			console.log("licitatii player "+player)
			if(player && poateSaLiciteze(jocCurent, player)){
			player.licitare = licitat;
			
			if(player.id ==nr_jucatori )
			{
			
				//am ajuns sa liciteze ultimul player => s-a incheiat licitatia
				//gasim cine a licitat cel mai mult si notificam corespunzator
				
				var max = -1;
				var winner = -1;
				for(p in jocCurent.players){
					if(max< jocCurent.players.licitare)
					{
					   max = jocCurent.players.licitare;
					   winner = p;
					}
				}
				//am aflat castigatorul si licitarea maxima
				for(p in jocCurent.players){					
						jocCurent.sockets[p].emit('licitatii', {player: player, jocId: jocCurent.jocId, finish:true});
				}
				
			}
			}
		}
	});

	socket.on('licitatii_vechi', function(data){
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
		onlineBattles[data.battleId]
		var tromf = licitatii[data.battleID]['tromf'];
		var cardValue = data.cardValue;
		var cardColor = data.cardColor;
		//daca exista deja o cerere
		if(licitatii[data.battleID]['cerere'] != undefined ){
			var castigator = check_carte(licitatii[data.battleID]['cerere'], cardValue, cardColor, tromf);
			for(index in onlineBattles){
				console.log('index din online battles = ' + index);
				console.log('online battles = ' + onlineBattles[index]);
				//trimitem mesaj de castig la toti jucatorii
				for(clienti in onlineBattles[index]){
					var id = onlineBattles[index][clienti];
					var c_obj_win = clients[users.indexOf(id)];
					c_obj_win.emit('tura_incheiata', {'castigator':castigator, 'trimis_la':id});
					if(1==2){
						c_obj_win.emit('joc_incheiat', {'castigator': calculeaza_castigator(data.battleID) });
					}
				}
			}



			
			licitatii[data.battleID]['cerere'] = undefined;
		}else{
			
			var cerere = {
				'cardValue': cardValue,
				'cardColor': cardColor
			}
			licitatii[data.battleID]['cerere'] = cerere;
			
			var userIndex = onlineBattles[data.battleID].indexOf(data.user);
			
			if(userIndex){
			clients[users.indexOf(onlineBattles[data.battleID][0])].emit('cerere', {'cerere': cerere});
		}else{
			clients[users.indexOf(onlineBattles[data.battleID][1])].emit('cerere', {'cerere': cerere});
		}
		}
    })

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

	function calculeaza_castigator(battleID){
	}
	
    function check_carte(cerere, ofertaValue, ofertaColor, tromf){
		return users[0];
    }

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

	
	function getAllCards(){
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
		return deck;
	}

	
    function create_game(){
		deck = getAllCards();
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

    function setDeckMircea(deck){
    	var myDeck = new Array();
    	for(var i=1; i<=6; i++){
			var randomnumber = Math.floor(Math.random()*24)
			myDeck.push(deck[randomnumber]);
			deck.slice(randomnumber, 1);
		}
		return myDeck;
	}

});
