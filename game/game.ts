/// <reference path="../typings/globals/node/index.d.ts" />
/// <reference path="./cards.ts" />
import cards = require('./cards');

export class CardDB {
    constructor() {
        let fs = require('fs');
        let all_cards = JSON.parse(fs.readFileSync('game/cards.json').toString());
        this.cards = [];
        this.cards_by_code = {};
        for (let card of all_cards) {
            let new_card = new cards.Card(card);
            this.cards.push(new_card);
            this.cards_by_code[new_card.code] = new_card;
        }
    }
    public readonly cards: cards.Card[];
    public readonly cards_by_code: {[id: string]: cards.Card};
}
export class GameState {
    player: Player[] = [new Player('P1'), new Player('P2')];
    active_player: number;
}

class Player {
    constructor(public readonly name: string){}
    hand: cards.Card[];
    draw_deck: cards.Card[];
    discard_pile: cards.Card[];
    characters: Character[];
    supports: Support[];
    resources: number;
}

class InPlay {
    exhausted: boolean;
}

class Character extends InPlay {
    card: cards.Card;
    damage: number;
    upgrades: cards.Card[];
}

class Support extends InPlay {
    card: cards.Card;
}

class TurnRecord {
    player: Player;
    turn_action: TurnAction;
}

interface TurnAction {
    
}

class PlayCard implements TurnAction {
    
}

class Activate implements TurnAction {
    
}

class Resolve implements TurnAction {
    
}

class Discard implements TurnAction {
    
}

class UseCardAction implements TurnAction {
    
}

class ClaimBattlefield implements TurnAction {
    
}

class Pass implements TurnAction {
    
}

class RoundReset implements TurnAction {

}
