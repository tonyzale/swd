/// <reference path="../node_modules/@types/angular/index.d.ts" />
/// <reference path="../node_modules/@types/socket.io-client/index.d.ts" />
/// <reference path="json_payload.ts" />

(function(angular: angular.IAngularStatic) {
    var gameApp = angular.module('GameApp', []);
    interface GameScope extends angular.IScope {
        messages: Chat[];
        roster: any[];
        name: string;
        text: string;
        card_width: number;
        card_height: number;
        moves: any[];
        show_modal: boolean;
        modal_data: Modal;
        showModal: (d:Modal)=>void;
        selectMove: (d:any)=>void;
        movesForCard: (d:any)=>any[];
        socketService: any;
        setName: ()=>void;
        clearMovesFromCards: ()=>void;
        game_state: ClientGameState;
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
            options: []
        };
        modalService.showModal = function(data: Modal) {
            $scope.show_modal = true;
            $scope.modal_data = data;
        }

        $scope.selectMove = function(move) {
            socketService.socket.emit('move-selection', move);
        };

        socketService.socket.on('connect', function() {
            $scope.setName();
        });

        socketService.socket.on('message', function(msg: Chat) {
            $scope.messages.push(msg);
            $scope.$apply();
        });

        socketService.socket.on('roster', function(names: string[]) {
            $scope.roster = names;
            $scope.$apply();
        });

        socketService.socket.on('state', function(state: string) {
            $scope.game_state = JSON.parse(state);
            $scope.$apply();
        });

        socketService.socket.on('moves', function(moves: string) {
            $scope.moves = JSON.parse(moves);
            $scope.clearMovesFromCards();
            $scope.game_state.player.hand.forEach(function(c: any) {
                    c.moves = $scope.movesForCard(c);
            });
            $scope.game_state.player.characters.forEach(function(char: any) {
              char.card.moves = $scope.movesForCard(char.card);
              char.upgrades.forEach(function(u: any) {
                u.card.moves = $scope.movesForCard(u.card);
              });
            });
            $scope.game_state.player.supports.forEach(function(support: any) {
              support.card.moves = $scope.movesForCard(support.card);
            });
            $scope.$apply();
        });
        
        socketService.socket.on('modal', function(data: string){
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
          $scope.game_state.player.hand.forEach(function(c: any) {
            c.moves = [];
          });
        };

        $scope.movesForCard = function(card): any[] {
            return $scope.moves.filter(function(m) {
                return (m.card_id && (m.card_id == card.id));
            });
        };

        $scope.diceInPool = function(player: UserPlayer | OppPlayer): any[] {
          let dice: any[] = [];
          return dice;
        };
    }]);
    gameApp.directive('card', ['modalService', function(modalService) {
        interface CardScope extends ng.IScope{
            border_width: number;
            card_height: number;
            card_width:number;
            card: any;
            wrapWidth: ()=>number;
            borderCss: ()=>string;
            clickCard: ()=>void;
        }
        return {
            restrict: 'E',
            scope: {
              card: '=info',
                state: '=',
                left: '=',
                top: '=',
                overlay: '=',
                card_width: '=width',
                card_height: '=height',
                back: '='
            },
            templateUrl: 'card.html',
            link: function(scope: CardScope) {
                scope.border_width = 3;
                scope.imgPath = function() {
                  if (scope.back && scope.back === "yes") {
                    return "http://www.cardgamedb.com/deckbuilders/starwarsdestiny/swd-cardback.png";
                  }
                  return scope.card.json.imagesrc;
                }
                scope.wrapWidth = function() {
                    if (scope.card && scope.card.state == 1) {
                        return scope.card_height;
                    } else {
                        return scope.card_width;
                    }
                }
                scope.borderCss = function() {
                    if (scope.card && scope.card.moves && scope.card.moves.length > 0) {
                        return '3px solid lime';
                    } else {
                        return '3px solid rgba(0,0,0,0)';
                    }
                }
                scope.clickCard = function() {
                    var modal_data: Modal = {
                        id: 'modalid',
                        title: scope.card.name,
                        text: 'Options:',
                        options: []
                    };
                    scope.card.moves.forEach(function(m: any, i: number) {
                      if (modal_data.options === undefined) {
                        modal_data.options = [];
                       }
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
    gameApp.directive('modal', function() {
      interface ModalContent {
        title: string;
        text: string;
        options: any[];
      }
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
                let selection: ModalSelection = {
                  content_id: scope.content.id,
                  choice: scope.content.options[option].text
                };
                scope.show = false;
                scope.socket.emit('choice', JSON.stringify(selection));
              };
            }
        };
    });
    gameApp.factory('modalService', function() {
        return {
            showModal: function(data: any){throw new Error('using showModal before init');}
        };
    });
    gameApp.factory('socketService', function() {
        return {
            /*global io*/
            socket: io.connect()
        };
    });
})((<any>window).angular);
