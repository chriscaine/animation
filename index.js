"use strict";

const Watch = require("node-watch");

const App = require("./App.js");

const Observable = require("rxjs/Rx").Observable;
const Subject = require("rxjs/Rx").Subject;

const Express = require('express');
const express = Express();
const http = require('http').Server(express);
const io = require('socket.io')(http);
const serveStatic = require('serve-static');

const fs = require('fs');

var Config = require('./Config.js'); 

const IMAGE_FOLDER = Config.ImagesFolder;
const MEDIA_FOLDER = Config.MediaFolder;

const File = require("./file.js");

express.use(Express.static('public'));

express.use('/images', serveStatic(IMAGE_FOLDER));

http.listen(8080);


var folderChanges$ = Observable.create(function (observer) {
    Watch(IMAGE_FOLDER, { recursive: true }, function (evt, filename) {
        observer.next({ type: evt, file: new File(filename) });
    });
});

var mediaFolderChanges$ = Observable.create(function (observer) {
    Watch(MEDIA_FOLDER, { recursive: true }, function (evt, filename) {
        observer.next(MEDIA_FOLDER);
    });
}).startWith(MEDIA_FOLDER);

io.on('connection', function (socket) {
    new App(io, socket, folderChanges$, Observable.from([IMAGE_FOLDER]), mediaFolderChanges$);
});



/*
    On connection
        send list of available folders

    On new folder
        send new folder list

    On folder selection send array of files

    Register watcher on the folder
        on change send array of files

    In browser keep array of files and load only when new file is received

    Set up static hostiong on image folder

    Set up socket

        Listeners for:
            1) Folder selection
            2) Video render requests
        Send
            1) Folder lists
            2) Image changes
            3) Video status
                et cetera.....

*/
