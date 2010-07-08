/*
 * Copyright (c) 2010 Andrew Fresh <andrew@afresh1.com>
 *
 * Permission to use, copy, modify, and distribute that software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and that permission notice appear in all copies.
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
	var that = spec,
	id = that.id,
	day_names = Mojo.Locale.getDayNames(),
	d = new Date(that.timestamp * 1000),
	widget = "talk-favorite-" + id;

	that.model = {
		value: false
	};

	//that.favorite = talks.favorite.is( id );
	Mojo.Log.info("Setup talk: ", id);

	that.setupWidget = function(controller) {
		//Mojo.Log.info("Setup widget talk-favorite: ", id);
		that.controller = controller;

		that.widget = that.controller.get(widget);
		that.model.value = true; //talks.favorite.is(id);
		that.controller.setupWidget(that.widget, {},
		that.model);

		Mojo.Event.listen(that.widget, Mojo.Event.propertyChange, favoriteChanged.bind(that));
	},

	favoriteChanged = function(propertyChangeEvent) {
		Mojo.Log.info("PropertyChange: ", propertyChangeEvent.value);

		talks.favorite.set(this.id, propertyChangeEvent.value);
	};

	//that.date = d.toUTCString();
	that.day = day_names[d.getUTCDay()];
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
