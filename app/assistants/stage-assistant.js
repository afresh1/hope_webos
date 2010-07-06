function StageAssistant() {
	/* this is the creator function for your stage assistant object */
	this.talks = new Talks();
	this.talks.loadTalksDB();
}

StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */

	/* for a simple application, the stage assistant's only task is to push the scene, making it
	   visible */
	this.controller.pushScene("talks", this.talks);
};

var Talks = Class.create({
	talksList: [],
	get: function(updateList) {
		var url = "http://www.thenexthope.org/hope_schedule/json.php";
		var onComplete = function(transport) {
			var talks = transport.responseJSON;
			var day_names = Mojo.Locale.getDayNames();
			var i, t, d;
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
			}

			Mojo.Log.info("Got talks list");

			this.updateTalks(talks);
			updateList();

		}.bind(this);
		var onFailure = function(transport) {
			// XXX not sure why this doesn't even log
			//var t = new Template("Status #{status} returned");
			//var m = t.evaluate(transport);
			Mojo.Log.error("Error retreving talks list");
		};
		this.request(url, onComplete, onFailure);
	},
	updateTalks: function(tl) {
		Mojo.Log.info("database size: ", Object.values(tl).size());
		if (Object.toJSON(tl) == "[]" || tl === null) {
			Mojo.Log.info("Retrieved empty or null list");
			featureIndexFeed = 0;
			this.get();
		} else {
			Mojo.Log.info("Retrieved talksList");

			this.talksList = tl;

			this.db.simpleAdd("talksList", tl, function() {
				Mojo.Log.info("talksList saved OK");
			},
			function(transaction, result) {
				Mojo.Log.warn("Database save error (#", result.message, ") - can't save talksList. Will need to reload on next use.");
				Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save talksList. Will need to reload on next use.");
			});
		}
	},
	loadTalksDB: function() {
		this.db = new Mojo.Depot({
			name: "talksDB",
			version: 1,
			estimatedSize: 200000
		},
		this.loadTalksDBOpenOK.bind(this), function(result) {
			Mojo.Log.warn("Can't open talksDB database: ", result);
		});
	},
	loadTalksDBOpenOK: function() {
		Mojo.Log.info("Talks Database opened OK");
		this.db.simpleGet("talksList", this.updateTalks.bind(this), this.get.bind(this));
	},
	request: function(url, onComplete, onFailure) {
		var myAjax = new Ajax.Request(url, {
			method: "get",
			evalJSON: "force",
			requestHeaders: {
				"USER_AGENT": navigator.userAgent
			},
			onComplete: onComplete,
			onFailure: onFailure
		});
	},
	filterList: function(filterString, listWidget, offset, count) {
		var subset = [];
		var totalSubsetSize = 0;

		//loop through the original data set & get the subset of items that have the filterstring 
		var i = 0;
		while (i < this.talksList.length) {

			if (this.talksList[i].title.include(filterString) || this.talksList[i].location.include(filterString) || this.talksList[i].day.include(filterString)) {
				if (subset.length < count && totalSubsetSize >= offset) {
					subset.push(this.talksList[i]);
				}
				totalSubsetSize++;
			}
			i++;
		}

		//update the items in the list with the subset
		listWidget.mojo.noticeUpdatedItems(offset, subset);

		//set the list's length & count if we're not repeating the same filter string from an earlier pass
		if (this.filter !== filterString) {
			listWidget.mojo.setLength(totalSubsetSize);
			listWidget.mojo.setCount(totalSubsetSize);
		}
		this.filter = filterString;
	}
});

