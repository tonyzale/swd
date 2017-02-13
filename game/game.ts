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
    constructor(public p1: Player, public p2: Player) {
        this.player.push(p1);
        this.player.push(p2);
    }
    
    DebugString(): string {
        return `round ${this.round} [${this.player[0].DebugString()}] [${this.player[1].DebugString()}]`;
    }
    player: Player[] = [];
    round: number = 0;
    active_player: number = 0;
}

export class Player {
    constructor(public readonly name: string, card_db: CardDB) {
        let trooper = card_db.cards_by_code['01002'].MakeCopy();
        this.characters.push(new Character(trooper));
        this.hand.push(card_db.cards_by_code['01157'].MakeCopy());
    }
    
    DebugString(): string {
        let out = `${this.name}: `;
        for (let c of this.characters) {
            out += `${c.card.name} damage: ${c.damage} + `;
        }
        out = out.slice(0, out.length - 3);
        return out;
    }
    
    hand: cards.Card[] = [];
    draw_deck: cards.Card[];
    discard_pile: cards.Card[];
    characters: Character[] = [];
    supports: Support[];
    resources: number;
    battlefield: cards.Card;
}

class InPlay {
    exhausted: boolean;
}

class Upgrade {
    card: cards.Card;
    exhausted: boolean;
    dice: cards.Die[];
}

class Character extends InPlay {
    constructor(public readonly card: cards.Card) {
        super();
    }
    damage = 0;
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
