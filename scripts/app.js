  "use strict";
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
            var img = new Image();
            img.onload = function () {
                ctx.drawImage(img, 0, 0, img.width, img.height);
            }
            img.src = URL.createObjectURL(frame.data);
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
        var frames$ = shutterClick$.flatMapLatest(function captchaFrame(e) {
            //canvas = null;
            var _video = document.getElementById('video');
            return Observable.fromPromise(new Promise(function (fulfill, reject) {
                var video = _video;
                var w = video.videoWidth;
                var h = video.videoHeight;
                var videoAspect = w / h;
                var canvas;
                canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                var cxt = canvas.getContext('2d');
                cxt.drawImage(video, 0, 0, w, h);
                canvas.toBlob(function (blob) {
                    fulfill(blob);
                }, 'image/jpeg', 0.7);
            }));
        }).merge(undoClick$.map(null)).scan(function (frames, blob) {
            if (blob === null) {
                // delete last frame
                frames.pop();
                // load new last frame into overlay image
                if (frames.length > 0) document.querySelector('#image').src = URL.createObjectURL(frames[frames.length - 1].data);
            } else {
                // load frame into last frame overlay image
                document.querySelector('#image').src = URL.createObjectURL(blob);
                if (blob) frames.push({ name: format('image_{0}.jpg', [leadingZero(frames.length)]), data: blob });
            }
            return frames;
        }, []).share(); // share() forces above to only happen once no matter haw many subscribers stream has

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
        var export$ = exportClick$.withLatestFrom(frames$, frameRate$).map(x => x[1].length / x[2]);
        var animationEnd$ = new Subject();
        /* SUBSCRIPTIONS */
        var recorder
        function exporting(duration) {
            recorder  = RecordRTC(canvas, {
                type: 'canvas'
            });
            currentFrame$.onNext(0);
            singlePlay$.onNext(true);

            recorder.startRecording();

            var stop = false;

            //setTimeout(() => recorder.stopRecording(function () {
            //    var blob = recorder.getBlob();
            //    document.getElementById('output').src = URL.createObjectURL(blob);
            //    document.getElementById('export-link').href = URL.createObjectURL(blob);
            //    singlePlay$.onNext(null);
            //}), duration * 1000);
        }

        animationEnd$.subscribe(function () {
            recorder.stopRecording(function () {
                var blob = recorder.getBlob();
                document.getElementById('output').src = URL.createObjectURL(blob);
                document.getElementById('export-link').href = URL.createObjectURL(blob);
                singlePlay$.onNext(null);
            });
        });

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

        export$.subscribe(exporting);