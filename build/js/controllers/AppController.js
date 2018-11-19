angular.module('app').controller('AppController', function ($scope, $timeout, observeOnScope, rx, Socket, Render) {
    var socket = io.connect(location.origin);
    function log() {
        console.log(arguments[0]);
    }
    var Observable = rx.Observable;
    var Subject = rx.Subject;

    function listenSocketEvt(evtName) {
        return Observable.create(function (observe) {
            socket.on(evtName, e => observe.onNext(e));
        });
    }


    
    var add$ = $scope.$createObservableFunction('add').map(() => prompt('Enter name for animation')).filter(x => x !== null);
    var selectProject$ = $scope.$createObservableFunction('selectProject');
    var rewind$ = $scope.$createObservableFunction('rewind');
    var stop$ = $scope.$createObservableFunction('stop');
    var pause$ = $scope.$createObservableFunction('pause');
    var play$ = $scope.$createObservableFunction('play');
    var forward$ = $scope.$createObservableFunction('forward');
    var export$ = $scope.$createObservableFunction('export');

    var fps$ = observeOnScope($scope, 'fps').map(x => x.newValue).filter(x => x !== undefined);
    var range$ = observeOnScope($scope, 'range').map(x => x.newValue).filter(x => x !== undefined);

    add$.subscribe(function (name) {
        socket.emit(Socket.NewProject, { name: name });
    });
    selectProject$.subscribe(function (id) {
        socket.emit(Socket.ProjectSelect, { _id: id });
    });
    var project$ = listenSocketEvt(Socket.LoadingProject);
    // listen for project coming back from server
    project$.subscribe(log);
    
    fps$.subscribe(log);
    range$.subscribe(log);

    $scope.range = 0;
    $scope.fps = 12;

    $scope.projects$ = listenSocketEvt(Socket.ProjectList).do(log);
    $scope.noOfFrames$ = Observable.just(24 - 1);// this will be 1000 / noOFFrames

    $timeout(function () {
        socket.emit(Socket.LoadProjects);
    }, 1000);
});
