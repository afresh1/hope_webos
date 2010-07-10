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
	compressors: [],
	lastWhen: '',
	setup: function() {
		Mojo.Log.info("Setup TalksAssistant");

		this.talks.registerWatcher(this.updateList.bind(this));
		this.talks.setup();

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
				label: "Locations",
				submenu: "locations-menu"
			},
			{},
			{
				label: "Notice",
				command: "do-notice"
			}]
		});

		this.controller.setupWidget('locations-menu', null, this.locationsMenuModel = {
			items: [],
			toggleCmd: "filter-locations-all"
		});

		this.controller.setupWidget("refresh-spinner", {
			spinnerSize: Mojo.Widget.spinnerLarge
		},
		{
			spinning: true
		});

		this.controller.setupWidget("TalksList", this.talksListAttributes = {
			itemTemplate: "talks/talks-item-template",
			//listTemplate: "talks/talks-list-template",
			dividerTemplate: 'talks/talks-divider-template',
			dividerFunction: function(modelItem) {
				return modelItem.day
			},
			swipeToDelete: false,
			reordarable: false,
			filterFunction: this.talks.search.bind(this),
			renderLimit: 200,
			onItemRendered: this.renderTalk.bind(this)
		},
		this.filterListModel = {
			items: this.talks.list
		});

		this.controller.listen(
		this.controller.get("TalksList"), Mojo.Event.listTap, this.listTapHandler.bind(this));

	},

	cleanup: function() {
		Mojo.Log.info("Cleanup talks-assistant");
		this.controller.stopListening(
		this.controller.get("TalksList"), Mojo.Event.listTap, this.listTapHandler.bind(this));

		this.talks.list.invoke('cleanup');

		this.compressors.each(function(compress) {
			this.controller.stopListening(compress[0], Mojo.Event.tap, this._handleDrawerSelection.bind(this, compress[1], compress[2]));
		}.bind(this));
	},

	activate: function() {
		// XXX for some reason, items that are collapsed away don't keep 
		// XXX their favorite icon if we do this.
		//this.talks.setFilter();
	},

	renderTalk: function(listWidget, itemModel, itemNode) {
		//Mojo.Log.info("rendered:", itemModel.id);
		itemModel.setup(this.controller);
	},

	listTapHandler: function(event) {
		Mojo.Log.info("got list tap for item:", event.item.id);
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
						this.controller.get("refresh-spinner").mojo.start();
						this.controller.get("refresh-scrim").show();
						this.talks.refresh();
						break
					};
				case "do-notice":
					{
						this.talks.showNotice(this.controller);
						break
					}
				default:
					Mojo.Log.info("Event command " + event.command);
				}
			}
		}
	},

	updateList: function() {
		Mojo.Log.info("Updating filterListModel");
		var available, modelName, command, menus = ["locations"];

		var widget = this.controller.get("TalksList");

		if (this.talks.list.length < widget.mojo.getLength()) {
			widget.mojo.noticeRemovedItems(this.talks.list.length, widget.mojo.getLength() - 1);
		}
		else if (this.talksListAttributes.renderLimit < this.talks.list.length + 1) {
			this.talksListAttributes.renderLimit = this.talks.list.length + 1;;
		}

		widget.mojo.noticeUpdatedItems(0, this.talks.list);

		menus.each(function(menu) {
			modelName = menu + "MenuModel";
			command = "filter-" + menu + "-all";
			available = this.talks[menu]();

			this[modelName].items = [{
				label: "All",
				command: command
			}]

			if (available) {
				available.each(function(item) {
					this[modelName].items.push({
						label: item,
						command: "filter-" + menu + "-" + item.toLowerCase()
					});
				}.bind(this));
			}
		}.bind(this));

        this.lastWhen = '';
		this.talks.list.each(function(itemModel) {
			if (this.lastWhen === itemModel.when) {
				this.controller.get("separator" + itemModel.id).hide();
			}
			else {
				this.controller.get("separator" + itemModel.id).show();
			}
			this.lastWhen = itemModel.when;
		}.bind(this));

		this.talks.days().each(this.attachCompressorHandler.bind(this));

		this.controller.get("refresh-scrim").hide();
		this.controller.get("refresh-spinner").mojo.stop();
	},

	attachCompressorHandler: function(item) {
		Mojo.Log.info("attachCompressorHandler:", item);

		var compress = this.controller.get('compress' + item);
		var compressable = this.controller.get('compressable' + item)
		if (compress && compressable) {
			compressable.hide();

			if (!compress.hasClassName('compressor')) {
				compress.addClassName('compressor')
				compress.compressorID = item.day;
				this.controller.listen(compress, Mojo.Event.tap, this._handleDrawerSelection.bind(this, compressable, item));
				this.compressors.push([compress, compressable, item]);
			}
			var categoryItems = this.getElementsOfCategory(item.category);
			categoryItems.each(this.moveElementsIntoDividers.bind(this));
		}

	},

	moveElementsIntoDividers: function(item, index) {
		//mv elements into their appropriate collapsable dividers element#{id}
		var compressable = this.controller.get('compressable' + item.day);
		compressable.insert(this.controller.get('element' + item.id));
		this.controller.get('element' + item.id).show();
	},

	moveElementsOutOfDividers: function(item, index) {
		//mv elements back into their original holders element_holder#{id}
		this.controller.get('element_holder' + item.id).insert(this.controller.get('element' + item.id));
	},

	getElementsOfCategory: function(day) {
		return this.talks.list.findAll(function(example) {
			return example.day === day;
		});
	},

	/* code below from stylematters 
 *
 * BSD Licensed, see:
 * http://github.com/palm/stylematters/blob/master/app/assistants/collapsibledividers-example-assistant.js
 */

	_handleDrawerSelection: function(drawer, category, event) {
		Mojo.Log.info("handleDrawerSelection");
		var targetRow = this.controller.get(event.target);
		if (!targetRow.hasClassName("selection_target")) {
			Mojo.Log.info("handleSoftwareSelection !selection_target");
			targetRow = targetRow.up('.selection_target');
		}

		if (targetRow) {
			var toggleButton = targetRow.down("div.arrow_button");
			if (!toggleButton.hasClassName('palm-arrow-expanded') && ! toggleButton.hasClassName('palm-arrow-closed')) {
				return;
			}
			var show = toggleButton.className;
			Mojo.Log.info("handleSoftwareSelection open/close " + show);
			this._toggleShowHideFolders(targetRow, this.controller.window.innerHeight, null, category);
		}
	},

	_toggleShowHideFolders: function(rowElement, viewPortMidway, noScroll, category) {
		if (!rowElement.hasClassName("details")) {
			return;
		}

		var toggleButton = rowElement.down("div.arrow_button");
		if (!toggleButton.hasClassName('palm-arrow-expanded') && ! toggleButton.hasClassName('palm-arrow-closed')) {
			return;
		}

		var categoryItems = this.getElementsOfCategory(category);
		//Mojo.Log.info(category);
		//console.dir(categoryItems);
		var showFavorites = toggleButton.hasClassName('palm-arrow-closed');
		var folderContainer = rowElement.down('.collapsor');
		if (showFavorites) {
			var maxHeight = folderContainer.getHeight();
			toggleButton.addClassName('palm-arrow-expanded');
			toggleButton.removeClassName('palm-arrow-closed');
			folderContainer.setStyle({
				height: '1px'
			});
			folderContainer.show();

			// See if the div should scroll up a little to show the contents
			var elementTop = folderContainer.viewportOffset().top;
			var scroller = Mojo.View.getScrollerForElement(folderContainer);
			if (elementTop > viewPortMidway && scroller && ! noScroll) {
				//Using setTimeout to give the animation time enough to give the div enough height to scroll to
				var scrollToPos = scroller.mojo.getScrollPosition().top - (elementTop - viewPortMidway);
				setTimeout(function() {
					scroller.mojo.scrollTo(undefined, scrollToPos, true);
				},
				200);
			}
		} else {
			folderContainer.setStyle({
				height: maxHeight + 'px'
			});
			toggleButton.addClassName('palm-arrow-closed');
			toggleButton.removeClassName('palm-arrow-expanded');
			categoryItems.each(this.moveElementsIntoDividers.bind(this));
			var maxHeight = folderContainer.getHeight();
		}

		var options = {
			reverse: ! showFavorites,
			onComplete: this._animationComplete.bind(this, showFavorites, categoryItems, folderContainer),
			curve: 'over-easy',
			from: 1,
			to: maxHeight,
			duration: 0.4
		};
		Mojo.Animation.animateStyle(folderContainer, 'height', 'bezier', options);
	},

	_animationComplete: function(showFavorites, categoryItems, folderContainer) {
		if (!showFavorites) {
			folderContainer.hide();
		} else {
			categoryItems.each(this.moveElementsOutOfDividers.bind(this));
		}
		folderContainer.setStyle({
			height: 'auto'
		});
	}
};

