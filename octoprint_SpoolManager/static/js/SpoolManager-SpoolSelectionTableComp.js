


function SpoolSelectionTableComp() {
    const PARSE_FORMAT_DATETIME = SPOOLMANAGER_CONSTANTS.DATES.PARSE_FORMATS.DATETIME;

    let self = this;
    //////////////////////////////////////////////////////////////////// browser storage

    //////////////////////////////////////////////////////////////////// public functions
    self.registerSpoolSelectionTableComp = function(){
        var spoolSelectionTableCompHTMLTemplate = $("#spm-select-spool-table").html()
        ko.components.register('spm-select-spool-table', {
            viewModel: self._viewModelFunction,
            template: spoolSelectionTableCompHTMLTemplate
        });
    }

    const dateSortCallback = (extractDate, sortOrientation) => (left, right) => {
        const leftDateValue = extractDate(left);
        const rightDateValue = extractDate(right);

        const leftValue = leftDateValue != null ? leftDateValue : "";
        const rightValue = rightDateValue != null ? rightDateValue : "";

        const sortResult = (() => {
            if (leftValue === rightValue) {
                return right.databaseId() - left.databaseId();
            }

            if (leftValue === "") {
                return 1;
            }
            if (rightValue === "") {
                return -1;
            }

            const momentLeft = moment(leftValue, PARSE_FORMAT_DATETIME);
            const momentRight = moment(rightValue, PARSE_FORMAT_DATETIME);

            return (
                (momentLeft > momentRight)
                    ? -1
                    : 1
            );
        })();

        return sortResult * sortOrientation;
    };

    //////////////////////////////////////////////////////////////////// private functions
    self._viewModelFunction = function(params){
        let self = this;

        ////////////////////////////////////////////////////////////////////// public field/functions variables
        self.allSpools = params.allSpoolsKOArray;
        self.allSpools.subscribe(function(neValue){
            self._executeFilter()
        });
        self.allMaterials = params.allMaterialsKOArray;
        self.allVendors = params.allVendorsKOArray;
        self.allColors = params.allColorsKOArray;

        self.selectSpoolFunction = params.selectSpoolFunction;

        ////////////////////////////////////////////////////////////////////// internal field variables

        self.totalShown = ko.observable(1);
        // - sorting
        self.currentSortField = ko.observable();    // displayName, lastUse
        self.currentSortOder = ko.observable("ascending"); // or ascending

        // - filtering
        self.filterSelectionQuery = ko.observable();
        self.clearFilterSelectionQuery = function(){
            self.filterSelectionQuery("");
        }
        self.filterSelectionQuery.subscribe(function(filterQuery) {
            self._executeFilter();
        });
        self.hideEmptySpools = ko.observable(true);
        self.hideInActiveSpools = ko.observable(true);

        // - Filtering - Material
        self.showAllMaterialsForFilter = ko.observable(true);
        self.selectedMaterialsForFilter = ko.observableArray();
        // - Filtering - Vendor
        self.showAllVendorsForFilter = ko.observable(true);
        self.selectedVendorsForFilter = ko.observableArray();
        // - Filtering - Color
        self.showAllColorsForFilter = ko.observable(true);
        self.selectedColorsForFilter = ko.observableArray();


        //////////////////////////////////////////////////////////////////// browser storage
        // var storageKeyPrefix = "spoolmanager.filtersorter." + filterSorterId + ".";
        // All SpoolSelectionTableComponents use the same storage
        var storageKeyPrefix = "spoolmanager.filtersorter.";

        self._loadFilterSelectionsFromBrowserStorage = function(){
            if (!Modernizr.localstorage) {
                // damn, no browser storage!!!
                return false;
            }

            if (localStorage[storageKeyPrefix + "hideEmptySpools"] != null){
                self.hideEmptySpools(   localStorage[storageKeyPrefix + "hideEmptySpools"] == 'false' ? false : true);
            }
            if (localStorage[storageKeyPrefix + "hideInActiveSpools"] != null){
                self.hideInActiveSpools(localStorage[storageKeyPrefix + "hideInActiveSpools"] == 'false' ? false : true);
            }
            // maybe if someone request for it
            // if (localStorage[storageKeyPrefix + "showAllMaterialsForFilter"] != null){
            //     self.showAllMaterialsForFilter(localStorage[storageKeyPrefix + "showAllMaterialsForFilter"] == 'false' ? false : true);
            // }
            // if (localStorage[storageKeyPrefix + "showAllVendorsForFilter"] != null){
            //     self.showAllVendorsForFilter(localStorage[storageKeyPrefix + "showAllVendorsForFilter"] == 'false' ? false : true);
            // }
            // if (localStorage[storageKeyPrefix + "showAllColorsForFilter"] != null){
            //     self.showAllColorsForFilter(localStorage[storageKeyPrefix + "showAllColorsForFilter"] == 'false' ? false : true);
            // }
            //
            // if (localStorage[storageKeyPrefix + "selectedMaterialsForFilter"] != null){
            //   self.selectedMaterialsForFilter(self._stringToArray(localStorage[storageKeyPrefix + "selectedMaterialsForFilter"]));
            // }
            // if (localStorage[storageKeyPrefix + "selectedVendorsForFilter"] != null){
            //   self.selectedVendorsForFilter(self._stringToArray(localStorage[storageKeyPrefix + "selectedVendorsForFilter"]));
            // }
            // if (localStorage[storageKeyPrefix + "selectedColorsForFilter"] != null){
            //   self.selectedColorsForFilter(self._stringToArray(localStorage[storageKeyPrefix + "selectedColorsForFilter"]));
            // }
        }

        self._storeFilterSelectionsToBrowserStorage = function(){
            if (!Modernizr.localstorage) {
                // damn, no browser storage!!!
                return false;
            }
            if (self.hideEmptySpools() != null){
                localStorage[storageKeyPrefix + "hideEmptySpools"] = self.hideEmptySpools();
            }
            if (self.hideInActiveSpools() != null){
                localStorage[storageKeyPrefix + "hideInActiveSpools"] = self.hideInActiveSpools();
            }
            // maybe if someone request for it
            // if (self.showAllMaterialsForFilter() != null){
            //     localStorage[storageKeyPrefix + "showAllMaterialsForFilter"] = self.showAllMaterialsForFilter();
            // }
            // if (self.showAllVendorsForFilter() != null){
            //     localStorage[storageKeyPrefix + "showAllVendorsForFilter"] = self.showAllVendorsForFilter();
            // }
            // if (self.showAllColorsForFilter() != null){
            //     localStorage[storageKeyPrefix + "showAllColorsForFilter"] = self.showAllColorsForFilter();
            // }
            //
            // localStorage[storageKeyPrefix + "selectedMaterialsForFilter"] = self._arrayToString(self.selectedMaterialsForFilter());
            // localStorage[storageKeyPrefix + "selectedVendorsForFilter"] = self._arrayToString(self.selectedVendorsForFilter());
            // localStorage[storageKeyPrefix + "selectedColorsForFilter"] = self._arrayToString(self.selectedColorsForFilter());
        }

        self._stringToArray = function(stringValues){
            var result = stringValues.split("^");
            return result;
        }

        self._arrayToString = function(arrayValues){
            var result = "";
            arrayValues.forEach(function(value) {
                result += value + "^";
            });
            return result;
        }

        // initial loading from browser storage
        self._loadFilterSelectionsFromBrowserStorage();


        ///////////////////////////////////////////////////////////////////// subscribe listeners
        self.hideEmptySpools.subscribe(function(newValues) {
            self._executeFilter();
            self._storeFilterSelectionsToBrowserStorage();
        });
        self.hideInActiveSpools.subscribe(function(newValues) {
            self._executeFilter();
            self._storeFilterSelectionsToBrowserStorage();
        });
        self.selectedMaterialsForFilter.subscribe(function(newValues) {
            if (self.selectedMaterialsForFilter().length > 0){
                self.showAllMaterialsForFilter(true);
            } else{
                self.showAllMaterialsForFilter(false);
            }
            self._executeFilter();
            self._storeFilterSelectionsToBrowserStorage();
        });
        self.selectedVendorsForFilter.subscribe(function(newValues) {
            if (self.selectedVendorsForFilter().length > 0){
                self.showAllVendorsForFilter(true);
            } else{
                self.showAllVendorsForFilter(false);
            }
            self._executeFilter();
            self._storeFilterSelectionsToBrowserStorage();
        });
        self.selectedColorsForFilter.subscribe(function(newValues) {
            if (self.selectedColorsForFilter().length > 0){
                self.showAllColorsForFilter(true);
            } else{
                self.showAllColorsForFilter(false);
            }
            self._executeFilter();
            self._storeFilterSelectionsToBrowserStorage();
        });

        //  - do sorting
        self.sortSpoolArray = function(sortField, requestedSortOrder) {
            var sorted = self.allSpools();

            if (requestedSortOrder){
                self.currentSortOder(requestedSortOrder == "descending" ? "ascending" : "descending");
            }

            var sortOrientation = 1;
            if (self.currentSortOder() == "descending"){
                self.currentSortOder("ascending");
                sortOrientation = -1;
            } else {
                self.currentSortOder("descending");
            }

            if (sortField === "displayName") {
                sorted.sort(function (a, b) {
                    var sortResult = b.displayName().toLowerCase().localeCompare(a.displayName().toLowerCase()) * sortOrientation;
                    return sortResult;
                });
            } else if (sortField === 'material') {
                sorted.sort(function sortDesc(a, b) {
                    var valueA = a.material() != null ? a.material().toLowerCase() : "";
                    var valueB = b.material() != null ? b.material().toLowerCase() : "";
                    var sortResult = valueB.localeCompare(valueA) * sortOrientation;

                    return sortResult;
                });
            } else if (sortField === 'lastUse') {
                const dateExtractor = (element) => {
                    return element.lastUse();
                };

                sorted.sort(dateSortCallback(dateExtractor, sortOrientation));
            } else if (sortField === 'firstUse') {
                const dateExtractor = (element) => {
                    return element.firstUse();
                };

                sorted.sort(dateSortCallback(dateExtractor, sortOrientation));
            } else if (sortField === 'remaining') {
                sorted.sort(function sortDesc(a, b) {
                    var valueA = a.remainingWeight() != null ? a.remainingWeight() : 0;
                    var valueB = b.remainingWeight() != null ? b.remainingWeight() : 0;
                    var sortResult = valueB - valueA;

                    sortResult = sortResult * sortOrientation;
                    return sortResult;
                });
            }
            self.allSpools(sorted);
            self.currentSortField(sortField);
        }

        self.buildFilterLabel = function(filterLabelName) {
            /**
             * Check if all existing colors in the catalog are in the selected list.
             * This way we prevent positives eg. when selected list contains something that no longer exist,
             * but the length of both lists are still the same (eg. because of a new color).
             */
            if ("color" == filterLabelName) {
                return buildFilterSelectionsCounter(
                    self.allColors().map((existingColor) => existingColor.colorId),
                    self.selectedColorsForFilter(),
                );
            }
            if ("material" == filterLabelName) {
                return buildFilterSelectionsCounter(
                    self.allMaterials(),
                    self.selectedMaterialsForFilter(),
                );
            }
            if ("vendor" == filterLabelName) {
                return buildFilterSelectionsCounter(
                    self.allVendors(),
                    self.selectedVendorsForFilter(),
                );
            }

            return "unknown:" + filterLabelName;
        }

        self.doFilterSelectAll = function(data, catalogName){
            let checked;
            switch (catalogName) {
                case "material":
                    checked = self.showAllMaterialsForFilter();
                    if (checked == true) {
                        self.selectedMaterialsForFilter().length = 0;
                        ko.utils.arrayPushAll(self.selectedMaterialsForFilter, self.allMaterials());
                    } else {
                        self.selectedMaterialsForFilter.removeAll();
                    }
                    break;
                case "vendor":
                    checked = self.showAllVendorsForFilter();
                    if (checked == true) {
                        self.selectedVendorsForFilter().length = 0;
                        ko.utils.arrayPushAll(self.selectedVendorsForFilter, self.allVendors());
                    } else {
                        self.selectedVendorsForFilter.removeAll();
                    }
                    break;
                case "color":
                    checked = self.showAllColorsForFilter();
                    if (checked == true) {
                        self.selectedColorsForFilter().length = 0;
                        // we are using an colorId as a checked attribute, we can just move the color-objects to the selectedArrary
                        // ko.utils.arrayPushAll(self.spoolItemTableHelper.selectedColorsForFilter, self.spoolItemTableHelper.allColors());
                        for (let i = 0; i < self.allColors().length; i++) {
                            let colorObject = self.allColors()[i];
                            self.selectedColorsForFilter().push(colorObject.colorId);
                        }
                        self.selectedColorsForFilter.valueHasMutated();
                    } else {
                        self.selectedColorsForFilter.removeAll();
                    }
                    break;
            }
        }

        // execute the filter
        self._executeFilter = function() {
            let totalShownCount = 0;
            const filterQuery = (self.filterSelectionQuery?.() || "").toLowerCase();

            for (spool of self.allSpools()) {
                const spoolProperties = [
                    spool.material(),
                    spool.vendor(),
                    spool.displayName(),
                    spool.colorName(),
                ].join(" ");

                const isMatchingFilters = (() => {
                    if (!spoolProperties.toLowerCase().includes(filterQuery)) {
                        return false;
                    }

                    if (self.hideEmptySpools() == true) {
                        const isSpoolEmpty = (
                            spool.remainingWeight == null ||
                            spool.remainingWeight() <= 0
                        );

                        if (isSpoolEmpty) {
                            return false;
                        }
                    }

                    if (
                        self.hideInActiveSpools() == true &&
                        spool.isActive() == false
                    ) {
                        return false;
                    }

                    if (self.allMaterials().length !== self.selectedMaterialsForFilter().length) {
                        const spoolMaterial = (
                            spool.material != null &&
                            spool.material() != null
                        )
                            ? spool.material()
                            : "";

                        if (!self.selectedMaterialsForFilter().includes(spoolMaterial)) {
                            return false;
                        }
                    }

                    if (self.allVendors().length !== self.selectedVendorsForFilter().length) {
                        const spoolVendor = (
                            spool.vendor != null &&
                            spool.vendor() != null
                        )
                            ? spool.vendor()
                            : "";

                        if (!self.selectedVendorsForFilter().includes(spoolVendor)) {
                            return false;
                        }
                    }

                    if (self.allColors().length !== self.selectedColorsForFilter().length) {
                        const spoolColorCode = (
                            spool.color != null &&
                            spool.color() != null
                        )
                            ? spool.color()
                            : "";
                        const spoolColorName = (
                            spool.colorName != null &&
                            spool.colorName() != null
                        )
                            ? spool.colorName()
                            : "";
                        const colorId = `${spoolColorCode};${spoolColorName}`;
                        if (!self.selectedColorsForFilter().includes(colorId)) {
                            return false;
                        }
                    }

                    return true;
                })();

                spool.isFilteredForSelection(!isMatchingFilters);

                if (!spool.isFilteredForSelection()) {
                    totalShownCount += 1;
                }
            }

            self.totalShown(totalShownCount);
        }
    }
}
