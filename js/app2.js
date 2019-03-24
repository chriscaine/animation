const Observable = Rx.Observable;
const Subject = Rx.Subject;
const BSubject = Rx.BehaviorSubject;

function captureFrame(video) {
    return Observable.create(obs => {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = video.width;
        canvas.height = video.height;
        //(canvas.height - height) / 2
        ctx.drawImage(video.element, 0, 0, canvas.width, canvas.height);
        video.lastFrame = canvas.toDataURL('image/webp', 70);
        obs.onNext(video);
        //canvas.toBlob((blob) => {
        //    video.lastFrameData = blob;
        //    obs.onNext(video);
        //}, 'image/png', 0.9);//.toDataURL();
        // return video;
    });
}

function downloadVideo(url) {
    return Observable.create(function (obs) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
        xhr.onload = function (e) {
            obs.onNext(e.target);
        };
    });
}

function convertToFourDigits(val) {
    if (val < 10) return '000' + val;
    if (val < 100) return '00' + val;
    if (val < 1000) return '0' + val;
    return val.toString();
}

function drawFrame(canvas, url) {

    var ctx = canvas.getContext('2d');
    //(canvas.height - height) / 2
    var img = new Image();

    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    };
    img.src = url;// URL.createObjectURL(blob);

}

function blobToArrayBuffer(blob) {
    return Observable.create(function (obs) {
        var reader = new FileReader();
        reader.onload = function (evt) {
            obs.onNext(new Uint8Array(evt.target.result));
        }
        reader.readAsArrayBuffer(blob);

    });
}

function base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function parseArguments(text) {
    text = text.replace(/\s+/g, ' ');
    var args = [];
    // Allow double quotes to not split args.
    text.split('"').forEach(function (t, i) {
        t = t.trim();
        if ((i % 2) === 1) {
            args.push(t);
        } else {
            args = args.concat(t.split(" "));
        }
    });
    return args;
}

var AnimationApp = function () {

    var worker = null;
    const workerReady$ = new Subject();
    const outputFile$ = new Subject();
    const log$ = new Subject();
    const consoleEl$ = Observable.just(document.getElementById('console'));
    const frameCountEl$ = Observable.just(document.getElementById('frame-count'));
    var ffmpegResult$ = new Subject();

    log$.withLatestFrom(consoleEl$).subscribe(arr => {
        var el = arr[1];
        var message = arr[0];
        el.innerText = el.innerText + '\n\n' + message;
        el.scrollTo(0, 65000000);
    });

    function initWorker() {
        worker = new Worker("/js/webworker.js?seed=5");
        worker.onmessage = function (event) {
            var message = event.data;
            if (message.type === "ready") {
                isWorkerLoaded = true;
                workerReady$.onNext(true);
                //worker.postMessage({
                //    type: "command",
                //    arguments: ["-help"]
                //});
            } else if (message.type === "stdout") {
                log$.onNext(message.data);
            } else if (message.type === "start") {
                log$.onNext('Worker has received command');
            } else if (message.type === "done") {
                //  stopRunning();
                var buffers = message.data;
                if (buffers.length) {
                    log$.onNext('closed');
                }
                buffers.forEach(function (file) {
                    ffmpegResult$.onNext(file);
                    //outputFile$.onNext(getDownloadLink(file.data, file.name));
                });
            }
        };
    }
    initWorker();

    var _this = this;
    const videoEl$ = Observable.just(document.getElementById('source-monitor'));
    const deviceListEl$ = Observable.just(document.getElementById('device-list'));

    const imgOverlay$ = Observable.just(document.getElementById('last-frame'));
    const playbackEl$ = Observable.just(document.getElementById('playback-monitor'));
    const devices$ = Observable.fromPromise(navigator.mediaDevices.enumerateDevices())
        .map(x => x.filter(x => x.constructor.name === 'InputDeviceInfo').filter(x => x.kind === 'videoinput'));
    const selectedDevice$ = Observable.fromEvent(document.getElementById('device-list'), 'change').map(el => el.target.value);

    const renderClick$ = Observable.fromEvent(document.getElementById('render'), 'click');

    devices$.withLatestFrom(deviceListEl$).subscribe(arr => {
        var el = arr[1];
        var devices = arr[0];
        el.innerHTML = '';
        devices.forEach(x => {
            var option = document.createElement('option');
            option.innerHTML = x.label;
            option.setAttribute('value', x.deviceId);
            el.append(option);
        });
    });


    const overlayChange$ = Observable.fromEvent(document.getElementById('chk-overlay'), 'change').map(e => e.target.checked).distinctUntilChanged();

    const videoSource$ = Observable.merge(selectedDevice$, Observable.just(null)).map(x => ({
        video: {
            deviceId: x !== null ? { exact: x } : undefined,
            width: 9999,
            height: 9999
        }
    }));

    const webcamStream$ = videoSource$.flatMap(c => navigator.mediaDevices.getUserMedia(c));
    // 24fps = 40ms - 12fps = 80ms - 6fps = 160ms
    const fps$ = Observable.fromEvent(document.getElementById('ddl-fps'), 'change')
        .map(e => e.target)
        .startWith(document.getElementById('ddl-fps'))
        .map(el => el.value)
        .map(fps => parseInt(fps));

    const playbackInterval$ = Observable.create(obs => setInterval(i => obs.onNext(i), 40))
        .scan(agg => { return agg + 1; }, 0).map(i => i % 4)
        .withLatestFrom(fps$)
        .map(arr => ({ fps: arr[1], interval: arr[0] }))
        .filter(obj => obj.interval % (24 / obj.fps) === 0)
        .map(true);

    const takeClick$ = Observable.fromEvent(document.querySelector('.btn-take'), 'click');
    const source$ = webcamStream$.withLatestFrom(videoEl$).map(arr => {
        var stream = arr[0];
        var el = arr[1];
        el.srcObject = stream;
        return el;
    }).flatMap((el) => {
        return Observable.create(obs => {
            el.onloadedmetadata = function (e) {
                obs.onNext({
                    width: el.videoWidth,
                    height: el.videoHeight,
                    element: el
                });
            };
        });
    }).share();


    source$.subscribe(video => {
        video.element.height = video.height;
        video.element.width = video.width;

    });

    const takeFrame$ = takeClick$.withLatestFrom(source$).map(arr => arr[1]).flatMap(captureFrame).share();

    const frames$ = takeFrame$.map(video => video.lastFrame).scan((agg, img) => { agg.push(img); return agg; }, []).share();


    takeFrame$.withLatestFrom(imgOverlay$).subscribe(arr => {
        var img = arr[1];
        var frame = arr[0];

        img.src = frame.lastFrame;
        //   img.style.width = frame.width + 'px';
        //   img.style.height = frame.height + 'px';
    });

    //imgOverlay$.subscribe(img => {
    //    console.log(img);
    //});

    //frames$.subscribe(frames => {
    //    //  console.log(frames);
    //});

    overlayChange$.withLatestFrom(imgOverlay$).subscribe(arr => {
        if (arr[0] === true) {
            arr[1].classList.add('active');
        } else {
            arr[1].classList.remove('active');
        }
    });
    var currentFrameInt$ = playbackInterval$.withLatestFrom(frames$).scan((agg, arr) => {
        var [interval, frames, frameCountEl] = arr;

        if (frames.length > 0) {
            if (agg >= frames.length - 1) {
                return 0;
            } else {
                return agg + 1;
            }
        }
        return 0;
    }, 0);

    currentFrameInt$.withLatestFrom(frames$, frameCountEl$).subscribe(arr => arr[2].innerText = (arr[0] + 1) + ' of ' + arr[1].length);

    currentFrameInt$.withLatestFrom(frames$).map(arr => arr[1][arr[0]]).withLatestFrom(playbackEl$)
        .subscribe(arr => {
            var [frame, monitor] = arr;
            drawFrame(monitor, frame);
        });

    //  renderClick$.subscribe(x => console.log('render click'));
    workerReady$.subscribe(() => console.log('worker ready'));
    outputFile$.subscribe(file => console.log('output file', file));

    var webmExport$ = renderClick$.withLatestFrom(frames$, fps$)
        .map(arr => Whammy.fromImageArray(arr[1], arr[2], false))
        .flatMap(video => blobToArrayBuffer(video));


    // convert to Mpeg 4 
    Observable.empty().withLatestFrom(webmExport$).map(arr => arr[1])
        .map(videoArrayBuffer => {
            var args = ['-i', 'input.webm', 'output.mp4'];
            return {
                type: 'command',
                TOTAL_MEMORY: 512 * 1024 * 1024,
                arguments: args,
                files: [{ name: 'input.webm', data: videoArrayBuffer }]
            };
        }).subscribe(x => worker.postMessage(x));
    
    Observable.merge([webmExport$, ffmpegResult$]).subscribe(x => {

        var playbackEl = document.getElementById('exported');
        var downloadEl = document.getElementById('download');
        
        var blob = null;
        if (x.constructor.name === 'Uint8Array') {
            blob = new Blob([x], { type: 'video/webm' });
        } else {
            blob = new Blob([new Uint8Array(x.data)], { type: 'video/mp4' });
        }
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = function (base64) {
            playbackEl.src = base64.target.result;
            downloadEl.href = base64.target.result;
        };
    });

};

var app = new AnimationApp();
