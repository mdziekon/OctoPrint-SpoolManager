const getDateFromAttribute = (data, attributeName) => {
    const dataAttrObservable = data[attributeName];
    if (
        dataAttrObservable == null ||
        dataAttrObservable() == null ||
        dataAttrObservable() != ""
    ) {
        return "";
    }

    const value = dataAttrObservable();

    return value.split(" ")[0];
};

/**
 * @param {Number} value
 * @param {Number} precision
 */
const roundWithPrecision = (value, precision) => {
    const increments = Math.pow(10, precision);

    return Math.round((value + Number.EPSILON) * increments) / increments;
}

const buildFilterSelectionsCounter = (options, selectedOptions) => {
    const areAllExistingSelected = options.every((element) => {
        return selectedOptions.includes(element);
    });

    return (
        areAllExistingSelected
            ? "all"
            : selectedOptions.length
    );
};

// Expose to jinja templates
window.getDateFromAttribute = getDateFromAttribute;
