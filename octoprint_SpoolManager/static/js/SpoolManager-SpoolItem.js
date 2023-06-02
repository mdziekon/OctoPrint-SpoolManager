// TODO: Figure out better way to export things from closure
let SpoolItem;

(() => {
    /**
     * Note: depends on sources concatenation order as defined in __init__.py & performed by Octoprint.
     * If it ever fails because of architectural change in Octoprint,
     * consider moving these "imports" to a closure ensured to run after everything loads.
     */
    const MATERIALS_DENSITY_MAP = SPOOLMANAGER_CONSTANTS.MATERIALS_DENSITY_MAPPING;
    const FORMAT_DATETIME_LOCAL = SPOOLMANAGER_CONSTANTS.DATES.DISPLAY_FORMATS.DATETIME_LOCAL;
    const FORMAT_DATE = SPOOLMANAGER_CONSTANTS.DATES.DISPLAY_FORMATS.DATE;
    const PARSE_FORMAT_DATETIME = SPOOLMANAGER_CONSTANTS.DATES.PARSE_FORMATS.DATETIME;
    const PARSE_FORMAT_DATE = SPOOLMANAGER_CONSTANTS.DATES.PARSE_FORMATS.DATE;

    const DEFAULT_COLOR = "#ff0000";

    const _getValueOrZero = (x) => {
        return x ? parseFloat(x) : 0;
    }

    SpoolItem = function(spoolData, params) {
        // TODO: Get rid of circular dependency
        const FILAMENT_STATS_CALC_OPTIONS = [
            {
                text: "Filament Amount",
                value: FILAMENT,
            },
            {
                text: "Spool Weight",
                value: SPOOL,
            },
            {
                text: "Combined Weight",
                value: COMBINED,
            },
        ];

        const {
            isEditable,
            catalogs
        } = params ?? {};
        // Init Item

        // if we use the Item for Editing we need to initialise the widget-model as well , e.g. Option-Values, Suggestion-List
        // if we just use this Item in readonly-mode we need simple ko.observer

        this.selectedFromQRCode = ko.observable(false);
        this.selectedForTool = ko.observable(0);    // Default Tool 0
        this.isFilteredForSelection = ko.observable(false);
        // - list all attributes
        this.version = ko.observable();
        this.isSpoolVisible = ko.observable(false);
        this.hasNoData = ko.observable();
        this.databaseId = ko.observable();
        this.isTemplate = ko.observable();
        this.isActive = ko.observable();
        this.isInActive = ko.observable();
        this.displayName = ko.observable();
        this.density = ko.observable();
        this.diameter = ko.observable();
        this.diameterTolerance = ko.observable();
        this.flowRateCompensation = ko.observable();
        this.temperature = ko.observable();
        this.bedTemperature = ko.observable();
        this.enclosureTemperature = ko.observable();
        this.offsetTemperature = ko.observable();
        this.offsetBedTemperature = ko.observable();
        this.offsetEnclosureTemperature = ko.observable();
        this.colorName = ko.observable();
        this.color = ko.observable();
        this.totalWeight = ko.observable();
        this.spoolWeight = ko.observable();
        this.remainingWeight = ko.observable();
        this.remainingPercentage = ko.observable();
        this.totalLength = ko.observable();
        this.usedLength = ko.observable();
        this.usedLengthPercentage = ko.observable();
        this.remainingLength = ko.observable();
        this.remainingLengthPercentage = ko.observable();
        this.usedWeight = ko.observable();
        this.usedPercentage = ko.observable();
        this.code = ko.observable();
        this.noteText = ko.observable()
        this.noteDeltaFormat = ko.observable()
        this.noteHtml = ko.observable()

        this.firstUse = ko.observable();
        this.lastUse = ko.observable();
        this.firstUseKO = ko.observable();
        this.lastUseKO = ko.observable();
        this.purchasedOn = ko.observable();
        this.purchasedOnKO = ko.observable();
        this.purchasedFrom = ko.observable();
        this.cost = ko.observable();
        this.costUnit = ko.observable();

        if (isEditable) {
            // TODO: This should be done in EditSpoolDialog
            const vendorViewModel = ComponentFactory.createSelectWithFilter("spool-vendor-select", $('#spool-form'));
            const materialViewModel = ComponentFactory.createSelectWithFilter("spool-material-select", $('#spool-form'));
            const colorViewModel = ComponentFactory.createColorPicker("filament-color-picker");
            const firstUseViewModel = ComponentFactory.createDateTimePicker("firstUse-date-picker");
            const lastUseViewModel = ComponentFactory.createDateTimePicker("lastUse-date-picker");
            const purchasedOnViewModel = ComponentFactory.createDateTimePicker("purchasedOn-date-picker", false);
            const labelsViewModel = ComponentFactory.createLabels("spool-labels-select", $('#spool-form'));

            this.vendor = vendorViewModel.selectedOption;
            this.allVendors = vendorViewModel.allOptions;
            this.material = materialViewModel.selectedOption;
            // this.allMaterials = materialViewModel.allOptions;
            this.labels = labelsViewModel.selectedOptions;
            this.allLabels = labelsViewModel.allOptions;

            this.color = colorViewModel.selectedColor;
            this.color(DEFAULT_COLOR);
            this.firstUse = firstUseViewModel.currentDateTime;
            this.lastUse = lastUseViewModel.currentDateTime;
            this.purchasedOn = purchasedOnViewModel.currentDateTime;
        } else {
            this.vendor = ko.observable();
            this.allVendors = ko.observableArray();
            this.material = ko.observable();
            this.labels = ko.observableArray();
            this.allLabels = ko.observableArray();
        }

        // Autosuggest for "density"
        this.material.subscribe((newMaterial) => {
            if (
                !$(elementSelector).is(":visible") ||
                !this.isSpoolVisible()
            ) {
                return;
            }
            if (!newMaterial) {
                return;
            }

            const newMaterialDensity = MATERIALS_DENSITY_MAP[newMaterial.toUpperCase()];

            if (!newMaterialDensity) {
                return;
            }

            this.density(newMaterialDensity);
        });

        // Non-persistent fields (these exist only in this view model for weight-calculation)
        this.totalCombinedWeight = ko.observable();
        this.remainingCombinedWeight = ko.observable();
        this.drivenScope = ko.observable();
        this.drivenScopeOptions = FILAMENT_STATS_CALC_OPTIONS;

        // Fill Item with data
        this.update(spoolData, { catalogs });
    }

    SpoolItem.prototype.update = function (data, params) {
        var updateData = data || {};
        const { catalogs } = params ?? {};

        if (catalogs) {
            this.allLabels.removeAll();
            ko.utils.arrayPushAll(this.allLabels, catalogs.labels);

            // this.allMaterials(catalogs.materials);
            this.allVendors(catalogs.vendors);
        }

        this.selectedFromQRCode(updateData.selectedFromQRCode);
        this.selectedForTool(updateData.selectedForTool);
        this.hasNoData(data == null);
        this.version(updateData.version);
        this.databaseId(updateData.databaseId);
        this.isTemplate(updateData.isTemplate);
        this.isActive(updateData.isActive);
        this.isInActive(!updateData.isActive);
        this.displayName(updateData.displayName);
        this.vendor(updateData.vendor);

        this.material(updateData.material);
        this.density(updateData.density);
        this.diameter(updateData.diameter);
        this.diameterTolerance(updateData.diameterTolerance);
        // first update color code, and then update the color name
        this.color(updateData.color == null ? DEFAULT_COLOR : updateData.color);
        // if no custom color name present, use predefined name
        if (updateData.colorName == null || updateData.colorName.length == 0){
            var preDefinedColorName = tinycolor(this.color()).toName();
            if (preDefinedColorName != false){
                this.colorName(preDefinedColorName);
            }
        } else {
            this.colorName(updateData.colorName);
        }

        this.flowRateCompensation(updateData.flowRateCompensation);
        this.temperature(updateData.temperature);
        this.bedTemperature(updateData.bedTemperature);
        this.enclosureTemperature(updateData.enclosureTemperature);
        this.offsetTemperature(updateData.offsetTemperature);
        this.offsetBedTemperature(updateData.offsetBedTemperature);
        this.offsetEnclosureTemperature(updateData.offsetEnclosureTemperature);
        this.totalWeight(parseFloat(updateData.totalWeight));
        this.spoolWeight(parseFloat(updateData.spoolWeight));
        this.remainingWeight(parseFloat(updateData.remainingWeight));
        this.remainingPercentage(updateData.remainingPercentage);
        this.code(updateData.code);
        this.usedPercentage(updateData.usedPercentage);

        this.totalLength(updateData.totalLength);
        this.usedLength(updateData.usedLength);
        this.usedLengthPercentage(updateData.usedLengthPercentage);
        this.remainingLength(updateData.remainingLength);
        this.remainingLengthPercentage(updateData.remainingLengthPercentage);
        this.usedWeight(parseFloat(updateData.usedWeight));

        this.firstUse(updateData.firstUse);
        this.lastUse(updateData.lastUse);
        this.purchasedOn(updateData.purchasedOn);

        if (updateData.firstUse) {
            const convertedDateTime = moment(data.firstUse, PARSE_FORMAT_DATETIME).format(FORMAT_DATETIME_LOCAL);

            this.firstUseKO(convertedDateTime);
        }
        if (updateData.lastUse) {
            const convertedDateTime = moment(data.lastUse, PARSE_FORMAT_DATETIME).format(FORMAT_DATETIME_LOCAL);

            this.lastUseKO(convertedDateTime);
        }
        if (updateData.purchasedOn) {
            const convertedDateTime = moment(data.purchasedOn, PARSE_FORMAT_DATE).format(FORMAT_DATE);

            this.purchasedOnKO(convertedDateTime);
        }

        this.purchasedFrom(updateData.purchasedFrom);

        this.cost(updateData.cost);
        this.costUnit(updateData.costUnit);

        // update label selections
        if (updateData.labels != null){
            this.labels.removeAll();
            selectedLabels = updateData.labels
            if (Array.isArray(updateData.labels) == false) {
                selectedLabels = JSON.parse(updateData.labels)
            }
            ko.utils.arrayPushAll(this.labels, selectedLabels);
        }

        // assign content to the Note-Section
        // fill Obseravbles
        this.noteText(updateData.noteText);
        this.noteDeltaFormat(updateData.noteDeltaFormat);
        if (updateData.noteHtml != null){
            this.noteHtml(updateData.noteHtml);
        } else {
            // Fallback text
            this.noteHtml(updateData.noteText);
        }

        // Calculate derived fields (these exists only in this view model)
        this.totalCombinedWeight(_getValueOrZero(updateData.totalWeight) + _getValueOrZero(updateData.spoolWeight));
        this.remainingCombinedWeight(_getValueOrZero(updateData.remainingWeight) + _getValueOrZero(updateData.spoolWeight));
    };
})();
