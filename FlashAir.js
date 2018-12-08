"use strict";
const fs = require('fs');
const Observable = require("rxjs/Rx").Observable;
const Subject = require("rxjs/Rx").Subject;
const request = require('request');

const Config = require('./Config.js');
const FLASH_AIR_HOST = Config.FlashAirHost;
const DEFAULT_IMAGE_FOLDER = Config.DefaultImageFolder;
const pingLength = 4000;

console.log(Config);
var rxRequest = {
    get: function (uri, settings) {
        settings.uri = FLASH_AIR_HOST + uri;
        settings.method = 'GET';
        return Observable.create(obs => request(settings, (err, res, data) => {
            obs.next({
                err: err,
                res: res,
                data: data
            });
        }));
    }
}


var FlashAir = function () {
    var _input$ = new Subject();
    this.input$ = _input$;
  
    function getThumb(path) {
        var arr = [FLASH_AIR_HOST, 'thumbnail.cgi?', path];
        var commandText = arr.join('');
        return rxRequest.get(commandText, { encoding: null }).map(x => x.data);
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
        var image$ = rxRequest.get([FLASH_AIR_HOST, this.path].join(''), { encoding: null }).map(obj => {
            _this.image = obj.data;
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

    var dirCommandText = ['command.cgi?op=100&DIR=', DEFAULT_IMAGE_FOLDER].join('');

    function getDir() {
        return rxRequest.get(dirCommandText, { json: false }).map(x => x.err ? null : x.data).map(convertCSV);
    }

    function mapPing(x) {
        if (x.err === null) {
            if (x.res.statusCode === 200) {
                return parseInt(x.data);
            }
        }
        return -1;
    }

    function ping() {
        return rxRequest.get('command.cgi?op=102', { json: false, timeout:pingLength-100 }).map(mapPing);
    }

    //command({ op: 100, DIR: DEFAULT_IMAGE_FOLDER })
    this.status$ = Observable.interval(pingLength).flatMap(ping).share();//.filter(x => x === 1);
    //status$.subscribe((status) => { console.log('status', status, new Date().getTime()); });

    var currentList = [];

    var firstRun = true;
    var command$ = this.status$.filter(x => x === 1 || (firstRun === true && x > -1)).flatMap(getDir)

    command$.subscribe(function (data) {
        console.log(data);
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
            console.log('get', item);
            item.loadImages().subscribe(function () {
                console.log(item);
                _input$.next(item);
            });
        });
    });
}


module.exports = FlashAir;