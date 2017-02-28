(function(angular) {
    var gameApp = angular.module('GameApp', []);
    gameApp.controller('ChatController', ['$scope', 'modalService', function($scope, modalService) {
        /*global io*/
        var socket = io.connect();

        $scope.messages = [];
        $scope.roster = [];
        $scope.name = '';
        $scope.text = '';
        
        $scope.moves = [];
        $scope.modalService = modalService;

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
            $scope.clearMovesFromCards();
            $scope.game_state.player.forEach(function (p){
               p.hand.forEach(function(c){
                   c.moves = $scope.movesForCard(c);
               });
               p.characters.forEach(function(char){
                   char.card.moves = $scope.movesForCard(char.card);
                   char.upgrades.forEach(function(u){
                       u.card.moves = $scope.movesForCard(u.card);
                   });
               });
            });
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
        
        $scope.clearMovesFromCards = function() {
            $scope.game_state.player.forEach(function (p){
               p.hand.forEach(function(c){
                   c.moves = [];
               });
            });
        };
        
        $scope.movesForCard = function(card) {
            return $scope.moves.filter(function(m) {
                return (m.card && (m.card.id == card.id)); 
            });
        };
    }]);
    gameApp.directive('card', ['modalService', function(modalService) {
       return {
           restrict: 'E',
           scope: {
               card: '=info',
               left: '=left',
               top: '=top'
            },
           templateUrl: 'card.html',
           link: function(scope) {
               scope.clickCard = function() {
                   modalService.clickedCard = scope.card;
                   modalService.showModal = true;
               };
           }
       };
    }]);
    gameApp.factory('modalService', function(){
        return {
            showModal: false,
            clickedCard: undefined
        };
    });
})(window.angular);
