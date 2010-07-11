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
		locations: false,
		favorites: false
	},
	db,
	updateWatchers = [];

	var returnListItems = function(key) {
		Mojo.Log.info("returnListItems:", key);
		var name, items = [];
		for (name in talksList[key]) {
			if (talksList[key].hasOwnProperty(name)) {
				items.push(name);
			}
		}
		items.sort();
		return items;
	},

	getNotice = function(controller, callback) {
		Mojo.Log.info("Getting Notice");
		var that = {
			controller: controller
		}
		var url = "http://www.thenexthope.org/hope_schedule/notice_json.php";
		var myAjax = new Ajax.Request(url, {
			method: "get",
			evalJSON: "force",
			requestHeaders: {
				"USER_AGENT": navigator.userAgent
			},
			onComplete: function(transport) {
				var notice = transport.responseJSON;
				Mojo.Log.info("got notice", notice.notice);

				this.controller.showAlertDialog({
					title: $L("Notice"),
					message: notice.notice,
					choices: [{
						label: "OK"
					}]
				});
				callback();
			}.bind(that),
			onFailure: function(transport) {
				// XXX not sure why this doesn't even log
				//var t = new Template("Status #{status} returned");
				//var m = t.evaluate(transport);
				Mojo.Log.error("Error retrieving Notice");
				callback();
			}
		});
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

				talks.sort(function(a, b) {
					if (a.timestamp === b.timestamp) {
						if (a.location === b.location) {
							return 0;
						}
						else {
							return a.location < b.location ? - 1: 1;
						}
					}
					else {
						return a.timestamp < b.timestamp ? - 1: 1;
					}
				});

				db.simpleAdd("talksList", talks, function() {
					Mojo.Log.info("talksList saved OK");
				},
				function(transaction, result) {
					Mojo.Log.warn("Database save error (#", result.message, ") - can't save talksList. Will need to reload on next use.");
					Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save talksList. Will need to reload on next use.");
				});

				updateTalks(talks);
			},
			onFailure: function(transport) {
				// XXX not sure why this doesn't even log
				//var t = new Template("Status #{status} returned");
				//var m = t.evaluate(transport);
				Mojo.Log.error("Error retrieving talks list");
			}
		});
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
			db.simpleGet("talksList", function(tl) {
				Mojo.Log.info("database size:", Object.values(tl).size());
				if (Object.toJSON(tl) == "[]" || tl === null) {
					Mojo.Log.info("Retrieved empty or null list");
					getList();
				} else {
					updateTalks(tl);
				}
			},
			getList);
		}
	},

	updateTalks = function(tl) {
		Mojo.Log.info("updating talksList");

		talksList.full = [];
		talksList.days = {};
		talksList.locations = {};

		tl.each(function(item) {
			var talk = new Talk(item, self.favorite)

			talksList.days[talk.day] = true;
			talksList.locations[talk.location] = true;

			talksList.full.push(talk);
		});

		applyFilters();
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

			if ((!filters.locations || filters.locations === c.location.toLowerCase()) && (!filters.favorites || self.favorite.is(c.id))) {
				talksList.filtered.push(c);
			}
		}

		updateWatchers.each(function(item) {
			item()
		});
	},

	setFilter = function(name, value) {
		if (name) {
			if (value === "all") {
				value = false;
			}
			if (name === "favorites") {
				value = ! filters[name];
			}
			Mojo.Log.info("setFilter:", name, " to ", value);
			filters[name] = value;
		}
		applyFilters();
	},

	registerWatcher = function(callback) {
		updateWatchers.push(callback);
	}

	self = {
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
		showNotice: getNotice,
		setup: function() {
			loadTalksDB();
		}
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

