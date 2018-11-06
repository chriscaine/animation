"use strict";
var app = angular.module('app', []);

const Socket = {
    DirectoryList: 'directory:list',
    DirectorySelect: 'directory:select',
    ImageList: 'image:list',
    MediaList: 'media:list',
    Render: 'render:start'
}
var Render = {
    Start: 'start',
    Progress: 'progress',
    Error: 'error',
    CodecData: 'codec-data',
    End: 'end'
}
var socket = io.connect(location.origin);

// load webservice
var Observable = Rx.Observable;
var Subject = Rx.Subject;

function log(message) {
    var messages = document.getElementById('messages');
    var m = document.createElement('li');
    m.innerHTML = JSON.stringify(message.data);
    messages.appendChild(m);
}

function leadingZero(number) {
    //if (number < 10) return '0000' + number.toString();
    //if (number < 100) return '000' + number.toString();
    //if (number < 1000) return '00' + number.toString();
    //if (number < 10000) return '0' + number.toString();
    return number.toString();
}
function format(str, replacements) {
    return str.replace(/\{([0-9]{1,3})\}/g, function (a, b) { return replacements[b]; });
}

function getEl(selector) {
    return document.querySelector(selector);
}

function draw(frame, info) {
    // Display position in process
    getEl('#frame-count-display').innerText = format("{2} Frame {0} of {1} @ {3} fps duration {4}s", [info.index + 1, info.length, info.exporting, info.frameRate, Math.round(100 * (info.length / info.frameRate)) / 100]);
    // Create image from Blob and draw to canvas
    var img = frame.data;

    var ratio = img.width / img.height;
    var height = canvas.width / ratio;


    ctx.drawImage(img, 0, (canvas.height - height) / 2, canvas.width, height);
}

/*  Set up camera */
function useWebCamStream(stream) {
    var video = document.getElementById('video');
    let videoStream = stream;
    console.info('Connecting: ', stream.getVideoTracks()[0].label);
    if (video.mozSrcObject !== undefined) { //FF18a
        video.mozSrcObject = stream;
    } else {
        video.src = window.URL.createObjectURL(stream);
    }
    video.onloadedmetadata = function () {
    }
}
navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(useWebCamStream);

/* Get Elements */


var canvas = document.getElementById('previewCanvas');
var ctx = canvas.getContext('2d');
var previewImage = document.getElementById('previewImage');


/* REGISTER STREAMS */
/* - INPUTS */
var singlePlay$ = new Subject(); // set to fasle to pause on frame 1, set to true to play through once, set top null to loop
var currentFrame$ = new Subject(); // set to frame to display zero index in array
// handle clicks from the sutter
// To Do: use merge to set-up to work as Time lapse function
var shutterClick$ = Observable.fromEvent(getEl('#btn-shutter'), 'click');//.merge(Observable.timer(1500, 300)).take(130);
// handle export requests
var exportClick$ = Observable.fromEvent(getEl('#btn-export'), 'click');
// undo -> deletes last frame
var undoClick$ = Observable.fromEvent(getEl('#btn-undo'), 'click').filter(x => confirm('Are you sure you want to delete the last frame?'));
// handle frame rate change requests
var frameRate$ = Observable.fromEvent(getEl('#frame-rate'), 'change').map(x => parseInt(x.target.value)).startWith(6);
// grab image from camera, turn to blob, and concatenate array in scan function

var renderFeedback$ = Observable.create(function (observer) {
    socket.on('render', function (e) {
        console.log(e);
        observer.onNext(e);
    });
});

var framesListFromServer$ = Observable.create(function (observe) {
    socket.on(Socket.ImageList, function (list) {
        observe.onNext(list);
    });
}).debounce(100).share();


var fetchImage = function (items) {
    return Observable.create(function (observe) {
        items.forEach(function (file, i) {
            var img = new Image();
            img.onload = function () {
                observe.onNext({ name: file.Name, data: img });
            };
            img.src = Utilities.Bind('images/{{Parent}}/{{Name}}', file);
        });
    });
}

var framesFromServer$ = framesListFromServer$.flatMap(fetchImage);

//var new$ = Observable.merge(framesListFromServer$.map(true), framesFromServer$.map(false)).filter(x => true);

var frames$ = Observable.merge(framesListFromServer$.map(x => null), framesFromServer$).scan(function (arr, item) {
    if (item === null) { arr = []; }
    else { arr.push(item); }

    return arr;
}, []).share();



renderFeedback$.filter(x => x.type === Render.Progress)
    .map(x => x.data.frames)
    .withLatestFrom(frames$.map(x => x.length))
    .subscribe(x => {
        document.getElementById('progress-bar').style.opacity = 1;
        var perc = Math.round(100 * x[0] / x[1]);
        document.getElementById('progress').style.width = Utilities.Format('{0}%', [perc.toString()]);
        if (perc === 100) {
            setTimeout(function () {
                document.getElementById('progress-bar').style.opacity = 0;
            }, 3000);
        }
    });

/**
 * Get latest list
      iterate over existing list
        where new items in list add and insert image data
        { name : filename, data : blob }
 */


// collect all status streams for displaying animation
var refreshPreview$ = Observable.timer(100, 1000 / 24, 10)
    .withLatestFrom(frameRate$, frames$, singlePlay$.startWith(null), currentFrame$.startWith(0))
    // limit refreshes based on framerate
    // timer runs at 24 fps => gets  (24 / framerate) gets the number of frames to skip
    // where x[0] is the total number of intervals collected
    .filter(x => x[0] % (24 / x[1]) === 0)
    // map to readable object
    .map(x => { return { frameRate: x[1], frames: x[2], singlePlay: x[3], currentFrame: x[4] } });

// on export button clicks send frame stream - map to duration in seconds frames count  / framerate
var export$ = exportClick$.withLatestFrom(frameRate$).map(x => x[1]);//.map(x => x[1].length / x[2]);
var animationEnd$ = new Subject();

/* SUBSCRIPTIONS */
export$.subscribe(function (fps) {
    socket.emit('transport', { type: Socket.Render, data: { fps: fps } });
});
animationEnd$.subscribe(function () { });

// Select the frame to draw and send to draw function

function nextFrame(obj) {
    var _frameRate = obj.frameRate;
    var _frames = obj.frames;
    var _singlePlay = obj.singlePlay;
    var i = obj.currentFrame;
    // loop
    if (_singlePlay === null) {
        if (_frames[i]) draw(_frames[i], { index: i, length: _frames.length, exporting: '', frameRate: _frameRate });
        if (i > _frames.length) {
            currentFrame$.onNext(0);
        } else {
            currentFrame$.onNext(obj.currentFrame + 1);
        }
    } else { // single play
        if (_singlePlay === true) { // play once
            if (_frames[i]) {
                draw(_frames[i], { index: i, length: _frames.length, exporting: 'Exporting', frameRate: _frameRate });
                currentFrame$.onNext(obj.currentFrame + 1);
            } else {
                animationEnd$.onNext();
            }
        } else { // pause at start
            if (_frames[0]) draw(_frames[0], { index: 1, length: _frames.length, exporting: 'Exporting', frameRate: _frameRate });
        }
    }
}

refreshPreview$.subscribe(obj => { window.requestAnimationFrame(() => nextFrame(obj)) });



app.controller('AppController', function ($scope, $timeout) {
    $scope.list = [];
    $scope.mediaList = [];
    socket.on(Socket.DirectoryList, function (list) {
        console.log(list);
        $scope.folderList = list;
        $timeout(x => null);
    });

    $scope.selectedFolder = null;

    $scope.selectFolder = function (folder) {
        $scope.selectedFolder = folder;
        socket.emit('transport', { type: Socket.DirectoryList, data: folder.Name });
    }

    socket.on(Socket.MediaList, function (list) {
        $scope.mediaList = list;
        $timeout(x => null);
    });

    socket.on(Socket.ImageList, function (list) {
        $scope.imageList = list;
        $timeout(x => null);
    });

    $scope.cleanUrl = function (url) {
        return url.replace('public/', '');
    }

    $scope.playVideo = function (url) {
        $scope.src = url.replace('public/', '');
    }


});

