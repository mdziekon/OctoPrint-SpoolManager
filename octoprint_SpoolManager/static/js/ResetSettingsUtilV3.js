function ResetSettingsUtilV3(pluginSettings) {
    const pluginSettingsFromPlugin = pluginSettings;

    const RESET_BUTTON_ID = "resetSettingsButton"
    const RESET_BUTTON_HTML = `<button id="${RESET_BUTTON_ID}" class="btn btn-warning" style="margin-right:3%">Reset Settings</button>`;
    const RESET_BUTTON_SELECTOR = `#${RESET_BUTTON_ID}`;

    this.assignResetSettingsFeature = function (PLUGIN_ID_string, mapSettingsToViewModel_function) {
        /**
         * TODO: PrintJobHistory uses the same name ("resetSettingsButtonFunction")
         * to check for event listener existence.
         * Eventually, these two should live their separate lives, and not depend on one another,
         * but for now keep the name for compatibility sake.
         */
        const resetSettingsButtonFunction = () => {
            $(RESET_BUTTON_SELECTOR).hide();
        };

        // hide reset button when hidding settings. needed because of next dialog-shown event
        const $settingsDialog = $("#settings_dialog");
        const settingsDialogDOMElement = $settingsDialog.get(0);

        const eventObject = $._data(settingsDialogDOMElement, 'events');
        if (
            !eventObject?.hide ||
            eventObject.hide[0].handler.name != resetSettingsButtonFunction.name
        ) {
            $settingsDialog.on('hide', resetSettingsButtonFunction);
        }

        const pluginSettingsLink = $("ul[id=settingsTabs] > li[id^=settings_plugin_"+PLUGIN_ID_string+"] > a[href^=\\#settings_plugin_"+PLUGIN_ID_string+"]:not([hooked="+PLUGIN_ID_string+"])");
        pluginSettingsLink.attr("hooked", PLUGIN_ID_string);
        pluginSettingsLink.click(function() {
            // call backend, is resetSettingsButtonEnabled
            // hide reset settings button
            $.ajax({
                url: `${API_BASEURL}plugin/${PLUGIN_ID_string}?action=isResetSettingsEnabled`,
                type: "GET",
            }).done(function(data) {
                let resetButton = $(RESET_BUTTON_SELECTOR);

                if (data.enabled == "true") {
                    // build-button, if necessary
                    if (resetButton.length == 0) {
                        $(".modal-footer > .aboutlink").after(RESET_BUTTON_HTML);
                        resetButton = $(RESET_BUTTON_SELECTOR);
                    }

                    // add/update click action
                    resetButton.unbind("click");
                    resetButton.click(function() {
                        $.ajax({
                            url: `${API_BASEURL}plugin/${PLUGIN_ID_string}?action=resetSettings`,
                            type: "GET",
                        }).done(function(data) {
                            new PNotify({
                                title: "Default settings saved!",
                                text: "The plugin settings have now been reset to the default values.<br>Please do a Browser reload (Strg + F5) to update all settings in the UI.",
                                type: "info",
                                hide: true,
                            });
                            // reset all values
                            for (let propName in data) {
                                const propValue = data[propName];
                                // nested object, like databaseSettings? only a depth of 1
                                if (typeof propValue == "object") {
                                    for (let subPropName in propValue) {
                                        subPropValue = propValue[subPropName];
                                        pluginSettingsFromPlugin[propName][subPropName](propValue);
                                    }
                                } else {
                                    pluginSettingsFromPlugin[propName](propValue);
                                }
                            }

                            // delegate to the client. So client is able to reset/init other values
                            mapSettingsToViewModel_function(data);
                        });
                    });

                    resetButton.show();
                } else {
                    if (resetButton.length) {
                        resetButton.hide();
                    }
                }
            });
        });

        // default behaviour -> hide reset button --> if not already assigned
        const otherSettingsLink = $("ul[id=settingsTabs] > li[id^=settings_] > a[href^=\\#settings_]:not([hooked])");
        if (otherSettingsLink.length) {
            otherSettingsLink.attr("hooked", "otherSettings");
            otherSettingsLink.click(resetSettingsButtonFunction);
        }
    }
}
