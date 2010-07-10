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

var Talk = function(spec, favorite) {
	var that = spec,
	id = that.id,
	day_names = Mojo.Locale.getDayNames(),
	d = new Date(that.timestamp * 1000);

	that.widgetId = "talk-favorite-" + id;
	that.widgets = [];

	//Mojo.Log.info("Setup talk:", id);
	that.setup = function(controller) {
		//Mojo.Log.info("Setup widget talk-favorite:", id);
		var widget = controller.get(that.widgetId);
		that.widgets.push({
			widget: widget,
			controller: controller
		});

		if (favorite.is(id)) {
			widget.addClassName("is-favorite");
		}

		controller.listen(widget, Mojo.Event.tap, that.changeFavorite);
	},

	that.cleanup = function() {
		//Mojo.Log.info("Cleanup talk:", this.id);
		var i;
		for (i = 0; i < this.widgets.length; i += 1) {
			this.widgets[i].controller.stopListening(this.widgets[i].widget, Mojo.Event.tap, this.changeFavorite);
		}
	}.bind(that),

	that.changeFavorite = function() {
		Mojo.Log.info("Changing Favorite:", this.widgetId);

		var value = ! favorite.is(this.id);
		favorite.set(this.id, value);

		var i, widget;
		for (i = 0; i < this.widgets.length; i += 1) {
			if (value) {
				this.widgets[i].widget.addClassName("is-favorite");
			}
			else {
				this.widgets[i].widget.removeClassName("is-favorite");
			}
		}
	}.bind(that);

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

    that.when = that.day + "-" + that.hours + that.minutes;

	that.searchable = that.title.toLowerCase();
	that.searchable += " " + that.location.toLowerCase();
	that.searchable += " " + that.day.toLowerCase();

	for (s = 0; s < that.speakers.length; s += 1) {
		that.searchable += " " + that.speakers[s].name.toLowerCase();
	}

	return that;
};

