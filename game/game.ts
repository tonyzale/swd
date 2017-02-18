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
        this.characters.push(new Character(trooper, false));
        this.characters[0].upgrades.push(new Upgrade(card_db.cards_by_code['01007'].MakeCopy()));
        this.hand.push(card_db.cards_by_code['01157'].MakeCopy());
        this.hand.push(card_db.cards_by_code['01159'].MakeCopy());
        this.supports.push(new Support(card_db.cards_by_code['01005'].MakeCopy()));
    }
    
    DebugString(): string {
        let out = `${this.name}: `;
        for (let c of this.characters) {
            out += `${c.DebugString()} + `;
        }
        
        for (let s of this.supports) {
            out += `${s.DebugString()} + `;
        }
        out = out.slice(0, out.length - 3);
        
        return out;
    }
    
    GetAvailableActions(): TurnAction[] {
        let out: TurnAction[] = [];
        for (let c of this.hand) {
            if (c.type == cards.CardType.Event) {
                out.push(new PlayEvent(c));
            } else if (c.type == cards.CardType.Upgrade) {
                for (let char of this.characters) {
                    out.push(new InstallUpgrade(c, char));
                }
            } else if (c.type == cards.CardType.Support) {
                out.push(new InstallSupport(c));
            }
        }
        let dice_pool: PlayDie[] = [];
        for (let c of this.characters) {
            if (c.state == CardState.Ready) {
                out.push(new Activate(c));
            }
            for (let die of c.dice) {
                if (die.state == DieState.InPlay) {
                    dice_pool.push(die);
                }
            }
            for (let upgrade of c.upgrades) {
                for (let die of upgrade.dice) {
                    if (die.state == DieState.InPlay) {
                        dice_pool.push(die);
                    }
                }
            }
        }
        for (let s of this.supports) {
            if (s.state == CardState.Ready) {
                out.push(new Activate(s));
            }
            for (let die of s.dice) {
                if (die.state == DieState.InPlay) {
                    dice_pool.push(die);
                }
            }
        }
        out.push(new Pass());
        out.push(new ClaimBattlefield());
        return out;
    }
    
    hand: cards.Card[] = [];
    draw_deck: cards.Card[];
    discard_pile: cards.Card[];
    characters: Character[] = [];
    supports: Support[] = [];
    resources: number;
    battlefield: cards.Card;
}

enum DieState {
    Ready,
    InPlay,
    Resolved,
    Unavailable
}

enum CardState {
    Ready,
    Exhausted
}

class PlayDie {
    constructor(public die: cards.Die) {
        
    }
    DebugString(): string {
        if (this.state == DieState.InPlay) {
            return `die showing ${this.die.sides[this.active_face].DebugString()}`;
        } else {
            return `die ${DieState[this.state]}`;
        }
    }
    public state = DieState.Ready;
    public active_face: number = 1;
}

class Upgrade {
    constructor(public readonly card: cards.Card) {
        if (card.type != cards.CardType.Upgrade) {
            throw new RangeError('Card Not Upgrade');
        }
        if (card.die) {
            this.dice.push(new PlayDie(card.die));
        }
    }
    DebugString(): string {
        let out = `${this.card.name} ${CardState[this.state]} `;
        for (let d of this.dice) {
            out += `${d.DebugString()} `;
        }
        return out;
    }
    public dice: PlayDie[] = [];
    public state = CardState.Ready;
}

class Character {
    constructor(public readonly card: cards.Card, public readonly elite: boolean) {
        if (card.type != cards.CardType.Character) {
            throw new RangeError('Not Character Card');
        }
        this.dice.push(new PlayDie(card.die));
        if (elite) {
            this.dice.push(new PlayDie(card.die));
        }
    }
    DebugString(): string {
        let out = `${this.card.name} damage: ${this.damage} `;
        for (let d of this.dice) {
            out += `${d.DebugString()} `;
        }
        for (let u of this.upgrades) {
            out += `${u.DebugString()} `;
        }
        return out;
    }
    public damage = 0;
    public state = CardState.Ready;
    public upgrades: Upgrade[] = [];
    public dice: PlayDie[] = [];
}

class Support {
    constructor(public readonly card: cards.Card) {
        if (this.card.type != cards.CardType.Support) {
            throw new RangeError('Not Support Card');
        }
        if (this.card.die) {
            this.dice.push(new PlayDie(card.die));
        }
    }
    
    DebugString(): string {
        let out = `${this.card.name} ${CardState[this.state]} `;
        for (let d of this.dice) {
            out += `${d.DebugString()} `;
        }
        return out;
    }
    
    public dice: PlayDie[] = [];
    public state = CardState.Ready;
}

class TurnRecord {
    player: Player;
    turn_action: TurnAction;
}

interface TurnAction {
    
}

class PlayEvent implements TurnAction {
    constructor(public card: cards.Card){}
}

class InstallUpgrade implements TurnAction {
    constructor(public card: cards.Card, public target: Character){}
}

class InstallSupport implements TurnAction {
    constructor(public card: cards.Card){}
}

class Activate implements TurnAction {
    constructor(public target: Character | Upgrade | Support){}
}

class Resolve implements TurnAction {
    constructor(public side_type: cards.SideType){}
}

class Discard implements TurnAction {
    constructor(public card: cards.Card){}
}

class UseCardAction implements TurnAction {
    constructor(public card: cards.Card){}
}

class ClaimBattlefield implements TurnAction {
}

class Pass implements TurnAction {
}

class RoundReset implements TurnAction {

}
