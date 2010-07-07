function StageAssistant() {
	/* this is the creator function for your stage assistant object */
	this.talks = Talks();
	this.talks.init();
}

StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */

	/* for a simple application, the stage assistant's only task is to push the scene, making it
	   visible */
	this.controller.pushScene("talks", this.talks);
};

var Talks = function() {
	var talksList = {
		full: [],
		filtered: [],
		days: {},
		locations: {}
	},
	filters = {
		days: false,
		locations: false,
		favorites: false
	},
	db,
	updateWatchers = [];
	searchFilter = '',

	returnList = function() {
		return talksList.filtered;
	},
	returnListItems = function(key) {
		Mojo.Log.info("returnListItems: ", key);
		var items = [];
		var name;
		if (talksList[key]) {
			for (name in talksList[key]) {
				if (talksList[key].hasOwnProperty(name)) {
					items.push(name);
				}
			}
		}
		items.sort();
		return items;
	},
	getList = function(updateList) {
		var that = this;
		var url = "http://www.thenexthope.org/hope_schedule/json.php";

		Mojo.Log.info("Retrieving new talksList from ", url);

		var myAjax = new Ajax.Request(url, {
			method: "get",
			evalJSON: "force",
			requestHeaders: {
				"USER_AGENT": navigator.userAgent
			},
			onComplete: function(transport) {
				var talks = transport.responseJSON;
				Mojo.Log.info("got talksList");

				var day_names = Mojo.Locale.getDayNames();

				var i, t, d, s;
				for (i = 0; i < talks.length; i += 1) {
					t = talks[i];
					d = new Date(t.timestamp * 1000);
					//t.date = d.toUTCString();
					t.day = day_names[d.getUTCDay()];
					t.hours = d.getUTCHours();
					if (t.hours < 10) {
						t.hours = "0" + t.hours;
					}
					t.minutes = d.getUTCMinutes();
					if (t.minutes < 10) {
						t.minutes = "0" + t.minutes;
					}

					t.searchable = t.title.toLowerCase();
					t.searchable += " " + t.location.toLowerCase();
					t.searchable += " " + t.day.toLowerCase();

					for (s = 0; s < t.speakers.length; s += 1) {
						t.searchable += " " + t.speakers[s].name.toLowerCase();
					}
				}

				updateTalksDB(talks);
			},
			onFailure: function(transport) {
				// XXX not sure why this doesn't even log
				//var t = new Template("Status #{status} returned");
				//var m = t.evaluate(transport);
				Mojo.Log.error("Error retreving talks list");
			}
		});
	},

	updateTalksDB = function(tl) {
		Mojo.Log.info("database size: ", Object.values(tl).size());
		var i;
		if (Object.toJSON(tl) == "[]" || tl === null) {
			Mojo.Log.info("Retrieved empty or null list");
			featureIndexFeed = 0;
			getList(); // XXX dangerous!
		} else {
			Mojo.Log.info("updating talksList");

			talksList.days = {};
			talksList.locations = {};
			for (i = 0; i < tl.length; i += 1) {
				talksList.days[tl[i].day] = true;
				talksList.locations[tl[i].location] = true;
			}

			talksList.full = tl;
			applyFilters();
			notifyWatchers();

			db.simpleAdd("talksList", tl, function() {
				Mojo.Log.info("talksList saved OK");
			},
			function(transaction, result) {
				Mojo.Log.warn("Database save error (#", result.message, ") - can't save talksList. Will need to reload on next use.");
				Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save talksList. Will need to reload on next use.");
			});
		}
	},

	loadTalksDB = function() {
		db = new Mojo.Depot({
			name: "talksDB",
			version: 1,
			estimatedSize: 150000
		});

		if (!db) {
			Mojo.Log.warn("Can't open talksDB database: ", result);
		}
		else {
			Mojo.Log.info("Talks Database opened OK");
			db.simpleGet("talksList", updateTalksDB, getList);
		}
	},

	searchList = function(filterString, listWidget, offset, count) {
		var subset = [];
		var totalSubsetSize = 0;
		var fs = filterString.toLowerCase();

		//loop through the original data set & get the subset of items that have the filterstring 
		var i = 0;
		while (i < talksList.filtered.length) {
			if (talksList.filtered[i].searchable.include(fs)) {
				if (subset.length < count && totalSubsetSize >= offset) {
					subset.push(talksList.filtered[i]);
				}
				totalSubsetSize++;
			}
			i++;
		}

		//update the items in the list with the subset
		listWidget.mojo.noticeUpdatedItems(offset, subset);

		//set the list's length & count if we're not repeating the same filter string from an earlier pass
		if (searchFilter !== fs) {
			listWidget.mojo.setLength(totalSubsetSize);
			listWidget.mojo.setCount(totalSubsetSize);
		}
		searchFilter = fs;
	},

	applyFilters = function() {
		Mojo.Log.info("Applying Filters");
		var subset = [];

		var i, c;
		for (i = 0; i < talksList.full.length; i += 1) {
			c = talksList.full[i];
			if ((!filters.days || filters.days === c.day.toLowerCase()) && (!filters.locations || filters.locations === c.location.toLowerCase())
			// XXX add favorite filter
			) {
				subset.push(c);
			}
		}

		talksList.filtered = subset;
		notifyWatchers();
	},

	setFilter = function(name, value) {
		Mojo.Log.info("setFilter: ", name, " to ", value);
		if (value === "all") {
			value = false;
		}
		if (name === "favorites") {
			value = ! filters[name];
		}
		filters[name] = value;
		applyFilters();
	},

	registerWatcher = function(callback) {
		updateWatchers.push(callback);
	},

	notifyWatchers = function() {
		for (i = 0; i < updateWatchers.length; i += 1) {
			updateWatchers[i]();
		}
	};

	return {
		list: returnList,
		days: function() {
			return returnListItems("days")
		},
		locations: function() {
			return returnListItems("locations")
		},
		refresh: getList,
		init: loadTalksDB,
		search: searchList,
		registerWatcher: registerWatcher,
		setFilter: setFilter,
		getFilter: function(name) {
			return filters[name]
		}
	};
};

