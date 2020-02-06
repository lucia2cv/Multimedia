//preparar animaciones 
(function(){
	var lastTime=0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0;  x < vendors.length && !window.requestAnimationFrame; ++x){
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+ 'CancelAnimationFrame'] || window [vendors[x] + 'CancelAnimationFrame'];
	}
	if(!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element){
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function(){callback(currTime + timeToCall);}, timeToCall);
			lastTime = currTime +timeToCall;
			return id;
		};

	if(!window.CancelAnimationFrame)
		window.CancelAnimationFrame = function (id){
			clearTimeout(id);
		};	
	
}());
$(window).load(function(){
	game.init();
});

var game = {
	//comenzar inicializacion de objetos, precarga elementos y pantalla de inicio
	init: function(){
		//inicializar objetos
		levels.init();

		//inicializar assets
		loader.init();
		//ocultar todas las capas del juego menos la pantalla de inicio
		$('.gamelayer').hide();
		$('#gamestartscreen').show();

		//obtener manejadores

		game.canvas = $('#gamecanvas')[0];
		game.context = game.canvas.getContext('2d');
	},
	showLevelScreen:function(){
		$('#gamestartscreen').hide();
		$('#levelselectscreen').show('slow');
	},

	//modo Game
	mode: "intro",
	slingshotX:140,
	slingshotY:280,
	
	start: function(){
		$('.gamelayer').hide();
		$('#gamecanvas').show();
		$('#scorescreen').show();

		game.mode = "intro";
		game.offsetLeft = 0;
		game.ended = false;
		game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
	},

	handlePanning: function(){
		game.offsetLeft++; 
	},
	animate:function(){
		game.handlePanning();

		game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
		game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);
		
		//honda
		game.context.drawImage(game.slingshotImage,game.slingshotX - game.offsetLeft, game.slingshotY);
		game.context.drawImage(game.slingshotFrontImage,game.slingshotX - game.offsetLeft, game.slingshotY);

		if(!game.ended){
			game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);

		}
	}
}


var levels = {
	data:[
		//primer nivel
		{
			foreground: 'desert-foreground',
			background: 'clouds-background',
			entities: []
		},
		//segundo nivel
		{
			foreground: 'desert-foreground',
			background: 'clouds-background',
			entities: []
		}

	],
	// inicializar pantalla de seleccion

	init: function(){
		var html = "";
		for (var i=0; i<levels.data.length; i++){
			var level = levels.data[i];
			html += '<input type="button" value="' + (i+1)+'">';
		};
		$('#levelselectscreen').html(html);
		//controladores de eventos
		$('#levelselectscreen input').click(function(){
			levels.load(this.value-1);
			$('#levelselectscreen').hide();
		});
	},	

	//cargar todos los datos
	load:function(number){

		game.currentLevel = {number: number,hero: []};
		game.score = 0;
		$('#score').html('Score: '+game.score);
		var level = levels.data[number];

		game.currentLevel.backgroundImage = loader.loadImage("Assets/images/background/" + level.background+".png");
		game.currentLevel.foregroundImage = loader.loadImage("Assets/images/foreground/" + level.background+".png");
		game.slingshotImage = loader.loadImage("Assets/images/slingshot.png");
		game.slingshotFrontImage = loader.loadImage("Assets/images/slingshot-front.png");

		//llamar a game.start() cuando se carguen los assets
		if(loader.loaded){
			game.start()
		}else {
			loader.onload = game.start;
		}
	}

}	
var loader = {
	loaded:true,
	loadedCount: 0, //contador de assets cargados antes
	totalCount:0, //assets que es necesario cargar

	init:function(){

		var mp3Support, oggSupport;
		var audio = document.createElement('audio');
		if(audio.canPlayType){
			mp3Support = "" != audio.canPlayType('audio/mpeg');
			oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');

		}else{
			mp3Support = false;
			oggSupport = false;
		}

		loader.soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;
	},

	loadImage:function(url){
		this.totalCount++;
		this.loaded = false;
		$('#loadingscreen').show();
		var image = new Image();
		image.src = url;
		image.onload = loader.itemLoaded;
		return image;
	},

	soundFileExtn: ".ogg",
	loadSound: function(url){
		this.totalCount++;
		this.loaded = false;
		$('#loadingscreen').show();
		var audio = new Audio();
		audio.src = url +loader.soundFileExtn;
		audio.addEventListener("canplaythrough", loader.itemLoaded, false);
		return audio;
	},
	itemLoaded:function(){
		loader.loadedCount++;
		$('#loadingmessage').html('Loaded ' + loader.loadedCount+' of '+loader.totalCount);
		if ((loader.loadedCount === loader.totalCount)) { 

			loader.loaded = true;
			$('#loadingscreen').hide();

			if(loader.onload){
				loader.onload();
				loader.onload = undefined;
			}
		}
	}
}
