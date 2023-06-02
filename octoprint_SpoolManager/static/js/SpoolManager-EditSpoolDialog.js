/**
 * Note: depends on sources concatenation order as defined in __init__.py & performed by Octoprint.
 * If it ever fails because of architectural change in Octoprint,
 * consider moving these "imports" to a closure ensured to run after everything loads.
 */
const MATERIALS_DENSITY_MAP = SPOOLMANAGER_CONSTANTS.MATERIALS_DENSITY_MAPPING;

const FORMAT_DATETIME_LOCAL = "YYYY-MM-DDTHH:mm";
const FORMAT_DATE = "YYYY-MM-DD";
const PARSE_FORMAT_DATETIME = "DD.MM.YYYY HH:mm";
const PARSE_FORMAT_DATE = "DD.MM.YYYY";

const elementSelector = "#dialog_spool_edit";

const FILAMENT = "filament";
const COMBINED = "spool+filament";
const SPOOL = "spool";

const DEFAULT_DRIVEN_SCOPE = COMBINED;

// Dialog functionality
function SpoolManagerEditSpoolDialog(props){
    const { managerViewModel } = props;

    var self = this;

    ///////////////////////////////////////////////////////////////////////////////////////////////////////// CONSTANTS
    self.scopeValues = {
        FILAMENT: FILAMENT,
        SPOOL: SPOOL,
        COMBINED: COMBINED,
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////// ITEM MODEL



    ///////////////////////////////////////////////////////////////////////////////////////////////// Instance Variables
    self.componentFactory = new ComponentFactory();
    self.spoolDialog = null;
    self.templateSpoolDialog = null;
    self.closeDialogHandler = null;
    self.spoolItemForEditing = null;
    self.templateSpools = ko.observableArray([]);
    self.noteEditor = null;

    self.catalogs = null;
    self.allMaterials = ko.observableArray([]);
    self.allVendors = ko.observableArray([]);
    self.allColors = ko.observableArray([]);

    self.allToolIndices = ko.observableArray([]);

    // Knockout stuff
    this.isExistingSpool = ko.observable(false);
    this.spoolSelectedByQRCode = ko.observable(false);


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////// HELPER
    const isEveryMandatoryFieldValid = () => {
        return (
            self.isDisplayNamePresent() &&
            self.isColorNamePresent() &&
            self.isTotalCombinedWeightPresent()
        );
    };

    const isEveryFilledDateFieldValid = () => {
        const firstUse = self.spoolItemForEditing.firstUseKO() || "";
        const lastUse = self.spoolItemForEditing.lastUseKO() || "";
        const purchasedOn = self.spoolItemForEditing.purchasedOnKO() || "";

        if (
            firstUse.trim().length > 0 &&
            !(moment(firstUse, FORMAT_DATETIME_LOCAL).isValid())
        ) {
            return false
        }
        if (
            lastUse.trim().length > 0 &&
            !(moment(lastUse, FORMAT_DATETIME_LOCAL).isValid())
        ) {
            return false;
        }
        if (
            purchasedOn.trim().length > 0 &&
            !(moment(purchasedOn, FORMAT_DATE).isValid())
        ) {
            return false;
        }

        return true;
    };

    self.isFormValidForSubmit = ko.pureComputed(function () {
        return (
            isEveryMandatoryFieldValid() &&
            isEveryFilledDateFieldValid()
        );
    });

    self.isDisplayNamePresent = function() {
        const displayName = self.spoolItemForEditing.displayName() || "";

        return (displayName.trim().length > 0);
    }

    self.isColorNamePresent = function() {
        const colorName = self.spoolItemForEditing.colorName() || "";

        return (colorName.trim().length > 0);
    }

    self.isTotalCombinedWeightPresent = function() {
        const totalCombinedWeight = self.spoolItemForEditing.totalCombinedWeight();

        return (String(totalCombinedWeight || "").trim().length > 0);
    }

    this._updateFilamentIcon = function(newColor) {
        const primaryColor = newColor;
        const secondaryColor = tinycolor(primaryColor).darken(12).toString();

        const $iconElement = document.querySelector("#svg-filament");

        [ ...$iconElement.querySelectorAll("rect") ].forEach(($element, elementIdx) => {
            const colorFill = elementIdx % 2 === 0 ?
                primaryColor :
                secondaryColor

            $element.setAttribute("fill", colorFill);
        });
        [ ...$iconElement.querySelectorAll("path") ].forEach(($element) => {
            $element.setAttribute("stroke", primaryColor);
        });
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////// PUBLIC
    this.initBinding = function(apiClient, pluginSettings, printerProfilesViewModel){

        self.autoUpdateEnabled = false;
        self.apiClient = apiClient;
        self.pluginSettings = pluginSettings;
        self.printerProfilesViewModel = printerProfilesViewModel;

        self.spoolDialog = $("#dialog_spool_edit");
        self.templateSpoolDialog = $("#dialog_template_spool_selection");

        self.noteEditor = new Quill('#spool-note-editor', {
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link']
                ]
            },
            theme: 'snow'
        });

        Quill.prototype.getHtml = function() {
            return this.container.querySelector('.ql-editor').innerHTML;
        };

        // initial coloring
        self._createSpoolItemForEditing();
        self._updateFilamentIcon(self.spoolItemForEditing.color());
        self.spoolItemForEditing.color.subscribe(function(newColor){
            self._updateFilamentIcon(newColor);
            var colorName = tinycolor(newColor).toName();
            if (colorName != false){
                self.spoolItemForEditing.colorName(colorName);
            }
        });
        // ----------------- start: weight stuff
        var remainingWeightKo = self.spoolItemForEditing.remainingWeight;
        var totalWeightKo = self.spoolItemForEditing.totalWeight;
        var usedWeightKo = self.spoolItemForEditing.usedWeight;
        var remainingCombinedWeightKo = self.spoolItemForEditing.remainingCombinedWeight;
        var spoolWeightKo = self.spoolItemForEditing.spoolWeight;
        var totalCombinedWeightKo = self.spoolItemForEditing.totalCombinedWeight;
        var totalLengthKo = self.spoolItemForEditing.totalLength;
        var usedLengthKo = self.spoolItemForEditing.usedLength;
        var remainingLengthKo = self.spoolItemForEditing.remainingLength;
        var densityKo = self.spoolItemForEditing.density;
        var diameterKo = self.spoolItemForEditing.diameter;
        var usedPercentageKo = self.spoolItemForEditing.usedPercentage;
        var remainingPercentageKo = self.spoolItemForEditing.remainingPercentage;
        var usedLengthPercentageKo = self.spoolItemForEditing.usedLengthPercentage;
        var remainingLengthPercentageKo = self.spoolItemForEditing.remainingLengthPercentage;
        var drivenScopeKo = self.spoolItemForEditing.drivenScope;

        function addition(a, b) {
            return a + b;
        }

        function subtraction(a, b) {
            return a - b;
        }

        // Subscriptions for auto updates

        totalWeightKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(totalWeightKo);
            if (drivenScopeKo() === SPOOL) {
                self.updateSpoolWithScopes();
            } else {
                self.updateCombinedInitialWithScopes();
            }
            self.updateFilamentRemainingWithStates();
            self.doUnitConversion(totalWeightKo, totalLengthKo, self.convertToLength);
            self.updatePercentages(usedPercentageKo, remainingPercentageKo, totalWeightKo, usedWeightKo);
            self.resetLocksIf(iAmRootChange);
        });

        totalLengthKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(totalLengthKo);
            self.doUnitConversion(totalLengthKo, totalWeightKo, self.convertToWeight);
            self.updatePercentages(usedLengthPercentageKo, remainingLengthPercentageKo, totalLengthKo, usedLengthKo);
            self.resetLocksIf(iAmRootChange);
        });

        usedWeightKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(usedWeightKo);
            self.doUnitConversion(usedWeightKo, usedLengthKo, self.convertToLength);
            self.updateFilamentRemainingWithStates();
            self.updatePercentages(usedPercentageKo, remainingPercentageKo, totalWeightKo, usedWeightKo);
            self.resetLocksIf(iAmRootChange);
        });

        usedLengthKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(usedLengthKo);
            self.doUnitConversion(usedLengthKo, usedWeightKo, self.convertToWeight);
            self.updatePercentages(usedLengthPercentageKo, remainingLengthPercentageKo, totalLengthKo, usedLengthKo);
            self.resetLocksIf(iAmRootChange);
        });

        remainingWeightKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(remainingWeightKo);
            if (drivenScopeKo() === COMBINED) {
                self.updateCombinedRemainingWithScopes();
            }
            self.updateFilamentUsedWithStates();
            self.doUnitConversion(remainingWeightKo, remainingLengthKo, self.convertToLength);
            self.updatePercentages(usedPercentageKo, remainingPercentageKo, totalWeightKo, usedWeightKo);
            self.resetLocksIf(iAmRootChange);
        });

        remainingLengthKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(remainingLengthKo);
            self.doUnitConversion(remainingLengthKo, remainingWeightKo, self.convertToWeight);
            self.updatePercentages(usedLengthPercentageKo, remainingLengthPercentageKo, totalLengthKo, usedLengthKo);
            self.resetLocksIf(iAmRootChange);
        });

        densityKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(densityKo);
            self.convertAllUnits();
            self.resetLocksIf(iAmRootChange);
        })

        diameterKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(diameterKo);
            self.convertAllUnits();
            self.resetLocksIf(iAmRootChange);
        })

        spoolWeightKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(spoolWeightKo);
            if (drivenScopeKo() === FILAMENT) {
                self.updateFilamentInitialWithScopes();
            } else if (drivenScopeKo() === COMBINED) {
                self.updateCombinedInitialWithScopes();
                self.updateCombinedRemainingWithScopes();
            }
            self.resetLocksIf(iAmRootChange);
        });

        totalCombinedWeightKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(totalCombinedWeightKo);
            if (drivenScopeKo() === FILAMENT) {
                self.updateFilamentInitialWithScopes();
            } else if (drivenScopeKo() === SPOOL) {
                self.updateSpoolWithScopes();
            }
            self.resetLocksIf(iAmRootChange);
        });

        remainingCombinedWeightKo.subscribe(function (newValue) {
            var iAmRootChange = self.amIRootChange(remainingCombinedWeightKo);
            if (drivenScopeKo() === FILAMENT) {
                self.updateFilamentRemainingWithScopes();
            }
            self.resetLocksIf(iAmRootChange);
        });

        // Update functions

        self.updateFilamentRemainingWithStates = function () {
            self.safeUpdate(remainingWeightKo, subtraction, [totalWeightKo, usedWeightKo]);
        };

        self.updateFilamentRemainingWithScopes = function () {
            self.safeUpdate(remainingWeightKo, subtraction, [remainingCombinedWeightKo, spoolWeightKo]);
        };

        self.updateFilamentUsedWithStates = function () {
            self.safeUpdate(usedWeightKo, subtraction, [totalWeightKo, remainingWeightKo]);
        };

        self.updateFilamentInitialWithScopes = function () {
            self.safeUpdate(totalWeightKo, subtraction, [totalCombinedWeightKo, spoolWeightKo]);
        };

        self.updateSpoolWithScopes = function () {
            self.safeUpdate(spoolWeightKo, subtraction, [totalCombinedWeightKo, totalWeightKo]);
        };

        self.updateCombinedInitialWithScopes = function () {
            self.safeUpdate(totalCombinedWeightKo, addition, [totalWeightKo, spoolWeightKo]);
        };

        self.updateCombinedRemainingWithScopes = function () {
            self.safeUpdate(remainingCombinedWeightKo, addition, [remainingWeightKo, spoolWeightKo]);
        };

        self.convertAllUnits = function () {
            self.doUnitConversion(totalWeightKo, totalLengthKo, self.convertToLength);
            self.doUnitConversion(totalLengthKo, totalWeightKo, self.convertToWeight);
            self.doUnitConversion(usedWeightKo, usedLengthKo, self.convertToLength);
            self.doUnitConversion(usedLengthKo, usedWeightKo, self.convertToWeight);
            self.doUnitConversion(remainingWeightKo, remainingLengthKo, self.convertToLength);
            self.doUnitConversion(remainingLengthKo, remainingWeightKo, self.convertToWeight);
        };

        self.doUnitConversion = function (sourceKo, targetKo, converter) {
            var source = parseFloat(sourceKo());
            if (isNaN(source) || !self.areDensityAndDiameterValid() || !self.getLock(targetKo)) {
                return;
            }
            self.getLock(sourceKo);
            targetKo(converter(source, parseFloat(densityKo()), parseFloat(diameterKo())));
        };

        self.updatePercentages = function (usedPercentageKo, remainPercentageKo, totalKo, usedKo) {
            var total = parseFloat(totalKo());
            var used = parseFloat(usedKo());
            if (isNaN(total) || total <= 0
                || isNaN(used) || used < 0 || used > total) {
                usedPercentageKo(NaN);
                remainPercentageKo(NaN);
                return;
            }
            var usedPercentage = roundWithPrecision(
                100 * used / total,
                0
            );
            usedPercentageKo(usedPercentage);
            remainPercentageKo(100 - usedPercentage);
        };

        self.safeUpdate = function (targetKo, calcFn, calcFnArguments) {
            if (!self.getLock(targetKo)) {
                return;
            }

            function getValueOrZero(x) {
                return parseFloat(x()) || 0;
            }

            targetKo(roundWithPrecision(
                calcFn.apply(null, calcFnArguments.map(getValueOrZero)),
                1
            ));
        };

        // helper functions

        self.areDensityAndDiameterValid = function () {
            var diameter = parseFloat(diameterKo());
            var density = parseFloat(densityKo());
            return (!isNaN(diameter) && diameter > 0
                && !isNaN(density) && density > 0);
        };

        self.convertToLength = function (weight, density, diameter) {
            var volume = weight / (density *  Math.pow(10, -3)); // [mm^3] = [g] / ( [g/cm^3] * 10^-3 )
            var area = (Math.PI / 4) * Math.pow(diameter, 2); // [mm^2] = pi/4 * [mm]^2
            return roundWithPrecision(volume / area, 0); // [mm] = [mm^3] / [mm^2}
        };

        self.convertToWeight = function (length, density, diameter) {
            var area = (Math.PI / 4) * Math.pow(diameter, 2); // [mm^2] = pi/4 * [mm]^2
            var volume = area * length; // [mm^3] = [mm^2] * [mm]
            return roundWithPrecision(volume * density * Math.pow(10, -3), 1); // [g] = [mm^3] * [g/cm^3] * 10^3
        };

        // lock mechanism to prevent infinite update loops

        self.locksOfInProgressUpdate = [];
        self.getLock = function (updatableEntity) {
            if (!self.autoUpdateEnabled || self.locksOfInProgressUpdate.includes(updatableEntity)) {
                return false;
            }
            self.locksOfInProgressUpdate.push(updatableEntity);
            return true;
        };
        self.resetLocksIf = function (condition) {
            if (condition) {
                self.locksOfInProgressUpdate = [];
            }
        };
        self.amIRootChange = function (source) {
            return self.locksOfInProgressUpdate.length === 0 && self.getLock(source);
        };

        // ----------------- end: weight stuff
    }

    this.afterBinding = function(){
    }

    this._createSpoolItemForEditing = function(){
        self.spoolItemForEditing = new SpoolItem(null, true, { catalogs: self.catalogs });

        self.spoolItemForEditing.isInActive.subscribe(function(newValue){
            self.spoolItemForEditing.isActive(!newValue);
        });

        return self.spoolItemForEditing;
    }

    this.createSpoolItemForTable = function(spoolData){
        var newSpoolItem = new SpoolItem(spoolData, false, { catalogs: self.catalogs });
        return newSpoolItem;
    }

    this.updateCatalogs = function(allCatalogs){
        self.catalogs = allCatalogs;
        if (self.catalogs != null){
            self.allMaterials(self.catalogs["materials"]);
            self.allVendors(self.catalogs["vendors"]);
            self.allColors(self.catalogs["colors"]);
        } else {
            self.allMaterials([]);
            self.allVendors([]);
            self.allColors([]);
        }

    }

    this.updateTemplateSpools = function(templateSpoolsData){

        var spoolItemsArray = [];
        if (templateSpoolsData != null && templateSpoolsData.length !=0){
            spoolItemsArray = ko.utils.arrayMap(templateSpoolsData, function (spoolData) {
                var result = self.createSpoolItemForTable(spoolData);
                return result;
            });
        }
        self.templateSpools(spoolItemsArray);
    }

    this.showDialog = function(spoolItem, params) {
        const { onCloseDialog } = params;

        self.autoUpdateEnabled = false;
        self.closeDialogHandler = onCloseDialog;

        self.allToolIndices([]);

        const toolCount = self.printerProfilesViewModel.currentProfileData().extruder.count();

        for (let toolIndex = 0; toolIndex < toolCount; toolIndex++) {
            self.allToolIndices.push(toolIndex);
        }

        self._updateFilamentIcon(self.spoolItemForEditing.color());

        if (spoolItem == null) {
            self.isExistingSpool(false);

            self._updateActiveSpoolItem({});
            self.spoolItemForEditing.isInActive(false);
        } else {
            self.isExistingSpool(true);

            const spoolItemCopy = ko.mapping.toJS(spoolItem);

            self._updateActiveSpoolItem(spoolItemCopy);
        }
        self.spoolItemForEditing.drivenScope(DEFAULT_DRIVEN_SCOPE);
        self.spoolItemForEditing.isSpoolVisible(true);

        self.spoolDialog.modal({
            minHeight: function () {
                return Math.max($.fn.modal.defaults.maxHeight() - 180, 250);
            },
            keyboard: false,
            clickClose: true,
            showClose: false,
            backdrop: "static"
        }).css({
            width: 'auto',
            'margin-left': function () {
                return -($(this).width() / 2);
            }
        });

        self.autoUpdateEnabled = true;
    };

    self._updateActiveSpoolItem = (spoolItem) => {
        const updateData = spoolItem || {};

        // TODO weight: renaming
        self.autoUpdateEnabled = false;

        self.spoolItemForEditing.update(updateData, { catalogs: self.catalogs });

        if (self.noteEditor) {
            if (
                updateData.noteDeltaFormat == null ||
                updateData.noteDeltaFormat.length == 0
            ) {
                // Fallback is text (if present), not Html
                if (updateData.noteText != null) {
                    self.noteEditor.setText(updateData.noteText, 'api');
                } else {
                    self.noteEditor.setText("", 'api');
                }
            } else {
                const deltaFormat = JSON.parse(updateData.noteDeltaFormat);

                self.noteEditor.setContents(deltaFormat, 'api');
            }
        }

        self.autoUpdateEnabled = true;
    };

    self.copySpoolItem = function(){
        self._copySpoolItemForEditing(self.spoolItemForEditing);
    }

    self.copySpoolItemFromTemplate = function(spoolItem) {
        self._copySpoolItemForEditing(spoolItem);
        self._cleanupSpoolItemAfterCopy(spoolItem);

        self.templateSpoolDialog.modal('hide');
    }

    self._copySpoolItemForEditing = function(spoolItem){
        self.isExistingSpool(false);
        let spoolItemCopy = ko.mapping.toJS(spoolItem);
        self._updateActiveSpoolItem(spoolItemCopy);
        self.spoolItemForEditing.isTemplate(false);
        // self.spoolItemForEditing.isActive(true);  is set by 'isInActive'
        self.spoolItemForEditing.isInActive(false);
        self.spoolItemForEditing.databaseId(null);
        self.spoolItemForEditing.isSpoolVisible(true);
    };
    self._cleanupSpoolItemAfterCopy = function (spoolItem) {
        const defaultExcludedFields = [
            "selectedForTool",
            "version",
            "databaseId",
            "isTemplate",
            "firstUseKO",
            "lastUseKO",
            "remainingWeight",
            "remainingPercentage",
            "usedLength",
            "usedLengthPercentage",
            "remainingLength",
            "remainingLengthPercentage",
            "usedWeight",
            "usedPercentage",
            "totalCombinedWeight",
            "remainingCombinedWeight",
        ];
        const customExcludedFields = self.pluginSettings.excludedFromTemplateCopy();

        const allFieldNames = Object.keys(spoolItem);
        for (const fieldName of allFieldNames) {
            if (
                defaultExcludedFields.includes(fieldName) ||
                customExcludedFields.includes(fieldName)
            ) {
                self.spoolItemForEditing[fieldName]("");
            }
        }
        if (customExcludedFields.includes("allNotes")) {
            if (self.noteEditor != null) {
                self.noteEditor.setText("", 'api');
            }
            // self.spoolItemForEditing["noteText"]("");
            // self.spoolItemForEditing["noteDeltaFormat"]("");
            // self.spoolItemForEditing["noteHtml"]("");
        }
    };

    self.saveSpoolItem = async function() {
        // workaround
        self.spoolItemForEditing.costUnit(self.pluginSettings.currencySymbol());

        var noteText = self.noteEditor.getText();
        var noteDeltaFormat = self.noteEditor.getContents();
        var noteHtml = self.noteEditor.getHtml();

        self.spoolItemForEditing.noteText(noteText);
        self.spoolItemForEditing.noteDeltaFormat(noteDeltaFormat);
        self.spoolItemForEditing.noteHtml(noteHtml);

        // read current note values and push to item, because there is no 2-way binding

//        self.printJobItemForEdit.noteText(noteText);
//        self.printJobItemForEdit.noteDeltaFormat(noteDeltaFormat);
//        self.printJobItemForEdit.noteHtml(noteHtml);
//
        const callResult = await self.apiClient.callSaveSpool(self.spoolItemForEditing);

        if (!callResult.isSuccess) {
            return managerViewModel.showPopUp(
                "error",
                'Save Spool',
                'Could not save the spool',
                true,
            );
        }

        self.spoolItemForEditing.isSpoolVisible(false);
        self.spoolDialog.modal('hide');
        self.closeDialogHandler(true, "save");
    }

    self.deleteSpoolItem = async function() {
        const hasConfirmed = confirm("Do you really want to delete this spool?");

        if (!hasConfirmed) {
            return;
        }

        const callResult = await self.apiClient.callDeleteSpool(self.spoolItemForEditing.databaseId());

        if (!callResult.isSuccess) {
            return managerViewModel.showPopUp(
                "error",
                'Delete Spool',
                'Could not delete selected spool',
                true,
            );
        }

        self.spoolItemForEditing.isSpoolVisible(false);
        self.spoolDialog.modal('hide');
        self.closeDialogHandler(true);
    }

    self.selectSpoolItemForPrinting = function(){
        self.spoolItemForEditing.isSpoolVisible(false);
        self.spoolDialog.modal('hide');
        self.closeDialogHandler(false, "selectSpoolForPrinting", self.spoolItemForEditing);
    }

    self.selectAndCopyTemplateSpool = function(){

        /* needed for Filter-Search dropdown-menu */
        $('.dropdown-menu.keep-open').click(function(e) {
            e.stopPropagation();
        });

        self.templateSpoolDialog.modal({
                minHeight: function () {
                    return Math.max($.fn.modal.defaults.maxHeight() - 80, 250);
                },
                show: true
            });
    }
}
