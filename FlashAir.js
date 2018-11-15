"use strict";
const fs = require('fs');
const Observable = require("rxjs/Rx").Observable;
const Subject = require("rxjs/Rx").Subject;
const request = require('request');
const Config = require('./Config.js');

var FlashAir = function() {
    const FLASH_AIR_HOST = Config.FlashAirHost;
    const DEFAULT_IMAGE_FOLDER = Config.DefaultImageFolder;

    function getThumb(path, callback) {
        var arr = [FLASH_AIR_HOST, 'thumbnail.cgi?', path];
        
        var commandText = arr.join('');
        console.log(commandText);
      
        request(commandText, { json: false }, function(err, res, body) {
            if (err) { return console.log('err', err); } else {
                callback(body);
            }
        });
    }

    var ImageFile = function(arr) {
        this.isImage = arr[1].match(/IMG_[0-9]{0,5}\.jpg/i) !== null;
        this.fileName = arr[1];
        this.path = arr.splice(0, 2).join('/');
        this.thumbnail = null;
        var _this = this;
        if (this.isImage) {
            getThumb(this.path, function(data) {
                _this.thumbnail = data;
            });
        }
        return this;
    }

    function convertCSV(csv) {
        var lines = csv.split('\r\n');
        lines.splice(0, 1);
        return lines.filter(x => x).map(x => new ImageFile(x.split(','))).filter(x => x.isImage === true);
    }

    function command(obj) {
        var arr = [FLASH_AIR_HOST, 'command.cgi?'];
        arr.push(Object.keys(obj).map(x => x + '=' + obj[x]).join('&'));
        var commandText = arr.join('');
        return Observable.create(function(observe) {
            request(commandText, { json: false }, function(err, res, body) {
                if (err) { return console.log('err', err); } else {
                    observe.next(convertCSV(body));
                }
            });
        });
    }
    var command$ = command({ op: 100, DIR: DEFAULT_IMAGE_FOLDER });

    command$.subscribe(function(data) {
        console.log(data);
    });


}


module.exports = FlashAir;