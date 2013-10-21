(function(){
	var $document = $(document);
	
	// our Global
	window.ENGN = {
		Components: {},
		Behavior: {},
		States: {},
		initialize: function(){
			console.log('init ENGN');
			this.Vent = new this.Vent();
			var component, state;
			for (component in this.Components) {
				this.Components[component] = new this.Components[component](this.Vent);
			}
			return;
		}
	};

	$(ENGN.initialize.bind(ENGN));

	ENGN.Components.Keyboard = (function(){

		var Keyboard = function(vent)
		{
			var eventStore = [];
			var eventCache = "";
			var konamiCode = "38384040373937396665";

			$document.keydown(function(e){
				
				eventCache += e.which;
				if(eventCache.length > konamiCode.length)
				{
					eventCache = eventCache.substr(( eventCache.length - konamiCode.length ));
				}
				
				if(eventCache == konamiCode)
				{
					console.log('PEW PEW LASER ACTION!');
					Game.Playground.players[0].ship.maxParticles = 100;
					Game.Playground.players[0].ship.shootDelay = 10;
				}

				if(eventStore.indexOf(e.which) === -1)
				{
					eventStore.push(e.which);
				}

				switch(e.which)
				{
					case 32:
						vent.trigger('keyboard:spacebar');
					break;
					case 37:
						vent.trigger('keyboard:arrowleft');
					break;
					case 38:
						vent.trigger('keyboard:arrowup');
					break;
					case 39:
						vent.trigger('keyboard:arrowright');
					break;
					case 40:
						vent.trigger('keyboard:arrowdown');
					break;
				}
			});

			$document.keyup(function(e){
				var index = eventStore.indexOf(e.which);
				eventStore.splice(index, 1);
			});

			var checkKeyboard = function(){
				requestAnimationFrame(checkKeyboard);
				
				eventStore.forEach(function(key){
					switch(key)
					{
						case 32:
							vent.trigger('keyboard:spacebar');
						break;
						case 37:
							vent.trigger('keyboard:arrowleft');
						break;
						case 38:
							vent.trigger('keyboard:arrowup');
						break;
						case 39:
							vent.trigger('keyboard:arrowright');
						break;
						case 40:
							vent.trigger('keyboard:arrowdown');
						break;
					}
				});

				
			};

			checkKeyboard();
		};

		return Keyboard;
		
	}());

	ENGN.Behavior.MoveLikeSpaceship = function(){
		
		this.speedUp = function(){
			if(this.speed + 0.1 < this.maxSpeed)
			{
				this.speed += 0.1;
			}
		};

		this.speedDown = function(){
			if(this.speed -0.1 > 0)
			{
				this.speed -= 0.1;
			}
		};

		this.turnLeft = function()
		{
			this.angle -= 5;
		};

		this.turnRight = function(){
			this.angle += 5;
		};

	};

	ENGN.Behavior.Gravity = function()
	{
		var self = this;
		setTimeout(function(){
			setInterval(function(){
				if(self.speed > 0)
				{
					self.speed = self.speed - 0.06;
				}
				
			}, 100);
			self.gravity = -0.9;
		}, 2000);

		this.gravity = 1;
		
	};

	// Vent Manager
	ENGN.Vent = (function(){

		// return stuff
		var pubsub = function(){
			this.topics = {};
			this.feeds = {};
			this.id = -1;
			this.feed_id = -1;
		};

		pubsub.prototype.once = function(topic, func)
		{
			pubsub.subscribe(topic, func, 1);
		};

		pubsub.prototype.trigger = function( topic, args ){

			if( !this.topics[topic] )
			{
				return false;
			}

			var subscribers = this.topics[topic],
				len = subscribers ? subscribers.length : 0;

			while(len--)
			{
				if(subscribers[len].times === false)
				{
					subscribers[len].func.call(subscribers[len].context, topic, args );
				}
				else
				{
					// fire callback
					subscribers[len].func( topic, args );

					// if times is zero after this 'publish'... unsubscribe
					(--subscribers[len].times) === 0 ? pubsub.unsubscribe( subscribers[len].token ) : null;
				}
			}

			return this;
		};

		pubsub.prototype.on = function( topic, func, times, context )
		{
			if( !this.topics[topic] )
			{
				this.topics[topic] = [];
			}

			// create id token
			var token =  (++this.id).toString();

			this.topics[topic].push({
				token: token,
				func: func,
				context: context,
				times: times || false
			});

			return token;

		};

		pubsub.prototype.off = function( token )
		{
			for( var key in this.topics )
			{
				if( this.topics[key] )
				{
					for( var i = 0, j = this.topics[key].length; i < j; i++)
					{
						if(this.topics[key][i].token === token)
						{
							this.topics[key].splice(i, 1);
							return token;
						}
					}
				}
			}
		};

		pubsub.prototype.feed = function(feed, max, func)
		{
			var that = this;

			if( !this.feeds[feed] )
			{
				this.feeds[feed] = [];
			}

			// if threshold is NOT reached
			if( (this.feeds[feed].length + 1) < max )
			{
				var token = (++this.feed_id).toString();

				this.feeds[feed].push({
					token: token,
					func: func
				});
			}
			else // threshold is reached. fire and delete.
			{
				this.feeds[feed][0].func.call(that, feed);
				delete this.feeds[feed];
			}
		};
		return pubsub;

	})();

	
}).call(this);


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
 
// MIT license
 
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());