$(window).load(function(){
	game.init();
});

var game = {
	//comenzar inicializacion de objetos, precarga elementos y pantalla de inicio
	init: function(){
		//ocultar todas las capas del juego menos la pantalla de inicio
		$('.gamelayer').hide();
		$('#gamestartscreen').show();

		//obtener manejadores

		game.canvas = $('#gamecanvas')[0];
		game.context = game.canvas.getContext('2d');
	},
}