angular.module('app').controller('AppController', function ($scope, observeOnScope) {
    function log() {
        console.log(arguments);
    }
    /*
     watch fps
     load()
     rewind()
     stop()
     pause()
     play()
     forward()
     export()
     */


    var load$ = $scope.$createObservableFunction('load');
    var rewind$ = $scope.$createObservableFunction('rewind');
    var stop$ = $scope.$createObservableFunction('stop');
    var pause$ = $scope.$createObservableFunction('pause');
    var play$ = $scope.$createObservableFunction('play');
    var forward$ = $scope.$createObservableFunction('forward');
    var export$ = $scope.$createObservableFunction('export');

    var fps$ = observeOnScope($scope, 'fps');

    load$.subscribe(log);
    fps$.subscribe(log);
});
