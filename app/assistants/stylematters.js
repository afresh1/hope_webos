/* code from stylematters 
 *
 * BSD Licensed, see:
 * http://github.com/palm/stylematters/blob/master/app/assistants/collapsibledividers-example-assistant.js
 */

styleMatters = {
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
			styleMatters._toggleShowHideFolders(targetRow, this.controller.window.innerHeight, null, category).bind(this);
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
			onComplete: styleMatters._animationComplete.bind(this, showFavorites, categoryItems, folderContainer),
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
