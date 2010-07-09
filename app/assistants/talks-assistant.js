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

function TalksAssistant() {
	this.talks = new Talks();
	this.talks.favorite = new Favorites();
}

TalksAssistant.prototype = {
	setup: function() {
		Mojo.Log.info("Setup TalksAssistant");

		this.controller.setupWidget(
		Mojo.Menu.appMenu, {
			omitDefaultItems: true
		},
		{
			visible: true,
			items: [
			Mojo.Menu.editItem, {
				label: "Refresh talks",
				command: "do-refresh"
			},
			//Mojo.Menu.prefsItem,
			Mojo.Menu.helpItem]
		});

		this.controller.setupWidget(Mojo.Menu.viewMenu, {
			menuClass: 'no-fade',
		},
		{
			visible: true,
			items: [{
				label: "The Next HOPE",
				width: 256
			},
			{},
			{
				icon: "refresh",
				command: "do-refresh"
			},
			]
		});

		this.controller.setupWidget(Mojo.Menu.commandMenu, {
			menuClass: 'no-fade',
		},
		{
			visible: true,
			items: [{
				toggleCmd: "filter-favorites-all",
				items: [{
					iconPath: "images/fav_filter.png",
					command: "filter-favorites"
				}]
			},
			{
				items: [{
					label: "Days",
					width: 128,
					submenu: "days-menu"
				},
				{
					label: "Locations",
					width: 128,
					submenu: "locations-menu"
				},
				]
			}]
		});

		this.controller.setupWidget('days-menu', null, this.daysMenuModel = {
			items: [],
			toggleCmd: "filter-days-all"
		});

		this.controller.setupWidget('locations-menu', null, this.locationsMenuModel = {
			items: [],
			toggleCmd: "filter-locations-all"
		});

		this.controller.setupWidget("TalksList", {
			itemTemplate: "talks/talks-item-template",
			listTemplate: "talks/talks-list-template",
			swipeToDelete: false,
			reordarable: false,
			filterFunction: this.talks.search.bind(this),
			onItemRendered: this.renderTalk.bind(this)
		},
		this.filterListModel = {
			items: this.talks.list()
		});

		this.talks.registerWatcher(this.updateList.bind(this));

		Mojo.Event.listen(
		this.controller.get("TalksList"), Mojo.Event.listTap, this.listTapHandler.bind(this));

	},

	cleanup: function() {},

	renderTalk: function(listWidget, itemModel, itemNode) {
		//Mojo.Log.info("rendered: ", itemModel.id);
		itemModel.setupWidget(this.controller);
	},

	listTapHandler: function(event) {
		Mojo.Log.info("got list tap for item: ", event.item.id);
		if (!event.originalEvent.target.id) {
			this.controller.stageController.pushScene("talk", event.item);
		}
	},

	handleCommand: function(event) {
		Mojo.Log.info("Got event " + event.type);
		var command;

		if (event.type === Mojo.Event.command) {
			var modelName, command = event.command.split("-", 3);
			if (command[0] === "filter") {
				Mojo.Log.info("Filter command " + event.command);
				this.talks.setFilter(command[1], command[2]);

				modelName = command[1] + "MenuModel";
				if (this[modelName]) {
					this[modelName].toggleCmd = event.command;
				}
			}
			else {
				switch (event.command) {
				case "do-refresh":
					{
						this.talks.refresh();
						break
					};
				default:
					Mojo.Log.info("Event command " + event.command);
				}
			}
		}
	},

	updateList: function() {
		Mojo.Log.info("Updating filterListModel");
		var i, j, available, modelName, menu, command, list
		menus = ["days", "locations"],
		list = this.talks.list();

		this.filterListModel.items = list;
		this.controller.modelChanged(this.filterListModel, this);

		for (i = 0; i < menus.length; i += 1) {
			menu = menus[i];
			modelName = menu + "MenuModel";
			command = "filter-" + menu + "-all";
			available = this.talks[menu]();

			this[modelName].items = [{
				label: "All",
				command: command
			}]

			if (available) {
				for (j = 0; j < available.length; j += 1) {
					this[modelName].items.push({
						label: available[j],
						command: "filter-" + menu + "-" + available[j].toLowerCase()
					})
				}
			}

			Mojo.Log.info("modelChanged: ", modelName);
			//this.controller.modelChanged(this[modelName], this);
		}

	}
};

