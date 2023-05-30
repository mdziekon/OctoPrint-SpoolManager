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

// Expose to jinja templates
window.getDateFromAttribute = getDateFromAttribute;
