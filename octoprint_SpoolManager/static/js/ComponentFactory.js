
function ComponentFactory(pluginId) {

    this.pluginId = pluginId
    this.COMPONENT_PREFIX = "component_";

    this.createDateTimePicker = ComponentFactory.createDateTimePicker;
    this.createLabels = ComponentFactory.createLabels;
    this.createSelectWithFilter = ComponentFactory.createSelectWithFilter;
    this.createColorPicker = ComponentFactory.createColorPicker;

    //////////////////////////////////////////////////////////////////////////////////////////////////////// NOTE EDITOR
    this.createNoteEditor = function(elementId){

        // Widget Model
//        var componentViewModel = {
//            noteText: ko.observable(),
//            noteDeltaFormat: ko.observable(),
//            noteHtml: ko.observable(),
//        }

        var elementSelector = "#" + elementId;
        var noteEditor = new Quill(elementSelector, {
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

        var NoteEditorController = function(providedNoteEditor){
            var noteEditor = providedNoteEditor;

            this.getText = function(){
                return noteEditor.getText();
            };

            this.getHtml = function(){
                return noteEditor.getHtml();
            };

            this.getDeltaFormat = function(){
                return noteEditor.getContents();
            };

            this.setDeltaFormat = function(newDeltaFormat){
                noteEditor.setContents(newDeltaFormat, 'api');
            };
        };
        return new NoteEditorController(noteEditor);

//        // write to editor
//        deltaFormat = JSON.parse(printJobItemForEdit.noteDeltaFormat());
//        self.noteEditor.setContents(deltaFormat, 'api');
//
//        // write to item
//        var noteText = self.noteEditor.getText();
//        var noteDeltaFormat = self.noteEditor.getContents();
//        var noteHtml = self.noteEditor.getHtml();
//        self.printJobItemForEdit.noteText(noteText);
//        self.printJobItemForEdit.noteDeltaFormat(noteDeltaFormat);
//        self.printJobItemForEdit.noteHtml(noteHtml);

//        // sync: jquery -> observable
//        noteEditor.on('text-change', function(delta, oldDelta, source) {
////            debugger
//            newDeltaAsString = JSON.stringify(delta);
//            currentDeltaAsString = JSON.stringify(componentViewModel.noteDeltaFormat());
//            if (newDeltaAsString != currentDeltaAsString){
//                componentViewModel.noteText(noteEditor.getText());
//                componentViewModel.noteDeltaFormat(delta);
//                componentViewModel.noteHtml(noteEditor.getHtml());
//            }
//        });
//
//        // sync: observable -> jquery SELCETED_OPTIONS
//        componentViewModel.noteDeltaFormat.subscribe(function(newDelta){
////            debugger
//            // check if new text already assigned
//            newDeltaAsString = JSON.stringify(newDelta);
//            currentDeltaAsString = JSON.stringify(noteEditor.getContents());
//            if (newDeltaAsString != currentDeltaAsString){
//                noteEditor.setContents(newDelta, 'api');
//            }
//        });
//
//
//        return componentViewModel;
    };

}

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

/*
<div class="input-append datetime">
    <input id="DueDate" type="text" value="13.11.2017 13:24" class="input-large; text-right"><span class="add-on" id="DueDate-Icon"><i class="icon-th"></i></span>
</div>
*/
ComponentFactory.createDateTimePicker = (elementId, showTimePicker) => {
    if (showTimePicker == null) {
        showTimePicker = true;
        dateTimeFormat = 'd.m.Y H:i';
    }
    if (showTimePicker == false) {
        dateTimeFormat = 'd.m.Y';
    }

    const componentViewModel = {
        currentDateTime: ko.observable(),
        isEnabled: ko.observable(true)
    }

    const elementSelector = `#${elementId}`;

    // Attach widget to DOM
    $(elementSelector).datetimepicker({
        format: dateTimeFormat,
        closeOnDateSelect: true,
        closeOnTimeSelect: false,
        timepicker: showTimePicker,
        weeks: true,
    });
    jQuery.datetimepicker.setLocale('en');

    const addonBtnElement = $(elementSelector).parent().find('span[class=add-on]')[0];

    $(addonBtnElement).on('click', function () {
        if (componentViewModel.isEnabled() == true) {
            $(elementSelector).datetimepicker('show');
        }
    });

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
