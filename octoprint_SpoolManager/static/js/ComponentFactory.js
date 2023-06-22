
function ComponentFactory(pluginId) {
    this.pluginId = pluginId
    this.COMPONENT_PREFIX = "component_";

    this.createDateTimePicker = ComponentFactory.createDateTimePicker;
    this.createLabels = ComponentFactory.createLabels;
    this.createSelectWithFilter = ComponentFactory.createSelectWithFilter;
    this.createColorPicker = ComponentFactory.createColorPicker;
    this.createNoteEditor = ComponentFactory.createNoteEditor;
};

ComponentFactory.createSelectWithFilter = (elementId, dropDownParent) => {
    const $select2 = $(`#${elementId}`).select2({
        dropdownParent: dropDownParent,
        placeholder: "Choose...",
        allowClear: true,
        tags: true
    });

    const componentViewModel = {
        allOptions: ko.observableArray(),
        selectedOption: ko.observable(),
        select2Element: $select2
    }

    // sync: observable -> jquery
    componentViewModel.selectedOption.subscribe(function(newSelection) {
        $select2.val(newSelection);
        $select2.trigger('change');
    });

    return componentViewModel;
};

ComponentFactory.createColorPicker = (elementId) => {
    const componentViewModel = {
        selectedColor: ko.observable(),
    };

    const $pickColor = $(`#${elementId}`).pickAColor({
        showSpectrum          : false,
        showSavedColors       : false,
        saveColorsPerElement  : false,
        fadeMenuToggle        : true,
        showAdvanced          : true,
        showBasicColors       : true,
        showHexInput          : true,
        allowBlank            : false,
        basicColors           : {
            white     : 'ffffff',
            black     : '000000',
            red       : 'ff0000',
            green     : '008000',
            blue      : '0000ff',
            yellow    : 'ffff00',
            orange    : 'ffa500',
            purple    : '800080',
            gray      : '808080',
            darkgray  : 'A9A9A9',
            lightgray : 'D3D3D3',
            violet    : 'EE82EE',
            pink      : 'FFC0CB',
            brown     : 'A52A2A',
            burlyWood : 'DEB887'
        },
    });

    // sync: jquery -> observable
    $pickColor.on("change", function () {
        let newColor = String($(this).val());

        if (newColor.startsWith("#") == false) {
            newColor = `#${newColor}`;
        }

        componentViewModel.selectedColor(newColor);
    });

    // sync: observable -> jquery SELCETED_OPTIONS
    componentViewModel.selectedColor.subscribe(function(newColor) {
        const currentColor = "#" + $pickColor.val();

        if (currentColor == newColor) {
            return;
        }

        newColorCode = newColor.substr(1);
        $pickColor.setColor(newColorCode);
    });

    return componentViewModel;
};

ComponentFactory.createDateTimePicker = () => {
    const componentViewModel = {
        currentDateTime: ko.observable(),
        isEnabled: ko.observable(true)
    };

    return componentViewModel;
};

ComponentFactory.createLabels = (elementId, dropDownParent) => {
    const $labels = $(`#${elementId}`).select2({
        dropdownParent: dropDownParent,
        multiple: true,
        placeholder: "Add a Label...",
        width: '400px',
        tags: true,
        dropdownAutoWidth: true
    });

    const componentViewModel = {
        allOptions: ko.observableArray(),
        selectedOptions: ko.observableArray(),
    }

    // sync: observable -> jquery
    const fired = [false];

    componentViewModel.selectedOptions.subscribe(function(newSelections) {
        if (fired[0] != false) {
            fired[0] = false;

            return;
        }

        fired[0] = true;
        $labels.val(newSelections);
        $labels.trigger('change');
    });

    return componentViewModel;
};

ComponentFactory.createNoteEditor = (elementId) => {
    const $noteEditor = new Quill(`#${elementId}`, {
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

    return $noteEditor;
};
