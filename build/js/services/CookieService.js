angular.module('core').factory('CookieService', function (user) {
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