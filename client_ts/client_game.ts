/// <reference path="../node_modules/@types/angular/index.d.ts" />
/// <reference path="../node_modules/@types/socket.io-client/index.d.ts" />

(function(angular: angular.IAngularStatic) {
    var gameApp = angular.module('GameApp', []);
    interface GameScope extends angular.IScope {
        messages: any[];
        roster: any[];
        name: string;
        text: string;
        card_width: number;
        card_height: number;
        moves: any[];
        show_modal: boolean;
        modal_data: any;
        showModal: (any)=>void;
        selectMove: (any)=>void;
        movesForCard: (any)=>any[];
        socketService: any;
        setName: ()=>void;
        clearMovesFromCards: ()=>void;
        game_state: any;
        send: ()=>void;
    };
    gameApp.controller('ChatController', ['$scope', 'modalService', 'socketService', function($scope: GameScope, modalService, socketService) {
        $scope.messages = [];
        $scope.roster = [];
        $scope.name = '';
        $scope.text = '';
        $scope.card_width = 150;
        $scope.card_height = $scope.card_width * 1.4;

        $scope.moves = [];
        $scope.show_modal = false;
        $scope.socketService = socketService;
        $scope.modal_data = {
            id: 'modalid',
            title: 'modal title',
            text: 'Make a choice:',
            options: [{text:'Action A', id:'o1'}, {text:'Action B', id:'o2'}]
        };
        modalService.showModal = function(data) {
            $scope.show_modal = true;
            $scope.modal_data = data;
        }

        $scope.selectMove = function(move) {
            socketService.socket.emit('move-selection', move);
        };

        socketService.socket.on('connect', function() {
            $scope.setName();
        });

        socketService.socket.on('message', function(msg: string) {
            $scope.messages.push(msg);
            $scope.$apply();
        });

        socketService.socket.on('roster', function(names: string[]) {
            $scope.roster = names;
            $scope.$apply();
        });

        socketService.socket.on('state', function(state) {
            $scope.game_state = JSON.parse(state);
            $scope.$apply();
        });

        socketService.socket.on('moves', function(moves) {
            $scope.moves = JSON.parse(moves);
            $scope.clearMovesFromCards();
            $scope.game_state.player.forEach(function(p) {
                p.hand.forEach(function(c) {
                    c.moves = $scope.movesForCard(c);
                });
                p.characters.forEach(function(char) {
                    char.card.moves = $scope.movesForCard(char.card);
                    char.upgrades.forEach(function(u) {
                        u.card.moves = $scope.movesForCard(u.card);
                    });
                });
                p.supports.forEach(function(support) {
                    support.card.moves = $scope.movesForCard(support.card);
                });
            });
            $scope.$apply();
        });
        
        socketService.socket.on('modal', function(data){
            $scope.modal_data = JSON.parse(data);
            $scope.$apply();
        });

        $scope.send = function() {
            console.log('Sending message:', $scope.text);
            socketService.socket.emit('message', $scope.text);
            $scope.text = '';
        };

        $scope.setName = function() {
            socketService.socket.emit('identify', $scope.name);
        };

        $scope.clearMovesFromCards = function() {
            $scope.game_state.player.forEach(function(p) {
                p.hand.forEach(function(c) {
                    c.moves = [];
                });
            });
        };

        $scope.movesForCard = function(card) {
            return $scope.moves.filter(function(m) {
                return (m.card_id && (m.card_id == card.id));
            });
        };
    }]);
    gameApp.directive('card', ['modalService', function(modalService) {
        interface CardScope extends ng.IScope{
            border_width, card_height, card_width:number;
            card: any;
            wrapWidth: ()=>number;
            borderCss: ()=>string;
            clickCard: ()=>void;
        }
        return {
            restrict: 'E',
            scope: {
                card: '=info',
                left: '=',
                top: '=',
                overlay: '=',
                card_width: '=width',
                card_height: '=height'
            },
            templateUrl: 'card.html',
            link: function(scope: CardScope) {
                scope.border_width = 3;
                scope.wrapWidth = function() {
                    if (scope.card.state == 1) {
                        return scope.card_height;
                    } else {
                        return scope.card_width;
                    }
                }
                scope.borderCss = function() {
                    if (scope.card.moves && scope.card.moves.length > 0) {
                        return '3px solid lime';
                    } else {
                        return '3px solid rgba(0,0,0,0)';
                    }
                }
                scope.clickCard = function() {
                    var modal_data = {
                        id: 'modalid',
                        title: scope.card.name,
                        text: 'Options:',
                        options: []
                    };
                    scope.card.moves.forEach(function(m, i) {
                       modal_data.options.push({
                           card_id: scope.card.id,
                           option_idx: i,
                           text: m
                       })
                    });
                    modalService.showModal(modal_data);
                };
            }
        };
    }]);
    gameApp.directive('modal', function(){
        interface ModalScope extends ng.IScope {
            clickedOption: (option: number)=>void;
            content: any;
            socket: SocketIOClient.Socket;
        }
        return {
            restrict: 'E',
            scope: {
                content: '=',
                socket: '=',
                show: '='
            },
            templateUrl: 'modal.html',
            link: function(scope: ModalScope) {
                scope.clickedOption = function(option: number) {
                    scope.socket.emit('choice', JSON.stringify({
                        content_id: scope.content.id,
                        choice: scope.content.options[option].text
                    }));
                }
            }
        };
    });
    gameApp.factory('modalService', function() {
        return {
            showModal: function(data){throw new Error('using showModal before init');}
        };
    });
    gameApp.factory('socketService', function() {
        return {
            /*global io*/
            socket: io.connect()
        };
    });
})((<any>window).angular);