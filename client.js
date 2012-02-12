$(document).ready(function(){
	var socket;
	var username = '';
	var turn;
	var licitat = false;
	var enemy = '';
	var battleID;
	var tromf;
	var licitatii = 0;
	var deck;
	var turaCarti = false;
	var nrTure = 0;
	var cerere;
	var jocCurent;
	
	$("#submit").click(function(){
		username = $('#user').val();
		socket = io.connect('http://localhost:5555');
		socket.on('identified', function(){
			//socket.emit('handshaking', { user: username });
			console.log('trimit join_new_game');
			socket.emit('join_new_game', { user: username });
		})
		$('#connection').remove();
		$('.tromf').live('click', function(){
			var value = $(this).data('value');
			socket.emit('tromf', {'battleID':battleID, 'tromf':value, 'username':username});
			$('#tromfii').toggleClass('visible');
			turaCarti = true;
		});
		socket.on('online', function(data){
			$('#online').html(data.online);
		})
		socket.on('battle', function(data){
			$('#status').html('You are playing with '+ data.enemy);
			turn = data.free;
			$('#licitatii').toggleClass('visible');
			enemy = data.enemy;
			deck = data.deck;
			$('#carti').toggleClass('visible');
			
			$.each($('.carte'), function(index, value){
				$(value).html(deck[index].cardValue + deck[index].cardColor);
				$(value).data('cardValue', deck[index].cardValue);
				$(value).data('cardColor', deck[index].cardColor);
			});
			
		})

		socket.on('startbattle', function(data){
			var enemy = '';
			jocCurent = data.joc;
			for(p in data.joc.players){
				enemy += data.joc.players[p].userdata.user + '; ';
			}
			$('#status').html('You are playing with '+ enemy);
			turn = username == data.joc.players[0].userdata.user;
			$('#licitatii').toggleClass('visible');
			deck = data.joc.players[data.joc.currentplayerindex].hand;
			$('#carti').toggleClass('visible');
			
			$.each($('.carte'), function(index, value){
				$(value).html(deck[index].cardValue + deck[index].cardColor);
				$(value).data('cardValue', deck[index].cardValue);
				$(value).data('cardColor', deck[index].cardColor);
			});
			
		})
		
		socket.on('licitatii', function(data){
		if(data.finish == true)
		{
			$('#nrLicitatii').empty();
			$('#nrLicitatii').append("Licitatia s-a terminat castigarul este:");
			$('#nrLicitatii').append(data.player.licitare);
			$('#nrLicitatii').append(data.player.username);
			return;
		
		}
		
		
		alert(data.player.licitare + " - "+ data.player.username);
			//$('#nrLicitatii').empty();
			
			$('#nrLicitatii').append(data.player.licitare);
			$('#nrLicitatii').append(data.player.username);
			battleID = data.battleID;
			licitatii ++;
			if(licitat && licitatii == 2){
				socket.emit('licitatiiOver', {'battleID': data.battleID})			
			}
			else
				turn = true;
		});
		
		
		socket.on('licitatii_vechi_modificat', function(data){
		if(data.finish == true)
		{
			$('#nrLicitatii').empty();
			$('#nrLicitatii').append("Licitatia s-a terminat castigarul este:");
			$('#nrLicitatii').append(data.player.licitare);
			$('#nrLicitatii').append(data.player.username);
			
			socket.emit('licitatiiOver', {'battleID': data.battleID})			
			turn = true;

			
			return;
		}
		
			//$('#nrLicitatii').empty();
			$('#nrLicitatii').append(data.player.licitare);
			$('#nrLicitatii').append(data.player.username);
			
		});
		
		
		socket.on('sealegetromf', function(){
			alert('Se alege tromful');
			$('#licitatii').toggleClass('visible');
		});
		socket.on('alegetromf', function(){
			$('#licitatii').toggleClass('visible');
			$('#tromfii').toggleClass('visible');
		});
		socket.on('tromfAles', function(data){
			tromf = data.tromf;
		});
		socket.on('cerere', function(data){
			cerere = data.cerere;
			$('#cerere').html(cerere.cardValue + cerere.cardColor);
			turaCarti = true;
		});
		socket.on('tura_incheiata', function(data){
			$('#cerere').html('');
			console.log('castigator = ' + data);
			if(data.castigator == username){
				turaCarti = true;
			}else{
				turaCarti = false;
			}
		});

		socket.on('newplayeronline', function(data){
			$('#newplayeronline').html(data.id + ':' + data.player.userdata.user);
		})

		
	});
	
	$('.cate').live('click', function(){
		var value = $(this).data('value');
		console.log(jocCurent);
		if(!licitat)
		{
			socket.emit('licitatii', {'jocId':jocCurent.jocId,'user': username, 'cate': value});
			licitat = true;
		}else
			alert('Nu-i tura ta sa licitezi! Ai licitat deja asteapta');
	});
	
	$('.carte').live('click', function(){
	
		if(turaCarti){
			if(cerere){
				if(checkCerere($(this))){
					cerere = false;
					socket.emit('oferta', {'battleID': battleID, 'user':username, 'cardValue':$(this).data('cardValue'), 'cardColor':$(this).data('cardColor')});
				}else{
					alert('Nu poti sa dai cartea asta!');
				}
			}
			else{
				socket.emit('oferta', {'battleID': battleID, 'user':username, 'cardValue':$(this).data('cardValue'), 'cardColor':$(this).data('cardColor')});	
				
				var index = $('.carte').index($(this));
				deck.splice(index, 1);
				
				
			}
			turaCarti = false;
			//console.log('am emis oferta:');
			var index = $('.carte').index($(this));
			deck.splice(index, 1);
			$(this).remove();
		}else{
			alert('nu este randul tau!');
		}
	});
	
	
	function checkCerere(card){
		var cardValue = card.data('cardValue');
		var cardColor = card.data('cardColor');
		
		return true;
	}	
	
})
