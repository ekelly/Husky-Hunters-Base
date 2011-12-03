$(function() {
	window.Router = Backbone.Router.extend({
		routes: {
			"":     "list",
			"home": "list",
			"list": "list",
			"map":  "map"
		},
		list: function() {},
		map: function() {}
	});
	window.router = new Router;
	Backbone.history.start();
	
	window.Clue = Backbone.Model.extend({
		validate: function(attrs) {
			var allEmpty = _.all(attrs, function(attr) {
								return attr.length === 0;
							});
			
			// check if there are any empty attributes
			if(allEmpty || attrs.number.length === 0) {
				return "Can't leave that empty";
			}
		}
	});
	
	window.ClueList = Backbone.Collection.extend({
		model: Clue,
		
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
			_.bindAll(this, 'edit', 'closeOnEnter', 'remove');
			
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
			//this.locationInput = this.$('.location input');
			
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
				//location : this.locationInput.val()
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
			//var clueLocation = this.inputLocation.val();
			
			Clues.create({
				number: clueNumber,
				hint: clueHint,
				answer: clueAnswer,
				points: cluePoints//,
				//location: clueLocation
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
	
	window.AppView = Backbone.View.extend({
		el: $('#app'),
		
		initialize: function() {
			_.bindAll(this, 'swapToList', 'swapToMap');
			
			router.bind("route:list", this.swapToList);
			router.bind("route:map",  this.swapToMap);
			
			var mapLink = $("<a>Map</a>");
			mapLink.click(function() {
				router.navigate("map", true);
			});

			var listLink = $("<a>List</a>");
			listLink.click(function() {
				router.navigate("list", true);
			});

			$('#nav').append(mapLink);
			$('#nav').append(listLink);
			
			var clues = new CluePage;
		},
		
		swapToList: function() {
			console.log("swapToList");
			$('#map').hide();
			$('#clues').show();
		},
		
		swapToMap: function() {
			console.log("swapToMap");
			$('#clues').hide();
			$('#map').show();
		}
	});
	
	window.App = new AppView;


});