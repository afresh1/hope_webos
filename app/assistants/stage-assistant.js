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

function StageAssistant() {
	/* this is the creator function for your stage assistant object */

}
StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */

	//$$('body')[0].addClassName('palm-dark');

	/* for a simple application, the stage assistant's only task is to push the scene, making it
	   visible */
	this.controller.pushScene("talks");
};

// handleCommand - Setup handlers for menus:
//
StageAssistant.prototype.handleCommand = function(event) {
	// var currentScene = this.controller.activeScene();
	if (event.type == Mojo.Event.commandEnable && event.command == Mojo.Menu.helpCmd) {
		event.stopPropagation(); // kill the disable event
	}
	else if (event.type == Mojo.Event.command) {
		switch (event.command) {
		case 'palm-help-cmd':
			this.controller.pushAppSupportInfoScene();
			break;
		}
	}
};

