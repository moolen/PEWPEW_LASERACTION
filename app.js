var Game = (function(){
	var GG = {};

	/**
	 * [Ship]
	 */
	var Ship = function(){
		var self = this;

		this.maxSpeed = 4;
		this.speed = 0;
		this.lastShot = null;

		ENGN.Behavior.Gravity.call(this);
		ENGN.Behavior.MoveLikeSpaceship.call(this);

		this.maxParticles = 20;
		this.shootDelay = 100;
		// lulz mode
		//this.maxParticles = 100;
		//this.shootDelay = 10;

		this.particles = [];
		this.angle = 90;
		this.AnimationId = null;
		this.$el = null;
		this.location = [200,30];
		this.ready = false;

		this.PlaygroundCollision = function(){
			
			// check borders
			if(
				this.location[0] >= Game.Playground.width - 3
				|| this.location[0] <= 0 + 3
				|| this.location[1] >= Game.Playground.height - 3
				|| this.location[1] <= 0 + 3
			)
			{
				return true;
			}
			return false;
		};

		this.particleCollision = function(collectable){
			var collided = false;
			self.particles.forEach(function(particle, i){
				if(
					collectable.location[0] <= particle.location[0]
					&& (collectable.location[0] + collectable.width) >= particle.location[0]
					&& collectable.location[1] <= particle.location[1]
					&& (collectable.location[1] + collectable.height) >= particle.location[1]
				)
				{
					collided = true;
					self.particles.splice(i, 1);
					particle.remove();

				}
			});
			return collided;
		};

		this.CollectableCollision = function(){
			Game.Playground.collectables.forEach(function(v, i){
				if(
					(// ship collision
						v.location[0] <= self.location[0] + 3
						&& (v.location[0] + v.width) >= self.location[0] + 3
						&& v.location[1] <= self.location[1] + 3
						&& (v.location[1] + v.height) >= self.location[1] + 3
					)
					|| self.particleCollision(v)
				)
				{
					console.log('collided');
					Game.Playground.removeCollectable(i);
					v.remove();
				}
			});
		};

		this.renderParticles = function(){
			// calculate new positions
			self.particles.forEach(function(particle, i){
				
				// set next position
				particle.location[0] = particle.location[0] + ( Math.cos( (particle.angle - 180) * (Math.PI/180)) * particle.speed);
				particle.location[1] = particle.location[1] + ( Math.sin( (particle.angle) * (Math.PI/180)) * particle.speed );

				// if inside playground..
				if(
					!(
						particle.location[0] >= Game.Playground.width - 3
						|| particle.location[0] <= 0 + 3
						|| particle.location[1] >= Game.Playground.height - 3
						|| particle.location[1] <= 0 + 3
					)
				)
				{
					// apply css
					particle.$el.css('left', particle.location[0]);
					particle.$el.css('bottom', particle.location[1]);
				}
				else // remove..
				{
					particle.remove();
					self.particles.splice(i, 1);
				}
				
			});
		};

		this.draw = function()
		{
			if(self.ready && !self.PlaygroundCollision())
			{
				self.CollectableCollision();
				self.renderParticles();
				self.location[0] = self.location[0] + ( Math.cos( (self.angle - 180) * (Math.PI/180)) * self.speed );
				self.location[1] = self.location[1] + ( Math.sin( (self.angle) * (Math.PI/180)) * self.speed ) + self.gravity ;
				self.$el.css('left', self.location[0]);
				self.$el.css('bottom', self.location[1]);
				self.$el.css({WebkitTransform: 'rotate(' + (self.angle - 90) + 'deg)'});
			}
			
		};

		this.render = function(){
			self.AnimationId = requestAnimationFrame(self.render);
			self.draw();
		};

		self.render();

		

		this.shoot = function()
		{
			if(self.particles.length <= self.maxParticles && ( (new Date()).getTime() - self.lastShot > self.shootDelay || self.lastShot === null) )
			{
				self.lastShot = new Date().getTime();
				Game.Playground.$el.append('<div class="particle"></div>');
				var el = Game.Playground.$el.children().last();

				this.particles.push(new Particle(self.location[0], self.location[1], self.angle, el));
			}
		};
	};

	/**
	 * [Particle]
	 * @param {[int]} x     
	 * @param {[int]} y     
	 * @param {[int]} angle 
	 * @param {[DOM]} el    
	 */
	var Particle = function(x, y, angle, el){

		var self = this;
		
		// inherited
		this.angle = angle || 90;
		this.location = [ x + 3, y + 3];
		
		// instance stuff
		this.speed = 5;
		this.$el = el;

		this.remove = function(){
			self.$el.remove();
		};
	};


	/**
	 * [Player]
	 */
	var Player = function(ship){
		var self = this;
		this.ship = ship;

		ENGN.Vent.on('keyboard:arrowup', this.ship.speedUp, false, this.ship);
		ENGN.Vent.on('keyboard:arrowdown', this.ship.speedDown, false, this.ship);
		ENGN.Vent.on('keyboard:arrowleft', this.ship.turnLeft, false, this.ship);
		ENGN.Vent.on('keyboard:arrowright', this.ship.turnRight, false, this.ship);
		ENGN.Vent.on('keyboard:spacebar', this.ship.shoot, false, this.ship);

	};

	/**
	 * [CollectableObject]
	 * @param {[int]} x      
	 * @param {[int]} y      
	 * @param {[int]} width  
	 * @param {[int]} height 
	 */
	var CollectableObject = function(x, y, width, height){

		var self = this;
		this.location = [x || 100,y || 230];
		this.$el = null;
		this.width = width || 20;
		this.height = height || 20;

		this.render = (function(){
			Game.Playground.$el.append('<div class="collectable"></div>');

			self.$el = Game.Playground.$el.children().last();
			
			self.$el.css('left', self.location[0]);
			self.$el.css('bottom', self.location[1]);
			self.$el.css('width', self.width);
			self.$el.css('height', self.height);
		}());

		this.remove = function(){
			self.$el.fadeOut('fast', function(){
				self.$el.remove();
			});
		};
	};

	/**
	 * [Playground]
	 * @param {DOM} $el
	 */
	var Playground = function($el){

		var self = this;
		this.$el = $el;

		this.width = this.$el.width();
		this.height = this.$el.height();
		this.players = [];
		this.collectables = [];
		this.startTime = new Date().getTime();

		this.CollectablesInterval = 2400;

		this.initCollectables = (function(){
			setInterval(function(){
				if(self.collectables.length < 4)
				{
					self.addCollectable();
				}
			}, this.CollectablesInterval);
		}());

		this.addCollectable = function(){
			var newCollectable = new CollectableObject(Math.random() * (self.width - 50), Math.random() * (self.height - 50)  );
			self.collectables.push(newCollectable);
		};

		this.removeCollectable = function(index){
			var collectable = self.collectables[index].remove();
			self.collectables.splice(index, 1);
			var score = parseInt($('.score').html(), 10) + 40;
			$('.score').html(score);
		};
	};

	Playground.prototype.addPlayer = function(player){
		this.players.push(player);
		this.$el.append('<div class="ship"></div>');
		player.ship.$el = this.$el.children().last();
		player.ship.ready = true;
	};

	GG.initialize = function(){
		console.log('init Game');
		// init stuff
		var ship = new Ship();
		var player = new Player(ship);

		GG.Playground = new Playground($('#playground'));
		GG.Playground.addPlayer(player);
	};

	$(GG.initialize);

	return GG;
}());