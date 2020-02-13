//declarar objetos comunes
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
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
		game.backgroundMusic = loader.loadSound('Assets/audio/gurdonark-kindergarten');
		game.slingshotReleasedSound = loader.loadSound('Assets/audio/released');
		game.bounceSound = loader.loadSound('Assets/audio/bounce');
		game.breakSound = {
			"glass":loader.loadSound('Assets/audio/glassbreak'),
			"wood":loader.loadSound('Assets/audio/woodbreak')
		};
		mouse.init();

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
	maxSpeed:3,
	minOffset:0,
	maxOffset:300,
	offsetLeft:0,
	score:0,

	panTo:function(newCenter){
		if(Math.abs(newCenter-game.offsetLeft-game.canvas.width/4)>0
			&& game.offsetLeft<= game.maxOffset && game.offsetLeft >= game.minOffset){

			var deltaX = Math.round((newCenter-game.offsetLeft-game.canvas.width/4)/2);
			if(deltaX && Math.abs(deltaX)>game.maxSpeed){
				deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
			}
			game.offsetLeft +=deltaX;
		}else{
			return true;
		}
		if(game.offsetLeft < game.minOffset){
			game.offsetLeft = game.maxOffset;
			return true;
		}
		return false;
	},

	handlePanning: function(){
		if(game.mode == "intro"){
			if(game.panTo(700)){
				game.mode = "load-next-hero";
			}
		}
		if(game.mode == "wait-for-firing"){
			if(mouse.dragging){
				game.panTo(mouse.X + game.offsetLeft)
			}else{

				game.panTo(game.slingshotX);
			}
		}
		if(game.mode == "load-next-hero"){
			//TO DO:
			//comprobar si hay villanos vivos
			//comprobar si quedan heroes
			//cargar heroe y fijar a modo espera a disparar
			game.mode ="wait-for-firing";
		}
		if(game.mode == "firing"){
			game.panTo(fame.slingshotX);
		}
		if(game.mode == "fired"){
			//TO DO:
			//Hacer barrido hasta donde se encuentre el heroe

		}
	},
	animate:function(){
		//anima fondo
		game.handlePanning();
		//anima personajes
		//dibuja fondo con desplazamiento
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
			entities: [
			{type:"block", name:"wood", x:520, y:375, angle:90},
			{type:"villian", name:"burger", x:520, y:200, calories:90}]
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

		game.currentLevel = {number:number,hero:[]};
		game.score = 0;
		$('#score').html('Score: '+game.score);
		var level = levels.data[number];

		game.currentLevel.backgroundImage = loader.loadImage("Assets/images/backgrounds/" + level.background+".png");
		game.currentLevel.foregroundImage = loader.loadImage("Assets/images/backgrounds/" + level.foreground+".png");
		game.slingshotImage = loader.loadImage("Assets/images/slingshot.png");
		game.slingshotFrontImage = loader.loadImage("Assets/images/slingshot-front.png");

		// Cargar todas la entidades
		for (var i = level.entities.length - 1; i >= 0; i--){	
			var entity = level.entities[i];
			entities.create(entity);			
		};
		//llamar a game.start() cuando se carguen los assets
		if(loader.loaded){
			game.start()
		}else {
			loader.onload = game.start;
		}
	}

}	

var entities = {
	definitions:{
		"glass":{
			fullHealth:100,
			density:2.4,
			friction:0.4,
			restitution:0.15,
		},
		"wood":{
			fullHealth:500,
			density:0.7,
			friction:0.4,
			restitution:0.4,
		},
		"dirt":{
			density:3.0,
			friction:1.5,
			restitution:0.2,
		},
		"burger":{
			shape:"circle",
			fullHealth:40,
			radius:25,
			density:1,
			friction:0.5,
			restitution:0.4,
		},
		"sodacan":{
			shape:"rectangle",
			fullHealth:80,
			width:40,
			height:60,
			density:1,
			friction:0.5,
			restitution:0.7,
		},
		"fries":{
			shape:"rectangle",
			fullHealth:50,
			width:40,
			height:50,
			density:1,
			friction:0.5,
			restitution:0.6,
		},
		"apple":{
			shape:"circle",
			radius:25,
			density:1.5,
			friction:0.5,
			restitution:0.4,
		},
		"orange":{
			shape:"circle",
			radius:25,
			density:1.5,
			friction:0.5,
			restitution:0.4,
		},
		"strawberry":{
			shape:"circle",
			radius:15,
			density:2.0,
			friction:0.5,
			restitution:0.4,
		}
	},
	create:function(entity){
		var definition = entities.definitions[entity.name];
		if(!definition){
			console.log("Undefined entity name", entity.name);
			return;
		}
		switch(entity.type){
			case "block":
				entity.health = definition.fullHealth;
				entity.fullHealth = definition.fullHealth;
				entity.shape = "rectangle";
				entity.sprite = loader.loadImage("Assets/images/entities/"+entity.name+".png");
				box2d.createRectangle(entity,definition);
				break;
			case "ground":
				entity.shape = rectangle;

				box2d.createRectangle(entity,definition);
				break;
			case "hero": //circulos simples
			case "villian":
				entity.health = definition.fullHealth;
				entity.fullHealth = definition.fullHealth;
				entity.sprite = loader.loadImage("Assets/images/entities/"+entity.name+ ".png");
				entity.shape = definition.shape;
				entity.bounceSound = game.bounceSound;
				if(definition.shape == "circle"){
					entity.radius = definition.radius;
					box2d.createCircle(entity,definition);
				}else if(definition.shape == "rectangle"){
					entity.width = definition.width;
					entity.height = definition.height;
					box2d.createRectangle(entity,definition);
				}
				break;
			default:
				console.log("Undefined entity type",entity.type);
				break;	
		}
	},

	draw:function(entity,position,angle){

	}
}
var box2d = {
	scale:30,
	init:function(){
		var gravity = new b2Vec2(0,9.8);
		var allowSleep = true;
		box2d.world = new b2World(gravity,allowSleep);
	},

		createRectangle:function(entity,definition){
			var bodyDef = new b2BodyDef;
			if(entity.isStatic){
				bodyDef.type = b2Body.b2_staticBody;
			}else{
				bodyDef.type = b2Body.b2_dynamicBody;
			}

			bodyDef.position.x = entity.x/box2d.scale;
			bodyDef.position.y = entity.y/box2d.scale;

			if(entity.angle){
				bodyDef.angle = Math.PI*entity.angle/180;
			}

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = definition.density;
			fixtureDef.friction = definition.friction;
			fixtureDef.restitution = definition.restitution;

			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox(entity.width/2/box2d.scale.entity.height/2/box2d.scale);

			var body = box2d.world.CreateBody(bodyDef);
			body.SetUserdata(entity);

			var fixture = body.CreateFixture(fixtureDef);
			return body;
		},

		createCircle:function(entity,definition){
			var bodyDef = new b2BodyDef;
			if(entity.isStatic){
				bodyDef.type = b2Body.b2_staticBody;
			}else{
				bodyDef.type = b2Body.b2_dynamicBody;
			}

			bodyDef.position.x = entity.x/box2d.scale;
			bodyDef.position.y = entity.y/box2d.scale;

			if(entity.angle){
				bodyDef.angle = Math.PI*entity.angle/180;
			}

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = definition.density;
			fixtureDef.friction = definition.friction;
			fixtureDef.restitution = definition.restitution;

			fixtureDef.shape = new b2CircleShape(entity.radius/box2d.scale);

			var body = box2d.world.CreateBody(bodyDef);
			body.SetUserdata(entity);

			var fixture = body.CreateFixture(fixtureDef);
			return body;

		},
	
}
var loader = {
	loaded:true,
	loadedCount: 0, //contador de assets cargados antes
	totalCount:0, // numero total assets que es necesario cargar

	init:function(){

		var mp3Support, oggSupport;
		var audio = document.createElement('audio');
		if(audio.canPlayType){
			mp3Support = "" != audio.canPlayType('audio/mpeg');
			oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');

		}else{
			//etiqueta de audio no soportada
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

	soundFileExtn:".ogg",
	loadSound: function(url){
		this.totalCount++;
		this.loaded = false;
		$('#loadingscreen').show();
		var audio = new Audio();
		audio.src = url+loader.soundFileExtn;
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
var mouse = {
	x:0,
	y:0,
	down:false,
	init:function(){
		$('#gamecanvas').mousemove(mouse.mousemovehandler);
		$('#gamecanvas').mousedown(mouse.mousedownhandler);
		$('#gamecanvas').mouseup(mouse.mouseuphandler);
		$('#gamecanvas').mouseout(mouse.mouseouthandler);
	},
	mousemovehandler:function(ev){
		var offset = $('#gamrcanvas').offset();
		mouse.x = ev.pageX - offset.left;
		mouse.y = ev.pageY - offset.top;

		if(mouse.down){
			mouse.dragging = true;
		}
	},
	mousedownhandler:function(ev){
		mouse.down = true;
		mouse.downX = mouse.x;
		mose.downY = mouse.y;
		ev.originalEvent.preventDefault();

	},
	mouseuphandler:function(ev){
		mouse.down = false;
		mose.dragging = false;
	}
}
