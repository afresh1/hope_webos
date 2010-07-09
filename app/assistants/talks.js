/*
 * Copyright (c) 2010 Andrew Fresh <andrew@afresh1.com>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

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

	returnListItems = function(key) {
		Mojo.Log.info("returnListItems:", key);
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
				updateTalks(talks);
			},
			onFailure: function(transport) {
				// XXX not sure why this doesn't even log
				//var t = new Template("Status #{status} returned");
				//var m = t.evaluate(transport);
				Mojo.Log.error("Error retreving talks list");
			}
		});
	},

	updateTalks = function(tl) {
		Mojo.Log.info("database size:", Object.values(tl).size());
		var i, talk;

		if (Object.toJSON(tl) == "[]" || tl === null) {
			Mojo.Log.info("Retrieved empty or null list");
			getList(); // XXX dangerous!
		} else {
			Mojo.Log.info("updating talksList");

			db.simpleAdd("talksList", tl, function() {
				Mojo.Log.info("talksList saved OK");
			},
			function(transaction, result) {
				Mojo.Log.warn("Database save error (#", result.message, ") - can't save talksList. Will need to reload on next use.");
				Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save talksList. Will need to reload on next use.");
			});

			talksList.full = [];
			talksList.days = {};
			talksList.locations = {};

			for (i = 0; i < tl.length; i += 1) {
				talk = new Talk(tl[i], self.favorite)

				talksList.days[talk.day] = true;
				talksList.locations[talk.location] = true;

				talksList.full.push(talk);
			}

			applyFilters();
		}
	},

	loadTalksDB = function() {
		db = new Mojo.Depot({
			name: "talksDB",
			version: 1,
			estimatedSize: 150000
		});

		if (!db) {
			Mojo.Log.warn("Can't open talksDB database:", result);
		}
		else {
			Mojo.Log.info("Talks Database opened OK");
			db.simpleGet("talksList", updateTalks, getList);
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

		Mojo.Log.info("calling noticeUpdatedItems: offset=" + offset + " result count=" + subset.length + " totalSubsetSize=" + totalSubsetSize + " items=" + subset.toJSON());
		// Explanations of a lot of these are in the list widget's docs
		listWidget.mojo.noticeUpdatedItems(offset, subset);

		//set the list's length & count
		listWidget.mojo.setLength(totalSubsetSize);
		listWidget.mojo.setCount(totalSubsetSize);
	},

	applyFilters = function() {
		Mojo.Log.info("Applying Filters");
		talksList.filtered.length = 0;

		var i, c;
		for (i = 0; i < talksList.full.length; i += 1) {
			c = talksList.full[i];

			if ((!filters.days || filters.days === c.day.toLowerCase()) && (!filters.locations || filters.locations === c.location.toLowerCase()) && (!filters.favorites || self.favorite.is(c.id))) {
				talksList.filtered.push(c);
			}
		}

		for (i = 0; i < updateWatchers.length; i += 1) {
			updateWatchers[i]();
		}
	},

	setFilter = function(name, value) {
		if (value === "all") {
			value = false;
		}
		if (name === "favorites") {
			value = ! filters[name];
		}
		Mojo.Log.info("setFilter:", name, " to ", value);
		filters[name] = value;
		applyFilters();
	},

	registerWatcher = function(callback) {
		updateWatchers.push(callback);
	},

	loadTalksDB();

	var self = {
		list: talksList.filtered,
		days: function() {
			return returnListItems("days")
		},
		locations: function() {
			return returnListItems("locations")
		},
		refresh: getList,
		search: searchList,
		registerWatcher: registerWatcher,
		setFilter: setFilter,
		getFilter: function(name) {
			return filters[name]
		},
	};

	return self;
};

var Favorites = function() {
	Mojo.Log.info("Init favorite cookies");

	var favorites = {};

	var cookieData = new Mojo.Model.Cookie("favoriteTalks"),

	loadCookie = function() {
		var cookies = cookieData.get();

		if (cookies) {
			Mojo.Log.info("Loaded Cookies");
			favorites = cookies.favorites;
		}
		else {
			Mojo.Log.info("no cookies");
			storeCookie();
		}
	},

	storeCookie = function() {
		Mojo.Log.info("Saving some cookies for later");
		cookieData.put({
			favorites: favorites
		});
	},

	isFavorite = function(id) {
		//Mojo.Log.info("Favorite:", id, " is ", favorites[id]);
		return favorites[id];
	},

	setFavorite = function(id, value) {
		Mojo.Log.info("Favorite:", id, " is being set to ", value);
		favorites[id] = value;
		storeCookie();
	};

	loadCookie();

	return {
		is: isFavorite,
		set: setFavorite,
	}
};

