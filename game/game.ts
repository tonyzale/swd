/// <reference path="../typings/globals/node/index.d.ts" />
/// <reference path="./cards.ts" />
/// <reference path="./events.ts" />
import cards = require('./cards');
import events = require('./events');

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
    
    GetAvailableActions(player_id: number): TurnAction[] {
        let active_player = this.player.filter(p => {return p.id == player_id;})[0];
        let opponent = this.player.filter(p => {return p.id != player_id;})[0];
        let out: TurnAction[] = [];
        for (let c of active_player.hand) {
            if (c.type == cards.CardType.Event) {
                out = out.concat(events.GetEventActions(c, active_player, opponent));
            } else if (c.type == cards.CardType.Upgrade) {
                for (let char of active_player.characters) {
                    out.push(new InstallUpgrade(c, char));
                }
            } else if (c.type == cards.CardType.Support) {
                out.push(new InstallSupport(c));
            }
        }
        let dice_pool: PlayDie[] = [];
        for (let c of active_player.characters) {
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
        for (let s of active_player.supports) {
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
    
    DebugString(): string {
        return `round ${this.round} [${this.player[0].DebugString()}] [${this.player[1].DebugString()}]`;
    }
    player: Player[] = [];
    round: number = 0;
    active_player: number = 0;
}

export class Player {
    constructor(public readonly name: string, public readonly id: number, card_db: CardDB) {
        console.log('card_db ' + card_db);
        let trooper = card_db.cards_by_code['01002'].MakeCopy();
        this.characters.push(new Character(trooper, false));
        this.characters[0].upgrades.push(new Upgrade(card_db.cards_by_code['01007'].MakeCopy()));
        this.characters[0].upgrades.push(new Upgrade(card_db.cards_by_code['01008'].MakeCopy()));
        this.characters[0].upgrades.push(new Upgrade(card_db.cards_by_code['01008'].MakeCopy()));
        trooper = card_db.cards_by_code['01002'].MakeCopy();
        this.characters.push(new Character(trooper, false));
        this.characters[1].upgrades.push(new Upgrade(card_db.cards_by_code['01007'].MakeCopy()));
        this.characters[1].upgrades.push(new Upgrade(card_db.cards_by_code['01008'].MakeCopy()));
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
    
    hand: cards.Card[] = [];
    draw_deck: cards.Card[] = [];
    discard_pile: cards.Card[] = [];
    out_pile: cards.Card[] = [];
    characters: Character[] = [];
    supports: Support[] = [];
    resources: number = 2;
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

export class Character {
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
    public shields = 0;
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

export class TurnAction {
    constructor(public name: string){}
}

export class PlayEventOnCard extends TurnAction {
    constructor(public card: cards.Card, public target: Character | Upgrade | Support){super('PlayEventOnCard');}
}

export class PlayEventOnPlayer extends TurnAction {
    constructor(public card: cards.Card, public player_id: number) {super('PlayEventOnPlayer');}
}

export class InstallUpgrade extends TurnAction {
    constructor(public card: cards.Card, public target: Character){super('InstallUpgrade');}
}

export class InstallSupport extends TurnAction {
    constructor(public card: cards.Card){super('InstallSupport');}
}

export class Activate extends TurnAction {
    constructor(public target: Character | Upgrade | Support){
        super('Activate');
        this.card = target.card;
    }
    public card: cards.Card;
}

export class Resolve extends TurnAction {
    constructor(public side_type: cards.SideType){super('Resolve')}
}

export class Discard extends TurnAction {
    constructor(public card: cards.Card){super('Discard');}
}

export class UseCardAction extends TurnAction {
    constructor(public card: cards.Card){super('UseCardAction')}
}

export class ClaimBattlefield extends TurnAction {
    constructor(){super('ClaimBattlefield');}
}

export class Pass extends TurnAction {
    constructor(){super('Pass');}
}

export class RoundReset extends TurnAction {
    constructor(){super('RoundReset');}
}


export interface Operation {
    str(): string;
    MutateState(state: GameState);
}

export interface Destination {
    str(): string;
    PutCardAtDestination(card: cards.Card, state: GameState);
}

export class DiscardPile implements Destination {
    constructor(public readonly player_id: number) {}
    str(): string { return "DiscardPile " + this.player_id; }
    PutCardAtDestination(card: cards.Card, state: GameState) {
        state.player[this.player_id].discard_pile.push(card);
    }
}

export class OutOfGame implements Destination {
    constructor(public readonly player_id: number) {}
    str(): string { return "OutOfGame"; }
    PutCardAtDestination(card: cards.Card, state: GameState) {
        state.player[this.player_id].out_pile.push(card);
    }
}

export class NewCharacter implements Destination {
    constructor(public readonly player_id: number, public elite: boolean) {}
    str(): string { return `NewCharacter ${this.player_id}`; }
    PutCardAtDestination(card: cards.Card, state: GameState) {
        state.player[this.player_id].characters.push(new Character(card, this.elite));
    }
}

export class NewUpgrade implements Destination {
    constructor(public readonly player_id: number, public readonly character_card_id: cards.CardId) {}
    str(): string { return `NewUpgrade ${this.player_id} for ${this.character_card_id}`; }
    PutCardAtDestination(card: cards.Card, state: GameState) {
        let char: Character;
        for (char of state.player[this.player_id].characters) {
            if (char.card.id == this.character_card_id) {
                char.upgrades.push(new Upgrade(card));
                return;
            }
        }
        throw new Error('Couldn\'t find character!');
    }
}

export class NewSupport implements Destination {
    constructor(public readonly player_id: number) {}
    str(): string { return `NewSupport ${this.player_id}`; }
    PutCardAtDestination(card: cards.Card, state: GameState) {
        state.player[this.player_id].supports.push(new Support(card));
    }
}

export class PlayerHand implements Destination {
    constructor(public readonly player_id: number) {}
    str(): string { return `PlayerHand ${this.player_id}`; }
    PutCardAtDestination(card: cards.Card, state: GameState) {
        state.player[this.player_id].hand.push(card);
    }    
}

export class BottomDrawPile implements Destination {
    constructor(public readonly player_id: number) {}
    str(): string { return `BottomDrawPile ${this.player_id}`; }
    PutCardAtDestination(card: cards.Card, state: GameState) {
        state.player[this.player_id].draw_deck.splice(0, 0, card);
    }
}

function FindAndRemoveCard(target_card: cards.CardId, card_array: cards.Card[]): cards.Card {
    for (let i = 0; i < card_array.length; ++i) {
        if (card_array[i].id == target_card) {
            return card_array.splice(i, 1)[0];
        }
    }
    return undefined;
}

export class MoveCard implements Operation {
    constructor(public readonly card_id: cards.CardId, public readonly destination: Destination){}
    str(): string { return `MoveCard ${this.card_id} to ${this.destination.str()}`; }
    MutateState(state: GameState) {
        let card: cards.Card;
        for (let player of state.player) {
            card = FindAndRemoveCard(this.card_id, player.hand);
            if (card) break;
            card = FindAndRemoveCard(this.card_id, player.discard_pile);
            if (card) break;
            card = FindAndRemoveCard(this.card_id, player.out_pile);
            if (card) break;
            for (let i = 0; i < player.characters.length; ++i) {
                if (player.characters[i].card.id == this.card_id) {
                    card = player.characters[i].card;
                    if (player.characters[i].upgrades.length > 0) {
                        throw new Error("Moving non-empty character");
                    }
                    player.characters.splice(i, 1);
                    break;
                }
                for (let j = 0; j < player.characters[i].upgrades.length; ++j) {
                    if (player.characters[i].upgrades[j].card.id == this.card_id) {
                        card = player.characters[i].upgrades[j].card;
                        player.characters[i].upgrades.splice(j, 1);
                        break;
                    }
                }
            }
            if (card) break;

            for (let i = 0; i < player.supports.length; ++i) {
                if (player.supports[i].card.id == this.card_id) {
                    card = player.supports[i].card;
                    player.supports.splice(i, 1);
                    break;
                }   
            }
            if (card) {
                break;   
            }
        }
        if (card) {
            this.destination.PutCardAtDestination(card, state);
        } else {
            throw new Error('Couldn\'t find card');
        }
    }
}

export class DrawCard implements Operation {
    constructor(public readonly player_id: number){}
    str(): string { return `DrawCard ${this.player_id}`; }
    MutateState(state: GameState) {
        let p = state.player[this.player_id];
        p.hand.push(p.draw_deck.pop());
    }
}