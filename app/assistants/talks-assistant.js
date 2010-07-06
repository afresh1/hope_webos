function TalksAssistant(argFromPusher) {
}

TalksAssistant.prototype = {
	setup: function() {
		Ares.setupSceneAssistant(this);
	},
	cleanup: function() {
		Ares.cleanupSceneAssistant(this);
	},
	refreshTap: function(inSender) {
		var url = "http://www.thenexthope.org/hope_schedule/json.php";
		var onComplete = function(transport) {
			var talks = transport.responseJSON;
			var day_names = Mojo.Locale.getDayNames();
			var i, t, d;
			for (i = 0; i < talks.length; i += 1) {
			  t = talks[i];
				d = new Date(t.timestamp * 1000);
				//t.date = d.toUTCString();
				t.day = day_names[ d.getUTCDay() ];
				t.hours = d.getUTCHours();
				if (t.hours < 10) {
					t.hours = "0" + t.hours;
				}
				t.minutes = d.getUTCMinutes();
				if (t.minutes < 10) {
					t.minutes = "0" + t.minutes;
				}
			}
			this.listModel = {
				items: talks
			};
			this.controller.setWidgetModel("talksList", this.listModel);
		}.bind(this);
		var onFailure = function(transport) {
			alert("refresh failed");
		};
		this.request(url, onComplete, onFailure);
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
	}
	
};
