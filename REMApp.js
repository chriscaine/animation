"use strict";
const fs = require('fs');
//const fsSync = require('fs-sync');
const ffmpeg = require('fluent-ffmpeg');
const Observable = require("rxjs/Rx").Observable;
const Subject = require("rxjs/Rx").Subject;
const File = require("./File.js");
const Utilities = require('./Utilities.js');
const Config = require('./Config.js');

function GetFolder([folder, parent]) {
    return Observable.create(function (observe) {
        fs.readdir(parent + folder, function (err, items) {
            observe.next({
                items: File.InitBatch(items, parent + folder),
                isImageList: folder.length !== 0
            });
        });
    });
}


module.exports = function App(io, socket, watchFolder$, imageFolder$, watchMedia$) {
    const Socket = {
        DirectoryList: 'directory:list',
        DirectorySelect: 'directory:select',
        ImageList: 'image:list',
        MediaList : 'media:list',
        Render : 'render:start'
    }
    var Render = {
        Start: 'start',
        Progress: 'progress',
        Error: 'error',
        CodecData: 'codec-data',
        End: 'end'
    }

    const _io = io;
    const _socket = socket;
    const transportCtrl$ = Observable.fromEvent(socket, 'transport').startWith({ type: Socket.DirectoryList, data: '' }).share();
    const selectedImageFolder$ = transportCtrl$
        .filter(x => x.type === Socket.DirectoryList)
        .map(x => x.data)
        .startWith('')
        .withLatestFrom(imageFolder$);
    // .map(x => x[1] + x[0]);

    const _render = function (data) {
        var outputFile = Utilities.Format('{0}/{1}-{2}fps{3}.mp4', [Config.MediaFolder, data.Parent, data.Fps, data.ConvertToHD ? '-HD' : '']);
        console.log(data);

        var videoFilters = [];
        if (data.ConvertToHD) videoFilters.push('crop=3456:1944:0:180'); 

        ffmpeg(data.ImageFolder + data.FileFormat)
            .inputOptions(['-start_number ' + data.FirstFrame])
            .outputOptions(['-pix_fmt yuv420p', '-g 1', '-preset ultrafast', '-crf 0'])
            .videoFilters(videoFilters)
            .videoBitrate('16384k')
            .videoCodec('mpeg4')
            .size(data.ConvertToHD ? '1920x1080' : '3456x2304')
            .inputFPS(parseInt(data.Fps))
            .on('codecData', x => _io.emit('render', { type: Render.CodecData, data: x }))
            .on('error', x => _io.emit('render', { type: Render.Error, data: x }))
            .on('progress', x => _io.emit('render', { type: Render.Progress, data: x }))    
            .on('end', x => _io.emit('render', { type: Render.End, data: x }))
            .on('start', x => _io.emit('render', { type: Render.Start, data: x }))
            .output(outputFile)
            .run();
    }

    const renderStart$ = transportCtrl$
        .filter(x => x.type === Socket.Render)
        .withLatestFrom(selectedImageFolder$)
        .filter(x => x[1][0].length > 0)
        .map(x => { return { Fps: x[0].data.fps, ConvertToHD: x[0].data.convertToHD, Parent: x[1][0] } })
        .map(x => {
            return Observable.create(function (observe) {
                x.ImageFolder = Utilities.Format('{0}{1}\\', [Config.ImagesFolder, x.Parent]);
                fs.readdir(x.ImageFolder, function (err, files) {
                    x.FirstFrame = /([0-9]{1,5})\./.exec(files[0])[1];
                    x.FileFormat = files[0].replace(x.FirstFrame, '%04d');
                    observe.next(x);
                });
            });
        }).switch()
        .subscribe(_render);

    const _watchFolder$ = watchFolder$;

    const folderChanges$ = _watchFolder$.filter(x => !/\./.test(x.Name)).map(x => '');

    watchMedia$.map(x => [x, '']).flatMap(GetFolder).subscribe(function (e) {
        _io.emit(Socket.MediaList, e.items);
    });

    const _folderList$ = selectedImageFolder$.merge(_watchFolder$)
        .withLatestFrom(selectedImageFolder$)
        .map(x => x[1])
        .flatMap(GetFolder);


    _folderList$.subscribe(function (e) {
        if (e.isImageList) {
            _io.emit(Socket.ImageList, e.items);
        } else {
            _io.emit(Socket.DirectoryList, e.items);
        }
    }, x => null);


   };