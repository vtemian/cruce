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
	
	$("#submit").click(function(){
		username = $('#user').val();
		socket = io.connect('http://localhost:5555');
		socket.on('identified', function(){
			socket.emit('handshaking', { user: username });
		})
		$('#connection').remove();
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
		socket.on('licitatii', function(data){
			$('#nrLicitatii').empty();
			$('#nrLicitatii').append(data.licitatie.cate);
			$('#nrLicitatii').append(data.licitatie.user);
			battleID = data.battleID;
			licitatii ++;
			if(licitat && licitatii == 2){
				socket.emit('licitatiiOver', {'battleID': data.battleID})			
			}
			else
				turn = true;
		});
		socket.on('sealegetromf', function(){
			alert('Se alege tromful');
			$('#licitatii').toggleClass('visible');
		});
		socket.on('alegetromf', function(){
			$('#licitatii').toggleClass('visible');
			$('#tromfii').toggleClass('visible');
		});
		$('.tromf').live('click', function(){
			var value = $(this).data('value');
			socket.emit('tromf', {'battleID':battleID, 'tromf':value, 'username':username});
			$('#tromfii').toggleClass('visible');
			turaCarti = true;
		});
		socket.on('tromfAles', function(data){
			tromf = data.tromf;
		});
		socket.on('cerere', function(data){
			cerere = data.cerere;
			$('#cerere').html(cerere.cardValue + cerere.cardColor);
			turaCarti = true;
		});
	});
	
	$('.cate').live('click', function(){
		var value = $(this).data('value');
		if(turn && !licitat)
			{socket.emit('licitatii', {'user': username, 'cate': value});licitat = true;}
		else
			alert('Nu-i tura ta!');
	});
	
	
	
	$('.carte').live('click', function(){
	
		if(turaCarti){
			if(cerere){
				if(checCerere($(this))){
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
			
		}
	});
	
	
	function checkCerere(card){
		var cardValue = card.data('cardValue');
		var cardColor = card.data('cardColor');
		
		return false;
	}	
	
})
