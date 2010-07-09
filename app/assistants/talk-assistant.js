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

function TalkAssistant(talk) {
	this.talk = talk;
}

TalkAssistant.prototype = {
	listeners: [],
	setup: function() {
		Mojo.Log.info("Setup TalksAssistant");

		this.controller.setupWidget(
		Mojo.Menu.appMenu, {
			omitDefaultItems: true
		},
		{
			visible: true,
			items: [
			Mojo.Menu.editItem,
			//Mojo.Menu.prefsItem,
			Mojo.Menu.helpItem]
		});

		var i, fields = ['title', 'day', 'hours', 'minutes', 'location', 'description'];
		for (i = 0; i < fields.length; i += 1) {
			this.controller.get(fields[i]).update(this.talk[fields[i]]);
		}

		this.controller.get('favorite').id = this.talk.widgetId;
		this.talk.setupWidget(this.controller);

		this.controller.setupWidget("SpeakerList", {
			itemTemplate: "talk/talk-item-template",
			listTemplate: "talk/talk-list-template",
			swipeToDelete: false,
			reordarable: false,
			onItemRendered: this.renderSpeaker.bind(this)
		},
		this.filterListModel = {
			items: this.talk.speakers
		});

		this.handleBioChange = this.handleBioChange.bindAsEventListener(this);

	},

	cleanup: function() {
		Mojo.Log.info("Cleanup talk-assistant");
		var i;
		for (i = 0; i < this.listeners.length; i += 1) {
			this.controller.stopListening(this.listeners[i], Mojo.Event.tap, this.handleBioChange);
		}
	},

	renderSpeaker: function(listWidget, itemModel, itemNode) {
		var drawer = itemNode.down('div.drawer');
		var button = itemNode.down('div.drawer-button');

		this.controller.setupWidget(drawer, {},
		{
			open: false
		});
		this.controller.listen(button, Mojo.Event.tap, this.handleBioChange);
		this.listeners.push(button);
	},

	handleBioChange: function(event) {
		var targetRow = this.controller.get(event.target);
		var drawer = targetRow.up("div.palm-row").next('div.drawer');
		this.controller.get(drawer).mojo.setOpenState(!this.controller.get(drawer).mojo.getOpenState());

	}
};

