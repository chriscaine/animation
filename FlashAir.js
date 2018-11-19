"use strict";
const fs = require('fs');
const Observable = require("rxjs/Rx").Observable;
const Subject = require("rxjs/Rx").Subject;
const request = require('request');

var rxRequest = {
    get: function (uri, settings) {
        settings.uri = uri;
        settings.method = 'GET';
        return Observable.create(obs => request(settings, (err, res, data) => obs.next(data)));
    }
}

const Config = require('./Config.js');

var FlashAir = function () {
    var _input$ = new Subject();
    this.input$ = _input$;

    const FLASH_AIR_HOST = Config.FlashAirHost;
    const DEFAULT_IMAGE_FOLDER = Config.DefaultImageFolder;

    function getThumb(path) {
        var arr = [FLASH_AIR_HOST, 'thumbnail.cgi?', path];
        var commandText = arr.join('');
        return rxRequest.get(commandText, { encoding: null });
    }

    var ImageFile = function (arr) {
        this.isImage = arr[1].match(/IMG_[0-9]{0,5}\.jpg/i) !== null;
        this.fileName = arr[1];
        this.path = arr.splice(0, 2).join('/');
        this.thumbnail = null;
        var _this = this;
        this.image = null;
        return this;
    }
    ImageFile.prototype.loadImages = function () {
        var _this = this;
        var thumb$ = getThumb(this.path).map((data) => {
                // need to convert data;
                _this.thumbnail = data;
                return _this;
        });
        var image$ = rxRequest.get([FLASH_AIR_HOST, this.path].join(''), { encoding: null }).map(data => {
            _this.image = data;
            return _this;
        });
        return Observable.zip(image$, thumb$).mapTo(_this);
    }


    function convertCSV(csv) {
        if (csv === undefined) return null;
        var lines = csv.split('\r\n');
        lines.splice(0, 1);
        return lines.filter(x => x).map(x => new ImageFile(x.split(','))).filter(x => x.isImage === true);
    }

    function command(obj) {
        var arr = [FLASH_AIR_HOST, 'command.cgi?'];
        arr.push(Object.keys(obj).map(x => x + '=' + obj[x]).join('&'));
        var commandText = arr.join('');
        return rxRequest.get(commandText, { json: false }).map(convertCSV);

    }
    var command$ = Observable.interval(1000).flatMap(() => command({ op: 100, DIR: DEFAULT_IMAGE_FOLDER }));
    var currentList = [];

    var firstRun = true;
    command$.subscribe(function (data) {
        if (data === null) return;
        console.log('check: ', data.length);
        var newItems = [];
        if (!firstRun) {
            data.forEach(function (item) {
                if (currentList.indexOf(item.fileName) === -1) newItems.push(item);
            });
        }

        currentList = data.map(f => f.fileName);

        firstRun = false;
        
        newItems.forEach(function (item) {
            item.loadImages().subscribe(function () {
                _input$.next(item);
            });
        });
    });
}


module.exports = FlashAir;