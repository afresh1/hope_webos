function TalksAssistant(talks) {
	this.talks = talks;
}

TalksAssistant.prototype = {
	setup: function() {
		this.controller.setupWidget(Mojo.Menu.viewMenu, this.attributes = {
			//spacerHeight: 0,
			//menuClass: 'no-fade'
		},
		this.model = {
			visible: true,
			items: [{},
			{
				label: "The Next HOPE",
				width: 210
			},
			{
				icon: "refresh",
				command: "do-Refresh"
			},
			]
		});

		this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
			spacerHeight: 0,
			//menuClass: 'no-fade'
		},
		this.model = {
			visible: true,
			items: [{
				icon: "checkedbox",
				command: "filter-favorites"
			},
			{
				label: "Day",
				command: "filter-day",
				width: 128
			},
			{
				label: "Location",
				command: "filter-location",
				width: 128
			},
			]
		});

		this.controller.setupWidget("TalksScroller", 
            this.talksScrollerModel = { mode: 'vertical' });

		this.controller.setupWidget("TalksList", {
                itemTemplate: "talks/talks-row-template",
                listTemplate: "talks/talks-list-template",
                swipeToDelete: false,
                reordarable: false,
                //filterFunction: this.talks.filterList.bind(this),
            },
            this.filterListModel = {
                items: this.talks.list()
		    }
        );

        this.talks.registerWatcher( this.updateList.bind(this) );
	},

	cleanup: function() {},

	handleCommand: function(event) {
		Mojo.Log.info("Got event " + event.type);
		if (event.type === Mojo.Event.command) {
			switch (event.command) {
			case "do-Refresh":
				{
					this.talks.refresh(this.updateList);
					break
				};
			default:
				Mojo.Log.info("Event command " + event.command);
			}
		}
	},

	updateList: function() {
        Mojo.Log.info("Updating filterListModel");
		this.filterListModel.items = this.talks.list();
		this.controller.modelChanged(this.filterListModel, this);
	}
};

