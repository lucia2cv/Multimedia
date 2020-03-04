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
		game.backgroundMusic = loader.loadSound('Assets/audio/backgroundMusic');
		game.slingshotReleasedSound = loader.loadSound('Assets/audio/released');
		game.bounceSound = loader.loadSound('Assets/audio/bounce');
		game.breakSound = {
			"cristales":loader.loadSound('Assets/audio/glassbreak'),
			"panel":loader.loadSound('Assets/audio/woodbreak')
		};
		mouse.init();

		//ocultar todas las capas del juego menos la pantalla de inicio
		$('.gamelayer').hide();
		$('#gamestartscreen').show();

		//obtener manejadores

		game.canvas = $('#gamecanvas')[0];
		game.context = game.canvas.getContext('2d');
	},
	startBackgroundMusic:function(){
		var toggleImage = $("#togglemusic")[0];	
		game.backgroundMusic.play();
		toggleImage.src="Assets/images/icons/soundOn.png";	
	},
	stopBackgroundMusic:function(){
		var toggleImage = $("#togglemusic")[0];	
		toggleImage.src="Assets/images/icons/soundOff.png";	
		game.backgroundMusic.pause();
		game.backgroundMusic.currentTime = 0; // Ir al comienzo de la canción
	},
	toggleBackgroundMusic:function(){
		var toggleImage = $("#togglemusic")[0];
		if(game.backgroundMusic.paused){
			game.backgroundMusic.play();
			toggleImage.src="Assets/images/icons/soundOn.png";
		} else {
			game.backgroundMusic.pause();	
			$("#togglemusic")[0].src="Assets/images/icons/soundOff.png";
		}
	},
	showLevelScreen:function(){
		$('#gamestartscreen').hide();
		$('#levelselectscreen').show('slow');
		$('#endingscreen').hide();
	},

	restartLevel:function(){
		window.cancelAnimationFrame(game.animationFrame);		
		game.lastUpdateTime = undefined;
		if(game.currentHero != undefined){
			box2d.world.DestroyBody(game.currentHero);
			game.currentHero = undefined;
		}
		levels.load(game.currentLevel.number);
	},
	startNextLevel:function(){
		window.cancelAnimationFrame(game.animationFrame);		
		game.lastUpdateTime = undefined;
		levels.load(game.currentLevel.number+1);
	},

	//modo Game
	mode: "intro",
	slingshotX:140,
	slingshotY:280,
	
	start: function(){
		$('.gamelayer').hide();
		$('#gamecanvas').show();
		$('#scorescreen').show();

		game.startBackgroundMusic();

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
		if (Math.abs(newCenter-game.offsetLeft-game.canvas.width/4)>0 
		&& game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset){
	
			var deltaX = Math.round((newCenter-game.offsetLeft-game.canvas.width/4)/2);
			if (deltaX && Math.abs(deltaX)>game.maxSpeed){
				deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
			}
			game.offsetLeft += deltaX; 
		} else {
			
			return true;
		}
		if (game.offsetLeft <game.minOffset){
			game.offsetLeft = game.minOffset;
			return true;
		} else if (game.offsetLeft > game.maxOffset){
			game.offsetLeft = game.maxOffset;
			return true;
		}		
		return false;
	},
	countHeroesAndVillains:function(){
		game.heroes = [];
		game.villains = [];
		for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
			var entity = body.GetUserData();
			if(entity){
				if(entity.type == "hero"){	
					body.destroyState = false;
					body.destroyFinished = false;			
					game.heroes.push(body);			
				} else if (entity.type =="villain"){
					game.villains.push(body);
				}
			}
		}
	},

	mouseOnCurrentHero:function(){
		if(!game.currentHero){
			return false;
		}
		var position = game.currentHero.GetPosition();
		var distanceSquared = Math.pow(position.x*box2d.scale - mouse.x-game.offsetLeft,2) + Math.pow(position.y*box2d.scale-mouse.y,2);
		var radiusSquared = Math.pow(game.currentHero.GetUserData().radius,2);		
		return (distanceSquared<= radiusSquared);	
	},

	handlePanning: function(){
		if(game.mode=="intro"){		
			if(game.panTo(700)){
				game.mode = "load-next-hero";
				console.log(game.mode);
			}			 
		}	   

		if (game.mode=="wait-for-firing"){  
		 if (mouse.dragging){
			 if (game.mouseOnCurrentHero()){
				 game.mode = "firing";
			 } else {
				 game.panTo(mouse.x + game.offsetLeft)
			 }
		 } else {
			 game.panTo(game.slingshotX);
		 }
	 }

	 if (game.mode == "firing"){  
		 if(mouse.down){
			 game.panTo(game.slingshotX);				
			 game.currentHero.SetPosition({x:(mouse.x+game.offsetLeft)/box2d.scale,y:mouse.y/box2d.scale});
		 } else {
			 game.mode = "fired";
			 game.slingshotReleasedSound.play();								
			 var impulseScaleFactor = 0.75;
			 
			 // Coordenadas del centro de la honda (donde la banda estÃ¡ atada a la honda)
			 var slingshotCenterX = game.slingshotX + 35;
			 var slingshotCenterY = game.slingshotY+25;
			 var impulse = new b2Vec2((slingshotCenterX -mouse.x-game.offsetLeft)*impulseScaleFactor,(slingshotCenterY-mouse.y)*impulseScaleFactor);
			 game.currentHero.ApplyImpulse(impulse,game.currentHero.GetWorldCenter());

		 }
	 }

	 if (game.mode == "fired"){		
		 //Vista panorÃ¡mica donde el hÃ©roe se encuentra actualmente...
		 var heroX = game.currentHero.GetPosition().x*box2d.scale;
		 game.panTo(heroX);

		 var entity = game.currentHero.GetUserData();
		if( entity.name == "meteor2"){
			if(mouse.down && !entity.propulsed){
				entity.propulsed = true;
				var x = game.currentHero.m_linearVelocity.x*4;
				var y = game.currentHero.m_linearVelocity.y*4;
				var propulsion = new b2Vec2(x,y);
				game.currentHero.ApplyImpulse(propulsion,game.currentHero.GetPosition());
			}
		
		}
		//comprobar si va muy despacio para iniciar la cuenta atras de destrucción
		if(game.currentHero.m_linearVelocity.x > -1 && game.currentHero.m_linearVelocity.x < 1 && game.currentHero.m_linearVelocity.y > -1 && game.currentHero.m_linearVelocity.y < 1 && !game.currentHero.destroyState){
			game.currentHero.destroyState = true;
			setTimeout(game.destroySlowHero,3000,game.currentHero);
		}

		 //Y esperar hasta que deja de moverse o estÃ¡ fuera de los lÃ­mites o se mueva muy despacio demasiado tiempo
		 if(!game.currentHero.IsAwake() || heroX<0 || heroX >game.currentLevel.foregroundImage.width || game.currentHero.destroyFinished ){
			 // Luego borra el viejo hÃ©roe
			 box2d.world.DestroyBody(game.currentHero);
			 game.currentHero = undefined;
			 // y carga el siguiente hÃ©roe
			 game.mode = "load-next-hero";
		 }
	 }
	 

	 if (game.mode == "load-next-hero"){
		 game.countHeroesAndVillains();
		console.log(game);
		 // Comprobar si algÃºn villano estÃ¡ vivo, si no, termine el nivel (Ã©xito)
		 if (game.villains.length == 0){
			 game.mode = "level-success";
			 return;
		 }

		 // Comprobar si hay mÃ¡s hÃ©roes para cargar, si no terminar el nivel (fallo)
		 if (game.heroes.length == 0){
			 game.mode = "level-failure"	
			 return;		
		 }

		 // Cargar el hÃ©roe y establecer el modo de espera para disparar (wait-for-firing)
		 if(!game.currentHero){
			 game.currentHero = game.heroes[game.heroes.length-1];
			 game.currentHero.SetPosition({x:180/box2d.scale,y:200/box2d.scale});
			  game.currentHero.SetLinearVelocity({x:0,y:0});
			  game.currentHero.SetAngularVelocity(0);
			 game.currentHero.SetAwake(true);				
		 } else {
			 // Esperar a que el hÃ©roe deje de rebotar y se duerma y luego cambie a espera para disparar (wait-for-firing)
			 game.panTo(game.slingshotX);
			 if(!game.currentHero.IsAwake()){
				 game.mode = "wait-for-firing";
				 console.log(game.mode);
			 }
		 }
		}	

		 if(game.mode=="level-success" || game.mode=="level-failure"){		
			 if(game.panTo(0)){
				 game.ended = true;					
				 game.showEndingScreen();
			 }			 
		 }
		 
	},

	destroySlowHero:function(hero){
		hero.destroyFinished = true;
	},

	showEndingScreen:function(){
		game.stopBackgroundMusic();				
		if (game.mode=="level-success"){			
			if(game.currentLevel.number<levels.data.length-1){
				$('#endingmessage').html('Level Complete. Well Done!!!');
				$("#playnextlevel").show();
			} else {
				$('#endingmessage').html('All Levels Complete. Well Done!!!');
				$("#playnextlevel").hide();
			}
		} else if (game.mode=="level-failure"){			
			$('#endingmessage').html('Failed. Play Again?');
			$("#playnextlevel").hide();
		}		

		$('#endingscreen').show();
	},

	animate:function(){
		//anima fondo
		game.handlePanning();
		//anima personajes
		var currentTime = new Date().getTime();
		var timeStep;
		if (game.lastUpdateTime){
			timeStep = (currentTime - game.lastUpdateTime)/1000;
			if(timeStep >2/60){
				timeStep = 2/60
			}
			box2d.step(timeStep);
		} 
		game.lastUpdateTime = currentTime;


		//dibuja fondo con desplazamiento de paralaje
		game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
		game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);
		
		//honda
		game.context.drawImage(game.slingshotImage,game.slingshotX - game.offsetLeft, game.slingshotY);

		// Dibujar todos los cuerpos
		game.drawAllBodies();

		//dibujar la banda
		if(game.mode == "wait-for-firing"|| game.mode == "firing"){
			game.drawSlingshotBand();
		}

		//dibujar frente de la honda
		game.context.drawImage(game.slingshotFrontImage,game.slingshotX - game.offsetLeft, game.slingshotY);

		if(!game.ended){
			game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);

		}
	},
	drawAllBodies:function(){  
		box2d.world.DrawDebugData();	

		// Iterar a través de todos los cuerpos y dibujarlos en el lienzo del juego		  
		for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
			var entity = body.GetUserData();
  
			if(entity){
				var entityX = body.GetPosition().x*box2d.scale;
				if(entityX<0|| entityX>game.currentLevel.foregroundImage.width||(entity.health && entity.health <0)){
					box2d.world.DestroyBody(body);
					if (entity.type=="villain"){
						game.score += entity.calories;
						$('#score').html('Score: '+game.score);
					}
					if (entity.breakSound){
						entity.breakSound.play();
					}
				} else {
					entities.draw(entity,body.GetPosition(),body.GetAngle())				
				}	
			}
		}
	},

	drawSlingshotBand: function(){
		game.context.strokeStyle = "rgb(68,31,11)";
		game.context.lineWidth = 6;
		//angulo

		var radius = game.currentHero.GetUserData().radius;
		var heroX = game.currentHero.GetPosition().x*box2d.scale;
		var heroY = game.currentHero.GetPosition().y*box2d.scale;			
		var angle = Math.atan2(game.slingshotY+25-heroY,game.slingshotX+50-heroX);

		var heroFarEdgeX = heroX - radius * Math.cos(angle);
		var heroFarEdgeY = heroY - radius * Math.sin(angle);

		game.context.beginPath();
		game.context.moveTo(game.slingshotX+50-game.offsetLeft, game.slingshotY+25);

		game.context.lineTo(heroX-game.offsetLeft,heroY);
		game.context.stroke();

		entities.draw(game.currentHero.GetUserData(),game.currentHero.GetPosition(),game.currentHero.GetAngle());

		game.context.beginPath();		
		game.context.moveTo(heroFarEdgeX-game.offsetLeft,heroFarEdgeY);
	
		game.context.lineTo(game.slingshotX-game.offsetLeft +10,game.slingshotY+30)
		game.context.stroke();

	},
}

var levels = {
	data:[
		//primer nivel
		{
			foreground: 'moonForeground',
			background: 'aquarius',
			entities: [
				{type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"panel", x:185,y:390,width:30,height:80,isStatic:true},
	
				{type:"block", name:"panel", x:520,y:380,angle:90,width:100,height:25},
				{type:"block", name:"cristales", x:520,y:280,angle:90,width:100,height:25},								
				{type:"villain", name:"neptune",x:520,y:205,calories:590},
	
				{type:"block", name:"panel", x:620,y:380,angle:90,width:100,height:25},
				{type:"block", name:"cristales", x:620,y:280,angle:90,width:100,height:25},								
				{type:"villain", name:"tierra", x:620,y:205,calories:420},				
	
				{type:"hero", name:"meteor2",x:80,y:405},
				{type:"hero", name:"meteor1",x:140,y:405}
			]
		},
		//segundo nivel
		{
			foreground: 'mars',
			background: 'libraAzul',
			entities: [{type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
			{type:"ground", name:"panel", x:185,y:390,width:30,height:80,isStatic:true},

			{type:"block", name:"panel", x:820,y:380,angle:90,width:100,height:25},
			{type:"block", name:"panel", x:720,y:380,angle:90,width:100,height:25},
			{type:"block", name:"panel", x:620,y:380,angle:90,width:100,height:25},
			{type:"block", name:"cristales", x:670,y:317.5,width:100,height:25},
			{type:"block", name:"cristales", x:770,y:317.5,width:100,height:25},				

			{type:"block", name:"cristales", x:670,y:255,angle:90,width:100,height:25},
			{type:"block", name:"cristales", x:770,y:255,angle:90,width:100,height:25},
			{type:"block", name:"panel", x:720,y:192.5,width:100,height:25},	

			{type:"villain", name:"neptune",x:715,y:155,calories:590},
			{type:"villain", name:"tierra",x:670,y:405,calories:420},
			{type:"villain", name:"jupiter",x:765,y:405,calories:150},

			{type:"hero", name:"meteor3",x:30,y:415},
			{type:"hero", name:"meteor1",x:80,y:405},
			{type:"hero", name:"meteor2",x:140,y:405}
		]
		},
		//nivel 3
		{
			foreground: 'ice',
			background: 'gemini',
			entities: [{type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
			{type:"ground", name:"panel", x:185,y:390,width:30,height:80,isStatic:true},

			{type:"block", name:"panel", x:830,y:380,width:25,height:100},
			{type:"block", name:"panel", x:725.5,y:380,width:25,height:100},
			{type:"block", name:"panel", x:780,y:320,angle:90,width:25,height:250},

			{type:"block", name:"cristales", x:738,y:295,angle:90,width:100,height:25},
			{type:"block", name:"cristales", x:810, y:295,angle:90,width:100,height:25},
			
			{type:"block", name:"cristales", x:550,y:380,angle:90,width:225,height:25},
			{type:"block", name:"panel", x:447, y:380,angle:90,width:100,height:25},

			{type:"block", name:"cristales", x:650, y:200,angle:90,width:25,height:400},
			{type:"block", name:"panel", x:451.3, y:338,angle:90,width:25,height:169},
	
			{type:"villain", name:"tierra",x:765,y:380,calories:150},
			{type:"villain", name:"neptune",x:500,y:380,calories:420},
			{type:"villain", name:"jupiter",x:765,y:295,calories:150},

			{type:"hero", name:"meteor3",x:30,y:415},
			{type:"hero", name:"meteor2",x:80,y:405},
			{type:"hero", name:"meteor1",x:140,y:405}
		]
		},
		//nivel 4
		{
			foreground: 'scifiLandscape',
			background: 'cassiopeia',
			entities: [{type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
			{type:"ground", name:"panel", x:185,y:390,width:30,height:80,isStatic:true},

			{type:"block", name:"panel", x:495,y:380,angle:90,width:103,height:25},
			{type:"block", name:"cristales", x:405,y:380,angle:90,width:103,height:25},
			{type:"block", name:"panel", x:455,y:356,width:165,height:25},

			{type:"block", name:"cristales", x:450, y:280,angle:90,width:103,height:25},
			
			{type:"block", name:"panel", x:608, y:380,angle:90,width:230,height:25},
			{type:"block", name:"cristales", x:540, y:225, width:250,height:25},

			{type:"block", name:"cristales", x:700,y:380,angle:90,width:100,height:25},
			{type:"block", name:"cristales", x:760,y:380,angle:90,width:100,height:25},


			{type:"villain", name:"jupiter",x:550,y:390, calories:300},
			{type:"villain", name:"neptune",x:760,y:280, calories: 180},
			{type:"villain", name:"tierra",x:400,y:280, calories: 200},

			{type:"hero", name:"meteor1",x:30,y:415},
			{type:"hero", name:"meteor2",x:80,y:405},
			{type:"hero", name:"meteor3",x:140,y:405}
		]
		},
		//level 5
		{
			foreground: 'paisajePlantas',
			background: 'sagitario',
			entities: [{type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
			{type:"ground", name:"panel", x:185,y:390,width:30,height:80,isStatic:true},

			{type:"block", name:"cristales", x:530,y:310,angle:90,width:250,height:25},
			{type:"block", name:"cristales", x:820,y:310,angle:90,width:250,height:25},
			{type:"block", name:"cristales", x:655,y:170,width:445,height:25},

			{type:"block", name:"panel", x:625,y:380,angle:90,width:100,height:25},
			{type:"block", name:"cristales", x:710,y:380,angle:90,width:100,height:25},
			{type:"block", name:"panel", x:670,y:340,width:160,height:25},

			{type:"block", name:"panel", x:660, y:290, angle:90, width:100, height:25},

			{type:"villain", name:"neptune",x:640,y:290, calories: 200},
			{type:"villain", name:"jupiter",x:655,y:400, calories: 400},
			{type:"villain", name:"tierra",x:855,y:410, calories: 100},

			{type:"hero", name:"meteor1",x:30,y:415},
			{type:"hero", name:"meteor2",x:80,y:405},
			{type:"hero", name:"meteor3",x:140,y:405}
		]
		},

		//level 6
		{
			foreground: 'blueIce',
			background: 'capricorn',
			entities: [
			{type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
			{type:"ground", name:"panel", x:185,y:390,width:30,height:80,isStatic:true},

			{type:"block", name:"cristales", x:470,y:389,angle:90,width:100,height:25},
			{type:"block", name:"cristales", x:500,y:389,angle:90,width:100,height:25},
			{type:"block", name:"panel", x:470,y:289,angle:90,width:100,height:25},
			{type:"block", name:"panel", x:500,y:289,angle:90,width:100,height:25},

			{type:"block", name:"panel", x:650,y:389,width:200,height:25},
			{type:"block", name:"panel", x:575,y:363,angle:90,width:100,height:25},
			{type:"block", name:"panel", x:725,y:363,angle:90,width:100,height:25},
			{type:"block", name:"cristales", x:650,y:288,width:200,height:25},
			{type:"block", name:"cristales", x:650,y:263,angle:90,width:100,height:25},


			{type:"villain", name:"jupiter",x:650,y:360, calories: 400},
			{type:"villain", name:"tierra",x:650,y:163, calories: 200},
			{type:"villain", name:"neptune",x:485,y:189, calories: 200},


		/* 	{type:"block", name:"cristales", x:410,y:310,angle:90,width:250,height:25},
			{type:"block", name:"cristales", x:700,y:310,angle:90,width:250,height:25},
			{type:"block", name:"cristales", x:553,y:170,width:445,height:25},

			{type:"block", name:"panel", x:530,y:380,angle:90,width:100,height:25},
			{type:"block", name:"cristales", x:605,y:380,angle:90,width:100,height:25},
			{type:"block", name:"panel", x:560,y:335,width:160,height:25},

			{type:"block", name:"panel", x:590, y:290, angle:90, width:100, height:25},

			{type:"villain", name:"neptune",x:545,y:290},
			{type:"villain", name:"jupiter",x:555,y:400},
			{type:"villain", name:"tierra",x:735,y:410}, */

			{type:"hero", name:"meteor1",x:30,y:415},
			{type:"hero", name:"meteor2",x:80,y:405},
			{type:"hero", name:"meteor2",x:140,y:405}
		]
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
		box2d.init();
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
		"cristales":{
			fullHealth:100,
			density:2.4,
			friction:0.4,
			restitution:0.15,
		},
		"panel":{
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
		"neptune":{
			shape:"circle",
			fullHealth:40,
			radius:25,
			density:1,
			friction:0.5,
			restitution:0.4,
		},
		"jupiter":{
			shape:"circle",
			fullHealth:80,
			radius:30,
			density:1,
			friction:0.5,
			restitution:0.7,
		},
		"tierra":{
			shape:"circle",
			fullHealth:50,
			radius:20,
			density:1,
			friction:0.5,
			restitution:0.6,
		},
		"meteor1":{
			shape:"circle",
			radius:25,
			density:1.5,
			friction:0.5,
			restitution:0.4,
		},
		"meteor2":{
			shape:"circle",
			radius:25,
			density:1.5,
			friction:0.5,
			restitution:0.4
		},
		"meteor3":{
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
		//inicializar propulsion a desactivado
		if(entity.name == "meteor2"){
			entity.propulsed = false;
		}
		switch(entity.type){
			case "block":
				entity.health = definition.fullHealth;
				entity.fullHealth = definition.fullHealth;
				entity.shape = "rectangle";
				entity.sprite = loader.loadImage("Assets/images/entities/"+entity.name+".png");

				entity.breakSound = game.breakSound [entity.name];
				box2d.createRectangle(entity,definition);
				break;
			case "ground":
			
				entity.shape = "rectangle";
				box2d.createRectangle(entity,definition);
				break;
			case "hero": 
			case "villain":
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
		game.context.translate(position.x*box2d.scale-game.offsetLeft,position.y*box2d.scale);
		game.context.rotate(angle);
		switch (entity.type){
			case "block":
				game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
						-entity.width/2-1,-entity.height/2-1,entity.width+2,entity.height+2);	
			break;
			case "villain":
			case "hero": 
				if (entity.shape=="circle"){
					game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
							-entity.radius-1,-entity.radius-1,entity.radius*2+2,entity.radius*2+2);	
				} else if (entity.shape=="rectangle"){
					game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
							-entity.width/2-1,-entity.height/2-1,entity.width+2,entity.height+2);
				}
				break;				
			case "ground":
				// No hacer nada ... Vamos a dibujar objetos como el suelo y la honda por separado
				break;
		}

		game.context.rotate(-angle);
		game.context.translate(-position.x*box2d.scale+game.offsetLeft,-position.y*box2d.scale);
	}
}
var box2d = {
	scale:30,
	init:function(){
		var gravity = new b2Vec2(0,9.8);
		var allowSleep = true;
		box2d.world = new b2World(gravity,allowSleep);

		// Configurar depuración de dibujo
		var debugContext = document.getElementById('debugcanvas').getContext('2d');
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(debugContext);
		debugDraw.SetDrawScale(box2d.scale);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);	
		box2d.world.SetDebugDraw(debugDraw);

		var listener = new Box2D.Dynamics.b2ContactListener;
		listener.PostSolve = function(contact,impulse){
			var body1 = contact.GetFixtureA().GetBody();
			var body2 = contact.GetFixtureB().GetBody();
			var entity1 = body1.GetUserData();
			var entity2 = body2.GetUserData();

			var impulseAlongNormal = Math.abs(impulse.normalImpulses[0]);
			if(impulseAlongNormal > 5){
				if(entity1.health){
					entity1.health -= impulseAlongNormal;
				}
				if(entity2.health){
					entity2.health -= impulseAlongNormal;
				}

				if(entity1.bounceSound){
					entity1.bounceSound.play();
				}
				if(entity2.bounceSound){
					entity2.bounceSound.play();
				}
			}

		};
		box2d.world.SetContactListener(listener);
	},
	step:function(timeStep){
		// velocidad de las iteraciones = 8
		// posiciÃ³n de las iteraciones = 3
		box2d.world.Step(timeStep,8,3);
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
		fixtureDef.shape.SetAsBox(entity.width/2/box2d.scale,entity.height/2/box2d.scale);
		var body = box2d.world.CreateBody(bodyDef);
		body.SetUserData(entity);

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
		body.SetUserData(entity);

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
		if ((loader.loadedCount >= loader.totalCount)) { 

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
		$('#gamecanvas').mouseout(mouse.mouseuphandler);
	},
	mousemovehandler:function(ev){
		var offset = $('#gamecanvas').offset();
		
		mouse.x = ev.pageX - offset.left;
		mouse.y = ev.pageY - offset.top;
		
		if (mouse.down) {
			mouse.dragging = true;
		}
	},
	mousedownhandler:function(ev){
		mouse.down = true;
		mouse.downX = mouse.x;
		mouse.downY = mouse.y;
		ev.originalEvent.preventDefault();
		
	},
	mouseuphandler:function(ev){
		mouse.down = false;
		mouse.dragging = false;
	}
}
