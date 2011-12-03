$(function() {
	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = decodeURIComponent(c.substring(1,c.length));
			if (c.indexOf(nameEQ) == 0) {
				return decodeURIComponent(c.substring(nameEQ.length,c.length));
			}
		}
		return null;
	}


	window.Router = Backbone.Router.extend({
		routes: {
			"":     "list",
			"list": "list",
			"map/:clue": "map"
		},
		list: function(){},
		map: function(){}
	});
	window.router = new Router;
	
	window.Clue = Backbone.Model.extend({
		validate: function(attrs) {
			// check if there are any empty attributes
			if(attrs.number && attrs.number.length === 0) {
				return "Can't leave that empty";
			}
			
			if(Clues.get(attrs.id)) {
				return "Model not unique";
			}
		}
	});
	
	window.ClueList = Backbone.Collection.extend({
		model: Clue,
		
		//url: "/api/teams/"+readCookie('teamCode')+"/clues",
		localStorage: new Store("clues"),
		
		comparator: function(clue) {
			// comparator function return an absolute ordering
			// this prevents me from doing "natural" sorting of strings
			// that contain number

			var id = clue.get("number");
			
			if(/^[0-9]+$/g.exec(id)) {
				return parseInt(id);
			} else {
				return Infinity;
			}
		}
	});

	window.Clues = new ClueList;
	
	window.ClueView = Backbone.View.extend({
		tagName: "tr",
		className: "clue",
		
		events: {
			"keydown .editing": "closeOnEnter"
		},
		
		initialize: function() {
			_.bindAll(this, 'render', 'edit', 'closeOnEnter', 'remove');
			
			this.model.bind("change", this.render);
			
			this.template = _.template($('#clue-template').text());
		},
		
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			
			this.$('.edit a').click(this.edit);
			this.$('.delete a').click(this.remove);
			
			this.numberInput = this.$('.number input');
			this.hintInput = this.$('.hint input');
			this.answerInput = this.$('.answer input');
			this.pointsInput = this.$('.points input');
			
			return this;
		},
		
		edit: function() {
			$(this.el).addClass('editing');
			
			this.$('input').show();
			this.$('.display').hide();
			this.numberInput.focus();
		},
		
		closeOnEnter: function(e) {
			if(e.keyCode != 13 && (e.keyCode != 9 || e.target !== this.pointsInput[0])) return;
			
			var newValues = {
				number   : this.numberInput.val(),
				hint     : this.hintInput.val(),
				answer   : this.answerInput.val(),
				points   : this.pointsInput.val()//,
			}
			
			this.model.save(newValues);
			
			this.render();
			
			$(this.el).removeClass('editing');
			
			this.$('input').hide();
			this.$('.display').show();
			
			e.preventDefault();
		},
		
		remove: function() {
			this.model.destroy();
			
			$(this.el).remove();
		}
	});
	
	window.CluePage = Backbone.View.extend({
		el: $('#clues'),
		
		events: {
			"keypress .clue-input": "createOnEnter",
			"keydown .clue-input": "createOnEnter"
		},
		
		initialize: function() {
			_.bindAll(this, 'addOne', 'addAll', 'createOnEnter', 'edit');
			
			this.inputId = $('#clue-id');
			this.inputHint = $('#clue-hint');
			this.inputAnswer = $('#clue-answer');
			this.inputPoints = $('#clue-points');
			
			Clues.bind('add',   this.addOne, this);
			Clues.bind('reset', this.addAll, this);
			
			$('#add-clue').click(this.edit);
			
			Clues.fetch();
		},
		
		addOne: function(clue) {
			var view = new ClueView({model: clue});
			
			$(this.el).append(view.render().el);
		},
		
		addAll: function() {
			Clues.each(this.addOne);
		},
				
		createOnEnter: function(e) {
			if(e.keyCode != 13 && (e.keyCode != 9 || e.target !== this.inputPoints[0])) return;
			
			var clueNumber   = this.inputId.val();
			var clueHint     = this.inputHint.val();
			var clueAnswer   = this.inputAnswer.val();
			var cluePoints   = this.inputPoints.val();
			
			Clues.create({
				id: clueNumber,
				number: clueNumber,
				hint: clueHint,
				answer: clueAnswer,
				points: cluePoints,
				latlng: []
			});
			
			this.$('input').val('');
			
			this.inputId.focus();
			
			e.preventDefault();
		},
		
		edit: function(e) {
			if(!e || e.target.tagName != 'INPUT') {
				this.inputId.focus();
			}
		}
	});
	
	window.MapPage = Backbone.View.extend({
		el: $('#map'),
		
		events: {
			"keypress #map-search": "search"
		},
		
		initialize: function() {
			_.bindAll(this, 'search', 'showSearchResults');
			
			this.template = _.template($('#map-template').text());
		},
		
		render: function() {
			console.log(this.model.toJSON());
			$(this.el).html(this.template(this.model.toJSON()));
			
			var latlng = new google.maps.LatLng(42.3400571, -71.0875355);
			var notDefault = false;
			
			if(this.model) {
				var coords = this.model.get("latlng");
				if(coords && coords.length === 2) {
					latlng = new google.maps.LatLng(coords[0], coords[1]);
					notDefault = true;
				}
			}
			
			var options = {
				zoom: 15,
				center: latlng,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			
			if(!this.map) {
				this.map = new google.maps.Map($('#map-canvas')[0], options);
			} else {
				this.map.setCenter(latlng);
			}

			if(notDefault) {
				if(this.marker) {
					this.marker.setMap(null);
				}
				this.marker = new google.maps.Marker({
					map: this.map,
					position: latlng
				});
			}
		},
		
		search: function(e) {
			if(e.keyCode != 13) return;
			
			
			var address = $("#map-search").val();
			
			var geocoder = new google.maps.Geocoder();
			
			geocoder.geocode( { 'address': address }, this.showSearchResults);
		},
		
		showSearchResults: function(results, status) {
			//console.log(results, status);
			
			if (status == google.maps.GeocoderStatus.OK) {
				this.map.setCenter(results[0].geometry.location);
				
				if(this.marker) {
					this.marker.setMap(null);
				}
				this.marker = new google.maps.Marker({
					map: this.map,
					position: results[0].geometry.location
				});
				
				var latlng = [results[0].geometry.location.lat(),
								results[0].geometry.location.lng()];
				
				this.model.save({ latlng: latlng });
			} else {}
		}
	});
	
	window.Overlay = Backbone.View.extend({
		el: $('#overlay'),
		
		initialize: function() {
		}
	});
	
	window.AppView = Backbone.View.extend({
		el: $('#app'),
		
		initialize: function() {
			_.bindAll(this, 'swapToList', 'swapToMap');
			
			router.bind("route:list", this.swapToList);
			router.bind("route:map",  this.swapToMap);
			
			var listLink = $("<a>Clues</a>");
			listLink.click(function() {
				router.navigate("list", true);
			});
			
			$('h1').text(teamName + " Clues");
			
			$('#nav').append(listLink);
			$('#nav').append("<div id='teamCode'>Team code: <input type='text' value='"+readCookie('teamCode')+"' /></div>");
			
			this.clues = new CluePage;
			this.map = new MapPage;
			
			Backbone.history.start({ root: "/" });
		},
		
		swapToList: function() {
			console.log("swapToList");
			$('#map').hide();
			$('#clues').show();
		},
		
		swapToMap: function(id) {
			console.log("swapToMap");

			$('#clues').hide();
			$('#map').show();
			
			console.log(Clues.get(id));
			
			if(Clues.get(id)) {
				console.log("rendering map");
				this.map.model = Clues.get(id);
				this.map.render();				
			} else {
				this.map.model = null;
				console.log("no model?");
			}
		}
	});
	
	window.teamName = readCookie("teamName");
	window.teamCode = readCookie("teamCode");
	
	window.App = new AppView;


});