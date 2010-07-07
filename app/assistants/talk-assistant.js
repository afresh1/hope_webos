function TalkAssistant(talk, talks) {
	this.details = talk;
	this.talks   = talks;
}

TalkAssistant.prototype = {
    day_names: Mojo.Locale.getDayNames(),
	setup: function() {
        var t = this.details;
		var id = t.id;

        Mojo.Log.info("Setup talk: ", id);

        var d = new Date(t.timestamp * 1000);

        //t.date = d.toUTCString();
        t.day = this.day_names[d.getUTCDay()];
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
    },

    setupTalkWidget: function(controller) {
        Mojo.Log.info("Setup widget talk-favorite: ", id);
		controller.setupWidget("talk-favorite-" + id, null, {
			value: true //this.talks.favorite.is(id)
		});

		//controller.listen("talk-favorite-" + id, Mojo.Event.propertyChange, this.favoriteChanged.bindAsEventListener(this));
	},

	favoriteChanged: function(propertyChangeEvent) {
		Mojo.Log.info("The checkbox (" + propertyChangeEvent.property + ") has changed to " + propertyChangeEvent.value + " which is the same as in my model " + this.model.value);
	},

	//if (this.favoriteModels[j]) {
	//this.favoriteModels[j].value = this.talks.favorite.is(j);
	//this.controller.modelChanged(this.favoriteModels[j]);
	//}
};

