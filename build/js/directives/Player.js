angular.module('app').directive('player', function (rx, observeOnScope) {

    return {
        scope: { player: '=' },
        controller: function ($scope, $element) {
            var $range = $element.find('input[type="range"]');

            var project$ = $scope.player;
            

            var rewind$ = $scope.$createObservableFunction('rewind');
            var stop$ = $scope.$createObservableFunction('stop');
            var pause$ = $scope.$createObservableFunction('pause');
            var play$ = $scope.$createObservableFunction('play');
            var forward$ = $scope.$createObservableFunction('forward');
            var range$ = rx.Observable.fromEvent($range[0], 'input').map(x => parseInt(x.target.value)) ;//  observeOnScope($scope, 'range').map(x => x.newValue).filter(x => x !== undefined);

            project$.subscribe(x => console.log(x));
            var noOfFrames$ = project$.map(x => x ? x.frames.length : 0);

            noOfFrames$.subscribe(x => $range.attr('max', x));

            range$.subscribe(x => console.log(x));

        }
    }
});