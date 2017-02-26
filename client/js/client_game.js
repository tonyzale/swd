(function(angular) {
    var gameApp = angular.module('GameApp', []);
    gameApp.controller('ChatController', ['$scope', function($scope) {
        /*global io*/
        var socket = io.connect();

        $scope.messages = [];
        $scope.roster = [];
        $scope.name = '';
        $scope.text = '';

        socket.on('connect', function() {
            $scope.setName();
        });

        socket.on('message', function(msg) {
            $scope.messages.push(msg);
            $scope.$apply();
        });

        socket.on('roster', function(names) {
            $scope.roster = names;
            $scope.$apply();
        });

        socket.on('state', function(state) {
            $scope.game_state = JSON.parse(state);
            $scope.$apply();
        });

        socket.on('moves', function(moves) {
            $scope.moves = JSON.parse(moves);
            $scope.$apply();
        });

        $scope.send = function send() {
            console.log('Sending message:', $scope.text);
            socket.emit('message', $scope.text);
            $scope.text = '';
        };

        $scope.setName = function setName() {
            socket.emit('identify', $scope.name);
        };
    }]);
    gameApp.directive('card', function() {
       return {
           restrict: 'E',
           scope: {
               card: '=info'
            },
           templateUrl: 'card.html'
       } 
    });
})(window.angular);
