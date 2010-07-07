function TalksAssistant(talks) {
	this.talks = talks;
}

TalksAssistant.prototype = {
	setup: function() {
		this.controller.setupWidget(Mojo.Menu.viewMenu, {
			//spacerHeight: 0,
			//menuClass: 'no-fade'
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
				command: "do-Refresh"
			},
			]
		});

		this.controller.setupWidget(Mojo.Menu.commandMenu, {
			spacerHeight: 0,
			//menuClass: 'no-fade'
		},
		{
			visible: true,
			items: [{},
			{
				items: [{
					iconPath: "images/checkmark.png",
					command: "filter-favorites"
				},
				{
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

		this.controller.setupWidget("TalksScroller", {
			mode: 'vertical'
		},
		{});

		this.controller.setupWidget("TalksList", {
			itemTemplate: "talks/talks-row-template",
			listTemplate: "talks/talks-list-template",
			swipeToDelete: false,
			reordarable: false,
			filterFunction: this.talks.search.bind(this)
		},
		this.filterListModel = {
			items: this.talks.list()
		});
		this.talks.registerWatcher(this.updateList.bind(this));
	},

	cleanup: function() {},

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
				case "do-Refresh":
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
		this.filterListModel.items = this.talks.list();
		this.controller.modelChanged(this.filterListModel, this);

		var i, j, available, items, modelName, menu, command
		menus = ["days", "locations"];

		for (i = 0; i < menus.length; i += 1) {
			menu = menus[i];
			modelName = menu + "MenuModel";
			command = "filter-" + menu + "-all";

			items = [{
				label: "All",
				command: command
			}]

			available = this.talks[menu]();
			if (available) {
				for (j = 0; j < available.length; j += 1) {
					items.push({
						label: available[j],
						command: "filter-" + menu + "-" + available[j].toLowerCase()
					})
				}
			}

			Mojo.Log.info("modelChanged: ", modelName);
			this[modelName].items = items;
			//this.controller.modelChanged(this[modelName], this);
		}

	}
};

