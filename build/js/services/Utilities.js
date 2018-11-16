
var Utilities = {
    ByTag: function ByTag(tag) {
        var _tag = tag;
        return function (e) {
            return e.target.tagName === tag.toUpperCase();
        }
    },
    ByDataType: function byDataType(type, not) {
        var _type = type;
        var invert = not === true;
        return function (data) {
            if (invert) {
                return !data.type === _type;
            } else {
                return data.type === _type;
            }
        }
    },
    IsTransportCtrl: function (data) {
        return data.type != undefined && data.type != 'REMOVE';
    },
    Format: function (input, replacements) {
        var regex = /\{(d{1,3})\}/g;
        if (Object.prototype.toString.call(replacements) !== '[object Array]') replacements = [replacements];
        return input.replace(/\{(\d{1,3})\}/g, function (item, value) { return replacements[parseInt(value)]; });
    },

    Bind: function (input, replacements) {
        var regex = /\{\{([A-Za-z]{1,10})\}\}/g;
        return input.replace(regex, function (item, value) { return replacements[value]; });
    }
}
