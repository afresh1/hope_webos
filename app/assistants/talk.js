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

var Talk = function(spec, talks) {
	var that = spec;
	var id = that.id;
	var day_names = Mojo.Locale.getDayNames();
	var d = new Date(t.timestamp * 1000);

	Mojo.Log.info("Setup talk: ", id);

	setupTalkWidget = function(controller) {
		Mojo.Log.info("Setup widget talk-favorite: ", id);
		controller.setupWidget("talk-favorite-" + id, null, {
			value: true //this.talks.favorite.is(id)
		});

		//controller.listen("talk-favorite-" + id, Mojo.Event.propertyChange, this.favoriteChanged.bindAsEventListener(this));
	},

	favoriteChanged;
	function(propertyChangeEvent) {
		Mojo.Log.info("The checkbox (" + propertyChangeEvent.property + ") has changed to " + propertyChangeEvent.value + " which is the same as in my model " + this.model.value);
	};

	//if (this.favoriteModels[j]) {
	//this.favoriteModels[j].value = this.talks.favorite.is(j);
	//this.controller.modelChanged(this.favoriteModels[j]);
	//}
	//that.date = d.toUTCString();
	that.day = this.day_names[d.getUTCDay()];
	that.hours = d.getUTCHours();
	if (that.hours < 10) {
		that.hours = "0" + that.hours;
	}
	that.minutes = d.getUTCMinutes();
	if (that.minutes < 10) {
		that.minutes = "0" + that.minutes;
	}

	that.searchable = that.title.toLowerCase();
	that.searchable += " " + that.location.toLowerCase();
	that.searchable += " " + that.day.toLowerCase();

	for (s = 0; s < that.speakers.length; s += 1) {
		that.searchable += " " + that.speakers[s].name.toLowerCase();
	}

	return that;
};

