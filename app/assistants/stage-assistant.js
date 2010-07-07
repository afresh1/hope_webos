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
	var talksList = [],
	db,
	updateWatchers = [];

    returnList = function() {
        return talksList;
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

					t.searchable = t.title.toLowerCase() + " " + t.location.toLowerCase() + " " + t.day.toLowerCase();

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
            
			talksList = tl;

			for (i = 0; i < updateWatchers.length; i += 1) {
				updateWatchers[i]();
			}

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
			estimatedSize: 200000
		});

		if (!db) {
			Mojo.Log.warn("Can't open talksDB database: ", result);
		}
		else {
			Mojo.Log.info("Talks Database opened OK");
            db.simpleGet("talksList", updateTalksDB, getList);
		}
	},

	filterList = function(filterString, listWidget, offset, count) {
		var subset = [];
		var totalSubsetSize = 0;
		var filterStringLowerCase = filterString.toLowerCase();

		//loop through the original data set & get the subset of items that have the filterstring 
		var i = 0;
		while (i < talksList.length) {
			if (talksList[i].searchable.include(filterStringLowerCase)) {
				if (subset.length < count && totalSubsetSize >= offset) {
					subset.push(talksList[i]);
				}
				totalSubsetSize++;
			}
			i++;
		}

		//update the items in the list with the subset
		listWidget.mojo.noticeUpdatedItems(offset, subset);

		//set the list's length & count if we're not repeating the same filter string from an earlier pass
		if (filter !== filterString) {
			listWidget.mojo.setLength(totalSubsetSize);
			listWidget.mojo.setCount(totalSubsetSize);
		}
		filter = filterString;
	},
	registerWatcher = function(callback) {
		updateWatchers.push(callback);
	};

	return {
		list: returnList,
		refresh: getList,
		init: loadTalksDB,
		filter: filterList,
		registerWatcher: registerWatcher
	};
};
