
angular.module('ovation').directive('webcamAccess', function ($timeout, ImageEditService) {
    return {
        restrict: 'A',
        templateUrl: '/ImageToolTemplates/webcamaccess',
        scope: false,
        link: function (scope, element) {
            
            var videoStream = null;
            var video = element.find('#imageEditorVideoWebCam')[0];

            function killWebcam() {
                if (video.mozSrcObject !== undefined) {
                    video.mozSrcObject = null;
                } else {
                    video.src = null;
                }
                if (videoStream) {
                    try {
                        var trk = videoStream.getVideoTracks()[0];
                        trk.stop();
                        console.info('Disconnecting: ', trk.label);
                    } catch (e) {

                    }
                }
            }

            scope.$on('$destroy', killWebcam);

            var noWebCam = function () {
                scope.hideVideo = true;
                scope.hideCaptureButton = true;
                scope.showControl = false;
            }

            function useWebCamStream(stream) {
                videoStream = stream;

                console.info('Connecting: ', stream.getVideoTracks()[0].label);

                if (video.mozSrcObject !== undefined) { //FF18a
                    video.mozSrcObject = stream;
                } else {
                    video.src = window.URL.createObjectURL(stream);
                }
                video.onloadedmetadata = function () {
                  //  video.width = getInitialWidth();
                    //  video.height = getInitialWidth() / (video.videoWidth / video.videoHeight);
                    $timeout(function () { 
                        scope.videoOn = true;
                    });
                }
            }

            navigator.getUserMedia_ = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            if (navigator.getUserMedia_) {
                navigator.getUserMedia_({ video: true, audio: false }, useWebCamStream, noWebCam);
            } else {
                $timeout(function () {
                    Webcam.set({
                        width: 300,
                        height: 270,
                        image_format: 'jpeg',
                        jpeg_quality: 90
                    });
                    $(video).hide();
                    Webcam.setSWFLocation('/scripts/webcam.swf');
                    if (!Webcam.attach('#webcam')) {
                        noWebCam();
                    };
                    
                });
            }



            scope.capture = function () {
                    if (navigator.getUserMedia_) {
                        if (video.paused || video.ended) return false;
                        var baseSize = 1000;

                        var w = video.videoWidth;
                        var h = video.videoHeight;

                        var videoAspect = w / h;

                        var canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        var cxt = canvas.getContext('2d');

                        cxt.drawImage(video, 0, 0, w, h);

                        ImageEditService.SetImage(canvas.toDataURL("image/png"));
                        delete canvas;
                    } else {
                        Webcam.snap(function (data_uri) {
                            if (scope.canvasSupported) ImageEditService.SetImage(data_uri);
                        });
                    }

                    scope.useWebcam();
                } 
            }

    }
});
