angular.module('app', ['rx']);



angular.module('app').config(function () { });

angular.module('app').run(function () {
    
});
﻿angular.module('app').filter('async', function () {
    const values = {};
    const subscriptions = {};

    function async(input, scope) {
        // Make sure we have an Observable or a Promise
        if (!input || !(input.subscribe || input.then)) {
            return input;
        }

        const inputId = objectId(input);
        if (!(inputId in subscriptions)) {
            const subscriptionStrategy = input.subscribe && input.subscribe.bind(input)
                || input.success && input.success.bind(input) // To make it work with HttpPromise
                || input.then.bind(input);

            subscriptions[inputId] = subscriptionStrategy(value => {
                values[inputId] = value;

                if (scope && scope.$applyAsync) {
                    scope.$applyAsync(); // Automatic safe apply, if scope provided
                }
            });

            if (scope && scope.$on) {
                // Clean up subscription and its last value when the scope is destroyed.
                scope.$on('$destroy', () => {
                    const sub = subscriptions[inputId];
                    if (sub) {
                        sub.unsubscribe && sub.unsubscribe();
                        sub.dispose && sub.dispose();
                    }
                    delete subscriptions[inputId];
                    delete values[inputId];
                });
            }
        }

        return values[inputId];
    };

    // Need a way to tell the input objects apart from each other (so we only subscribe to them once)
    let nextObjectID = 0;
    function objectId(obj) {
        if (!obj.hasOwnProperty('__asyncFilterObjectID__')) {
            obj.__asyncFilterObjectID__ = ++nextObjectID;
        }

        return obj.__asyncFilterObjectID__;
    }

    // So that Angular does not cache the return value
    async.$stateful = true;

    return async;
});
﻿angular.module('app').factory('CookieService', function (user) {
    // utilities to encode and decode the stored object as base64
    // stops objects being human readable.
    var Base64 = {
        // private property
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        // public method for encoding
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

            input = Base64._utf8_encode(input);

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

            }

            return output;
        },
        // public method for decoding
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = Base64._utf8_decode(output);

            return output;

        },
        // private method for UTF-8 encoding
        _utf8_encode: function (string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        },
        // private method for UTF-8 decoding
        _utf8_decode: function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;

            while (i < utftext.length) {

                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }

            }

            return string;
        }
    }
    
    // get the user Id
    var getId = function () {
        return user.Id;
    }
    // set storage object by userId
    var setObject = function (id, obj) {
        // json encode object
        var cvalue = angular.toJson(obj);
        // base 64 encode json and store
        localStorage.setItem(id, Base64.encode(cvalue));
        //sessionStorage.setItem(id, Base64.encode(cvalue));
    }
    // retrieve storage object by userId
    var getObject = function (id) {
        var obj = localStorage.getItem(id);
       // var obj = sessionStorage.getItem(id);
        if (obj) {
            // return decoded object
            return angular.fromJson(Base64.decode(obj));
        } else {
            // else return empty object
            return {};
        }
    }
    // retrieve object from storage add valid a save
    var set = function (key, val) {
        var obj = getObject(getId());
        obj[key] = val;
        setObject(getId(), obj);
    }
    // retrieve object from storage and return property
    var get = function (key) {
        var obj = getObject(getId());
        return obj[key];
    }

    var CookieSwitch = function (name, defaultState) {
        var _name = name;
        if (get(_name) === undefined) {
            
            set(_name, defaultState === true ? 1 : 0);            
        } 
        this.Active = parseInt(get(_name)) === 1 ;
        this.Save = function () {
            set(_name, this.Active === true ? 1 : 0);
        }
        return this;
    }
    

    return {
        // make Base64 utilities available 
        Base64: Base64,
        // store an object with a key
        Store: function (key, obj) {
            set(key, obj);
        },
        // retrieve obeject by key
        Retrieve: function (key) {
            return get(key);
        },
        // remove an object by key
        Remove: function (key) {
            set(key, null);
        },
        CookieSwitch: CookieSwitch
    }
});
﻿angular.module('app').factory('EventService', function (rx) {

    var Events = function () {
       
        return this;
    }

    return Events;
});

    var Helpers = {};
    Helpers.Format = function Format(input, replacements) {
        var regex = /\{(d{1,3})\}/g;
        if (Object.prototype.toString.call(replacements) !== '[object Array]') replacements = [replacements];
        return input.replace(/\{(\d{1,3})\}/g, function (item, value) { return replacements[parseInt(value)]; });
    }

    Helpers.Bind = function Bind(input, replacements) {
        var regex = /\{\{([A-Za-z]{1,30})\}\}/g;
        return input.replace(regex, function (item, value) { return replacements[value]; });
    }

    Helpers.IsNotNullEmptyOrWhiteSpace = function IsNullEmptyOrWhiteSpace(value) {
        return value !== null && value !== undefined && /\S/.test(value);
    }
    Helpers.IsNullEmptyOrWhiteSpace = function (value) {
        return !Helpers.IsNotNullEmptyOrWhiteSpace(value);
    }

    Helpers.Time = {
        GetSeconds : val => val * 1000,
        GetMinutes : val => val * 60 * 1000,
        GetHours : val => val * 60 * 60 * 1000,
    };

    Helpers.Guid = {
        NewGuid: function () {
            var val;
            val = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0;
                var v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            return val;
        },
        Parse: function (route) {
            var match = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.exec(route);
            return match !== null ? match[0] : null;
        },
        RegExp: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
        StripGuid: function (url) {
            return url.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/, '');
        }
    }

    Helpers.ParseIntIdFromRoute = function ParseIntIdFromRoute(str) {
        var match = /\/([0-9]{1,})$/.exec(str);
        return match !== null ? parseInt(match[1]) : null;
    }

    Helpers.ConvertIfDate = function ConvertIfDate(str) {
        if (str.toString().indexOf('-') > -1) {
            var dt = new Date(Date.parse(str));
            if (dt.toDateString() !== 'Invalid Date') {
                return dt;
            }
        }

        return str;//.split(',');
    }

    Helpers.QueryStringToObject = function QueryStringToObject(qs) {
        if (qs == undefined) return {};
        var arr = qs.replace(/^[?]{1}/, '').split('&');
        var obj = {};
        for (var i = 0; i < arr.length; i++) {
            var set = arr[i].split('=');
            if (Helpers.IsNullEmptyOrWhiteSpace(set[1])) {
                obj[set[0]] = null;
            } else {
                obj[set[0]] = isNaN(set[1]) ? decodeURI(set[1]) : parseInt(set[1]);
                obj[set[0]] = Helpers.ConvertIfDate(obj[set[0]]);
            }
        }
        return obj;
    }

    Helpers.MergeAndRedirect = function (queryObj, location, resetPaging) {
        var query = location.$$search;

        for (var key in queryObj) {
            query[key] = queryObj[key];
        }
        if (resetPaging) {
            query.Page = 1;
        }

        window.location.hash = Helpers.Format('{0}{1}', [location.$$path, Helpers.ToQueryString(query)]);
    }

    Helpers.ToTwoSigFig = function (val) {
        return val < 10 ? '0' + val : val;
    }

    Helpers.ToQueryString = function (obj) {
        var newObj = {};
        for (var key in obj) {
            newObj[key] = obj[key];
        }

        var result = '';
        var first = true;
        for (var key in newObj) {
            if (first) {
                result += '?';
                first = false;
            } else {
                result += '&';
            }
            // intercept dates to allow global formatting approach
            if (newObj[key] instanceof Date) {
                var dt = newObj[key];
                newObj[key] = dt.getFullYear() + '-' + Helpers.ToTwoSigFig(dt.getMonth() + 1) + '-' + Helpers.ToTwoSigFig(dt.getDate());
            } else if (Array.isArray(obj[key])) {
                newObj[key] = newObj[key].join(',');
            }
            result += key + '=' + newObj[key];
        }
        return result;
    }

    Helpers.Aspect = {
        Landscape: 'landscape',
        Portrait: 'portrait'
    }

    Helpers.MapSize = function (width, height) {
        var aspect = width > height ? Aspect.Landscape : Aspect.Portrait;
        var obj;
        if (aspect === Aspect.Portrait) {
            obj = {
                w: Math.round(width * .9),
                h: Math.round((width * .9) / (16 / 9))
            }
        } else {
            obj = {
                w: Math.round(height * .9) * (16 / 9),
                h: Math.round((height * .9))
            }
        }
        obj.left = (width - obj.w) / 2;
        obj.top = (height - obj.h) / 2;
        return obj;
    }

    Helpers.Validation = {
        required: function (x) {
            if (typeof x === 'object') {
                return Helpers.IsNotNullEmptyOrWhiteSpace(x.FileName);
            }
            return Helpers.IsNotNullEmptyOrWhiteSpace(x);
        },
        email: x => Helpers.IsNullEmptyOrWhiteSpace(x) || /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(x),
        regex: function (x, regex) {
            regex = new RegExp(regex);
            return regex.test(x);
        },
        extensions: function (val, exts) {
            var strRegex = exts.split(',').map(x => Helpers.Format('(\.{0})$', [x])).join('|');
            var regex = new RegExp(strRegex, 'i');
            return val != null ? regex.test(val.FileName) : true;
        }
    };

    Helpers.CreateFormItem = function (model, formType) {
        var html;
        model.Type = model.Type.toLowerCase();

        if (model.Method != undefined) {
            model.fn = Helpers.Format('{0}="{1}"', [(model.Directive != undefined ? model.Directive : 'ng-click'), model.Method]);
        } else if (model.Directive != undefined) {
            model.fn = model.Directive;
        }

        

        var formElements = {
            label: '<label for="{{Property}}">{{Label}}</label>',
            alert: '',
            help: Helpers.IsNullEmptyOrWhiteSpace(model.Help) ? '' : '<p class="help-block">{{Help}}</p>',
            view: model.CanEdit ? '<span ng-if="!model.edit()" ng-bind="model.{{Property}} | auto"></span>' : '<span ng-bind="model.{{Property}} | auto"></span>'
        };
        var strValidatorElements = model.Validators.map(function (validator) {
            return Helpers.Format('<span ng-if="!model.validate(\'{0}\', \'{1}\')" style="color:red">{2}</span>', [model.Property, validator.Name, validator.ErrorMessage]);
        });
        formElements.alert = Helpers.Format("<span>{0}</span>", [strValidatorElements.join('<br />')]);

        function formatValidator(validator) {
            return Helpers.Bind('ov-{{Name}}="{{Value}}"', validator);
        }

        model.ValidationAttribute = model.Validators.map(formatValidator).join(' '); // To include required


        switch (model.Type) {
            case 'textarea':
                formElements.input = '<textarea id="{{Property}}" name="{{Property}}" class="form-control" ng-model="model.{{Property}}" placeholder="{{Placeholder}}" row="4" ></textarea>';
                break;
            case 'select':
                formElements.input = '<select id="{{Property}}" name="{{Property}}" class="form-control" ng-model="model.{{Property}}" ov-select="{{DataSource}}" placeholder="{{Placeholder}}" {{ValidationAttribute}}></select>';
                formElements.view = '<span view-from-data-set datasource="{{DataSource}}" value="model.{{Property}}"></span>';
                break;
            /*  case 'checkbox':
                  formElements.input = 'CHECKBOX NOT IMPLEMENTED';
                  break;*/
            case 'radiolist':
                formElements.input = '<span ov-radio-list="{{DataSource}}" name="{{Property}}"></span>';
                formElements.label = '<legend>{{Label}}</legend>';
                break;
            case 'draglist':
                formElements.input = '<span ov-drag-list="{{DataSource}}" ng-model="model.{{Property}}"></span>';
                break;
            case 'switch':
                formElements.input = '<span ov-switch ng-model="model.{{Property}}"></span>';
                formElements.view = '<span ng-show="model.{{Property}}" class="glyphicon glyphicon-ok "></span><span ng-hide="model.{{Property}}" class="glyphicon glyphicon-remove"></span>';
                break;
            case 'file':
                formElements.input = '<span file-upload="{{DataSource}}" name="{{Property}}" for="{{Property}}" ng-model="model.{{Property}}" {{ValidationAttribute}}>Select File</span>';
                break;
            case 'email':
                formElements.input = '<input id="{{Property}}" name="{{Property}}" type="text" ng-model="model.{{Property}}"  placeholder="{{Placeholder}}" class="form-control" {{ValidationAttribute}} />';
                break;
            case 'image':
                formElements.input = '<div image-edit-wrapper ng-model="model.{{Property}}" {{ValidationAttribute}} ></div>';
                formElements.label += '<br /><code ng-bind="model.{{Property}}.FileName"></code><br /> <img ng-src="{{model.{{Property}}.Data}}" class="image-preview" style="" alt="" />';
                break;
            case 'htmleditor':
                formElements.input = '<span tag-list="{{DataSource}}" target="{{Property}}"></span><span ckeditor name="{{Property}}" ng-model="model.{{Property}}"></span>';
                break;
            case 'setbypage':
                formElements.input = '<input id="{{Property}}" name="{{Property}}" type="hidden" ng-model="model.{{Property}}"  ng-class="setByPage(\'{{Property}}\')" {{ValidationAttribute}} />';
                break;
            case 'readonly':
                formElements.input = '<input id="{{Property}}" name="{{Property}}" type="{{Type}}" ng-model="model.{{Property}}"  placeholder="{{Placeholder}}" class="form-control" {{ValidationAttribute}} disabled="disabled" />';
                break;
            case 'button':
                    formElements.view = '<button data-id="{{model.Id}}" class="btn btn-{{CssClass}}" {{fn}}>'
                    if (model.IconClass) {
                        formElements.view += '<i class="glyphicon glyphicon-{{IconClass}}"></i> ';
                    }
                    formElements.view += '{{Label}}</button>';
                break;
            case 'link':
                if (model.IconClass) {
                    formElements.view = '<a class="btn btn-{{CssClass}}" ov-href="{{Method}}"><i class="glyphicon glyphicon-{{IconClass}}"></i> {{Label}}</a>';
                } else {
                    formElements.view = '<a class="btn btn-{{CssClass}}" ov-href="{{Method}}">{{Label}}</a>';
                }
            default:
                formElements.input = '<span tag-list="{{DataSource}}" target="{{Property}}"></span><input id="{{Property}}" name="{{Property}}" type="{{Type}}" ng-model="model.{{Property}}"  placeholder="{{Placeholder}}" class="form-control" {{ValidationAttribute}} />';
        }

        var formTemplate;

        switch (formType) {
            case 'horizontal':
                if (model.CanEdit) {
                    formTemplate = '<div class="form-group"><div class="col-xs-3">{{label}}</div><div class="col-xs-6">{{input}}{{help}}</div><div class="col-xs-3">{{alert}}</div></div>';
                } else {
                    formTemplate = '{{view}}';
                }
                break;
            case 'table':
                if (model.CanEdit) {
                    formTemplate = '<span ng-if="model.edit()">{{input}}{{alert}}</span><span ng-if="!model.edit()">{{view}}</span>';
                } else {
                    formTemplate = '{{view}}'
                }                
                break;
            default:
                formTemplate = '<div class="form-group">{{label}}{{input}}{{alert}}{{help}}</div>';
        }


        if (model.Type === 'hidden' || model.Type === 'setbypage') {
            html = Helpers.Bind(formElements.input, model);
        } else {
            // create form
            html = Helpers.Bind(formTemplate, formElements);
            // add values to form
            html = Helpers.Bind(html, model);
        }
        return html;
    }

    Helpers.MapObjectToSelectItem = function (list) {
        return list.map(x => { return { value: x.value || x.Value || x.Id, text: x.text || x.Text || x.Name || x.Title } });
    }

    Helpers.Rx = {
        To: function to(attr) {
            var _attr = attr;
            return function (val) { var obj = {}; obj[_attr] = val; return obj; }
        },
        Merge: function merge(arr) {
            var obj = {};
            var copy = function (s, d) { for (var key in s) { d[key] = s[key]; } return d; }
            arr.forEach(x => copy(x, obj));
            return obj;
        }
    }

    var Queryable = function Queryable(arr) {
        this._data = [];
        Array.prototype.push.apply(this._data, arr);
        return this;
    }
    
    Queryable.prototype.distinct = function (prop) {
        var result;
        if (prop !== undefined) {
            var mapped = this._data.map(x => x[prop]);
            result = this._data.filter((v, i, a) => mapped.indexOf(v[prop]) === i);
        } else {
            result = this._data.filter((v, i, a) => a.indexOf(v) === i);
        }
        return new Queryable(result);
    };
    
    Queryable.prototype.sum = function (prop) {
        var val = 0;
        if (prop) { this._data.forEach(x => { if (!x[prop]) { throw new Error('Property \'' + prop + '\' does not exist on object') } }); }
        this._data.forEach(x => val = val + (prop !== undefined ? x[prop] : x));
        return val;
    };
    
    Queryable.prototype.mean = function (prop) {
        return this.sum(prop) / this._data.length;
    };
    Queryable.prototype.average = Queryable.prototype.mean;
    
    Queryable.prototype.median = function (prop) {
        var arr = this.orderBy(prop).toArray();
        if (arr.length % 2 === 0) {
            var midIndex = arr[arr.length / 2];
            return (arr[midIndex] + arr[midIndex - 1]) / 2;
        } else {
            return arr[Math.floor(arr.length / 2)];
        }
    }
    
    Queryable.prototype.range = function (prop, asObject) {
        if (typeof prop === 'boolean') {
            asObject = prop === true;
            prop = undefined;
        };
        if (this._this.length === 0) return null;
        var arr = this._data.orderBy(prop);
        var result = null;
        if (arr[0][prop]) {
            result = [arr[0][prop], arr[arr.length - 1][prop]];
        } else {
            result = [arr[0], arr[arr.length - 1]];
        };
        result.push(result[1] - result[0]);
        if (asObject) {
            return {
                Min: result[0],
                Max: result[1],
                Range: result[2]
            };
        }
        return result;
    }
    
    Queryable.prototype.max = function (prop) {
        return this.orderBy(prop).first();
    }
    
    Queryable.prototype.min = function (prop) {
        return this.orderBy(prop).reverse().first();
    }
    
    Queryable.prototype.reverse = function () { this._data.reverse(); return this; }
    
    Queryable.prototype.mode = function (prop) {
        var q = this;
        if (prop) {
            q = this.select(x => x[prop]);
        }
     
        var hashTable = new HashTable(q.select(x => { return { key:  x, count : 0 } }).toArray(), 'key');
        console.log(hashTable, prop);
        q._data.forEach(x => hashTable[x].count++);
        var htAsQueryable = hashTable.asQueryable();
        var highestCount = htAsQueryable.max('count').count;
        return this.in(htAsQueryable.where(x => x.count === highestCount).select(x => x.key).toArray(), prop).distinct(prop);
    }
    
    Queryable.prototype.in = function (arr, prop) {
        return this.where(x => prop === undefined ? arr.indexOf(x) > -1 : arr.indexOf(x[prop]) > -1);
    }
    
    Queryable.prototype.first = function (fn) {
        if (fn !== undefined) {
            return this._data.filter(fn)[0];
        } else {
            return this._data[0];
        }
    }
    
    Queryable.prototype.orderBy = function (prop, asc) {
        if (this._data.length === 0) return [];
        var fn = null;
        var test = this._data[0][prop] || this._data[0];
        if (typeof test === 'number') {
            if (this._data[0][prop]) {
                fn = (a, b) => a[prop] - b[prop];
            } else {
                fn = (a, b) => a - b;
            }
        } else if (test.constructor && test.constructor.name === 'Date') {
            if (this._data[0][prop]) {
                fn = (a, b) => a[prop].getTime() - b[prop].getTime();
            } else {
                fn = (a, b) => a.getTime() - b.getTime();
            }
        };
        if (asc === true || asc === undefined) {
            this._data.sort(fn);
        };
        this._data.sort(fn).reverse();
        return this;
    };
    
    Queryable.prototype.count = function (fn) {
        if (typeof fn === 'function') {
            return this.findBy(fn).count();
        }
        return this._data.length;
    };
    
    Queryable.prototype.findBy = function (fn) {
        return new Queryable(this._data.filter(fn));
    }
    Queryable.prototype.where = Queryable.prototype.findBy;
    Queryable.prototype.select = function (fn) {
        return new Queryable(this._data.map(fn));
    }
    Queryable.prototype.map = Queryable.prototype.select;
    Queryable.prototype.skip = function (skip) {
        return new Queryable(this._data.slice(skip));
    }
    Queryable.prototype.take = function (take) {
        return new Queryable(this._data.splice(0, take));
    }
    Queryable.IsQueryable = function (obj) {
        return obj instanceof Queryable;
    }
    
    Queryable.OrderBy = function (arr, prop, asc) {
        if (arr.length === 0) return [];
        var fn = null;
        var test = arr[0][prop] !== undefined ? arr[0][prop] : arr[0];
        if (typeof test === 'number') {
            if (arr[0][prop] !== undefined) {
                fn = (a, b) => a[prop] - b[prop];
            } else {
                fn = (a, b) => a - b;
            }
        } else if (test.constructor && test.constructor.name === 'Date') {
            if (arr[0][prop] !== undefined) {
                fn = (a, b) => a[prop].getTime() - b[prop].getTime();
            } else {
                fn = (a, b) => a.getTime() - b.getTime();
            }
        };
        if (asc === true || asc === undefined) {
            return arr.sort(fn);
        };
        return new Queryable(arr.sort(fn).reverse());
    };
    
    Queryable.prototype.join = function(separator) {
        return this._data.join(separator);
    }

    Queryable.prototype.toArray = function () { return this._data; }
    
    Helpers.Queryable = Queryable;

    var HashTable = function (obj, uniqueId) {
        if (obj) {
            if (obj.constructor.name === 'Array') {
                obj.forEach(x => this[x[uniqueId]] = x);
            } else {
                Object.keys(obj).map(key => this[key] = obj[key]);
            }
        }
        return this;
    };
    
    HashTable.prototype.asQueryable = function () {
        return new Queryable(Object.keys(this).map(key => this[key]));
    };
    
    HashTable.IsHashTable = function (obj) {
        return obj instanceof HashTable;
    }

    Helpers.HashTable = HashTable;
    console.info('Extend String: contains, startsWith, endsWith');
    String.prototype.contains = function (x, caseSensitive) {
        return (new RegExp(x, caseSensitive === true ? '' : 'i')).test(this.valueOf());
    }
    String.prototype.startsWith = function (x, caseSensitive) {
        return (new RegExp('^' + x, caseSensitive === true ? '' : 'i')).test(this.valueOf());
    };
    String.prototype.endsWith = function (x, caseSensitive) {
        return (new RegExp(x + '$', caseSensitive === true ? '' : 'i')).test(this.valueOf());
    };
try {
        angular.module('app').factory('Helpers', () => Helpers);
} catch (e) {

}
try {
    module.exports = Helpers;
} catch (e) {

}   

﻿
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

﻿angular.module('app').controller('AppController', function ($scope, $timeout, observeOnScope, rx, Socket, Render) {
    var socket = io.connect(location.origin);
    function log() {
        console.log(arguments[0]);
    }
    var Observable = rx.Observable;
    var Subject = rx.Subject;

    function listenSocketEvt(evtName) {
        return Observable.create(function (observe) {
            socket.on(evtName, e => observe.onNext(e));
        });
    }

    var add$ = $scope.$createObservableFunction('add').map(() => prompt('Enter name for animation')).filter(x => x !== null);
    var selectProject$ = $scope.$createObservableFunction('selectProject');
    var rewind$ = $scope.$createObservableFunction('rewind');
    var stop$ = $scope.$createObservableFunction('stop');
    var pause$ = $scope.$createObservableFunction('pause');
    var play$ = $scope.$createObservableFunction('play');
    var forward$ = $scope.$createObservableFunction('forward');
    var export$ = $scope.$createObservableFunction('export');

    var fps$ = observeOnScope($scope, 'fps').map(x => x.newValue).filter(x => x !== undefined);
    var range$ = observeOnScope($scope, 'range').map(x => x.newValue).filter(x => x !== undefined);

    add$.subscribe(function (name) {
        socket.emit(Socket.NewProject, { name: name });
    });
    selectProject$.subscribe(function (id) {
        socket.emit(Socket.ProjectSelect, { _id: id });
    });

    $scope.cameraStatus$ = listenSocketEvt(Socket.CameraStatus);

    var project$ = listenSocketEvt(Socket.LoadingProject);
    // listen for project coming back from server
    project$.subscribe(log);
    
    fps$.subscribe(log);
    range$.subscribe(log);

    $scope.range = 0;
    $scope.fps = 12;

    $scope.projects$ = listenSocketEvt(Socket.ProjectList).do(log);
    $scope.noOfFrames$ = Observable.just(24 - 1);// this will be 1000 / noOFFrames

    $timeout(function () {
        socket.emit(Socket.LoadProjects);
    }, 1000);
});

﻿angular.module('app').value('Render', {
    Start: 'start',
    Progress: 'progress',
    Error: 'error',
    CodecData: 'codec-data',
    End: 'end'
});
﻿angular.module('app').value('Socket', {
    ProjectList: 'project:list',
    ProjectSelect: 'project:selected',
    ImageList: 'image:list',
    MediaList: 'media:list',
    Render: 'render:start',
    NewImage: 'image:add',
    NewProject: 'project:add',
    LoadingProject: 'project:load',
    LoadProjects: 'project:load:list',
    CameraStatus: 'camera:status'
});