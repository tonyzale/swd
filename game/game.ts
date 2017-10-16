import { Card, CardType, CardId, Die, SideType } from './cards';
import { GetEventActions } from './events';
import { ClientGameState, SerializedTurnAction } from './json_payload';

export class CardDB {
    constructor(all_cards_json: any) {
        this.cards = [];
        this.cards_by_code = {};
        this.cards_by_full_name = {};
        for (let card of all_cards_json) {
            let new_card = new Card(card);
            this.cards.push(new_card);
            this.cards_by_code[new_card.code] = new_card;
            this.cards_by_full_name[new_card.full_name] = new_card;
        }
    }
    public readonly cards: Card[];
    public readonly cards_by_code: { [id: string]: Card };
    public readonly cards_by_full_name: { [id: string]: Card };
}
export class GameState {
    constructor(public p1: Player, public p2: Player) {
        this.player.push(p1);
        this.player.push(p2);
    }

    GetGameStateForPlayer(player_id: number): ClientGameState {
        let player = this.player.filter(p => { return p.id == player_id; })[0];
        let opp = this.player.filter(p => { return p.id != player_id; })[0];
        return {
            player: {
                hand: player.hand,
                draw_deck_size: player.draw_deck.length,
                discard_pile: player.discard_pile,
                out_pile: player.out_pile,
                characters: player.characters,
                supports: player.supports,
                resources: player.resources
            },
            opp: {
                hand_size: opp.hand.length,
                draw_deck_size: opp.draw_deck.length,
                discard_pile: opp.discard_pile,
                out_pile: opp.out_pile,
                characters: opp.characters,
                supports: opp.supports,
                resources: opp.resources
            },
            player_active: true
        };
    }

    GetAvailableActions(player_id: number): TurnAction[] {
        let active_player = this.player.filter(p => { return p.id == player_id; })[0];
        if (!active_player) return [];
        let opponent = this.player.filter(p => { return p.id != player_id; })[0];
        let out: TurnAction[] = [];
        for (let c of active_player.hand) {
            if (c.cost && c.cost > active_player.resources) continue;
            if (c.type == CardType.Event) {
                out = out.concat(GetEventActions(c, active_player, opponent));
            } else if (c.type == CardType.Upgrade) {
                for (let char of active_player.characters) {
                    out.push(new InstallUpgrade(c, char));
                }
            } else if (c.type == CardType.Support) {
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

    UpdateState(player_id: number, action: SerializedTurnAction) {
        let op: Operation | undefined = undefined;
        if (action.action == "Activate") {
            op = new ActivateCard(<number>action.card_id);
        } else if (action.action == "InstallUpgrade") {
            op = new MoveCard(<number>action.card_id,
                new NewUpgrade(player_id, <number>action.target));
        }
        if (!op) {
            console.log('No op');
            return;
        }
        op.MutateState(this);
    }

    DebugString(): string {
        return `round ${this.round} [${this.player[0].DebugString()}] [${this.player[1].DebugString()}]`;
    }
    player: Player[] = [];
    round: number = 0;
    active_player: number = 0;
}

function shuffle(array: any[]) {
    let i = 0
        , j = 0
        , temp = null

    for (i = array.length - 1; i > 0; i -= 1) {
        j = Math.floor(Math.random() * (i + 1))
        temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
}

export class Player {
    constructor(public readonly name: string, public readonly id: number, deck_text: string, card_db: CardDB) {
        let lines = deck_text.split('\n');
        for (let l of lines) {
            let split = l.split('(');
            if (split.length > 2) throw new Error('unexpected ( in line\n' + l);
            if (split.length == 2) {
                split = split[1].split(')');
                let card = card_db.cards_by_full_name[split[0]];
                if (card.type == CardType.Character) {
                    this.characters.push(new Character(card.MakeCopy(), l[0] == '2'));
                } else if (card.type == CardType.Support ||
                    card.type == CardType.Upgrade ||
                    card.type == CardType.Event) {
                    this.draw_deck.push(card.MakeCopy());
                    if (l[0] == '2') {
                        this.draw_deck.push(card.MakeCopy());
                    }
                } else if (card.type == CardType.Battlefield) {
                    this.battlefield = card.MakeCopy();
                } else {
                    throw new Error('unknown card type ' + card.DebugString());
                }
            }
        }
        shuffle(this.draw_deck);
        for (let i = 0; i < 5; ++i) {
            let card = this.draw_deck.pop();
            if (card) this.hand.push(card);
        }
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

    hand: Card[] = [];
    draw_deck: Card[] = [];
    discard_pile: Card[] = [];
    out_pile: Card[] = [];
    characters: Character[] = [];
    supports: Support[] = [];
    resources: number = 2;
    battlefield: Card;
}

export enum DieState {
    Ready,
    InPlay,
    Resolved,
    Unavailable
}

export enum CardState {
    Ready,
    Exhausted
}

export class PlayDie {
    constructor(public die: Die) {
    }
    DebugString(): string {
        if (this.state == DieState.InPlay) {
            return `die showing ${this.die.sides[this.active_face].DebugString()}`;
        } else {
            return `die ${DieState[this.state]}`;
        }
    }
    public state = DieState.Ready;
    public active_face: number = 0;
}

export class Upgrade {
    constructor(public readonly card: Card) {
        if (card.type != CardType.Upgrade) {
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
    constructor(public readonly card: Card, public readonly elite: boolean) {
        if (card.type != CardType.Character) {
            throw new RangeError('Not Character Card');
        }
        if (!card.die) {
            throw new RangeError('No die for character');
        }
        this.dice.push(new PlayDie(card.die));
        if (elite) {
            this.dice.push(new PlayDie(card.die));
        }
    }
    DebugString(): string {
        let out = `${this.card.name} damage: ${this.damage}`;
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

export class Support {
    constructor(public readonly card: Card) {
        if (this.card.type != CardType.Support) {
            throw new RangeError('Not Support Card');
        }
        if (!this.card.die) throw new RangeError('Card missing die');
        if (this.card.die) {
            this.dice.push(new PlayDie(this.card.die));
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
    constructor(public serialized: SerializedTurnAction) { }
}

export class PlayEventOnCard extends TurnAction {
    constructor(public card: Card, public target: Character | Upgrade | Support) { super({ action: 'PlayEventOnCard', card_id: card.id, target: target.card.id }); }
}

export class PlayEventOnPlayer extends TurnAction {
    constructor(public card: Card, public player_id: number) { super({ action: 'PlayEventOnPlayer', card_id: card.id, target: player_id }); }
}

export class InstallUpgrade extends TurnAction {
    constructor(public card: Card, public target: Character) { super({ action: 'InstallUpgrade', card_id: card.id, target: target.card.id }); }
}

export class InstallSupport extends TurnAction {
    constructor(public card: Card) { super({ action: 'InstallSupport', card_id: card.id }); }
}

export class Activate extends TurnAction {
    constructor(public target: Character | Support) {
        super({ action: 'Activate', card_id: target.card.id });
        this.card = target.card;
    }
    public card: Card;
}

export class Resolve extends TurnAction {
    constructor(public side_type: SideType) { super({ action: 'Resolve' }) }
}

export class Discard extends TurnAction {
    constructor(public card: Card) { super({ action: 'Discard', card_id: card.id }); }
}

export class UseCardAction extends TurnAction {
    constructor(public card: Card) { super({ action: 'UseCardAction', card_id: card.id }) }
}

export class ClaimBattlefield extends TurnAction {
    constructor() { super({ action: 'ClaimBattlefield' }); }
}

export class Pass extends TurnAction {
    constructor() { super({ action: 'Pass' }); }
}

export class RoundReset extends TurnAction {
    constructor() { super({ action: 'RoundReset' }); }
}


export interface Operation {
    str(): string;
    MutateState: (state: GameState) => void;
}

export interface Destination {
    str(): string;
    PutCardAtDestination: (card: Card, state: GameState) => void;
}

export class DiscardPile implements Destination {
    constructor(public readonly player_id: number) { }
    str(): string { return "DiscardPile " + this.player_id; }
    PutCardAtDestination(card: Card, state: GameState) {
        state.player[this.player_id].discard_pile.push(card);
    }
}

export class OutOfGame implements Destination {
    constructor(public readonly player_id: number) { }
    str(): string { return "OutOfGame"; }
    PutCardAtDestination(card: Card, state: GameState) {
        state.player[this.player_id].out_pile.push(card);
    }
}

export class NewCharacter implements Destination {
    constructor(public readonly player_id: number, public elite: boolean) { }
    str(): string { return `NewCharacter ${this.player_id}`; }
    PutCardAtDestination(card: Card, state: GameState) {
        state.player[this.player_id].characters.push(new Character(card, this.elite));
    }
}

export class NewUpgrade implements Destination {
    constructor(public readonly player_id: number, public readonly character_card_id: CardId) { }
    str(): string { return `NewUpgrade ${this.player_id} for ${this.character_card_id}`; }
    PutCardAtDestination(card: Card, state: GameState) {
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
    constructor(public readonly player_id: number) { }
    str(): string { return `NewSupport ${this.player_id}`; }
    PutCardAtDestination(card: Card, state: GameState) {
        state.player[this.player_id].supports.push(new Support(card));
    }
}

export class PlayerHand implements Destination {
    constructor(public readonly player_id: number) { }
    str(): string { return `PlayerHand ${this.player_id}`; }
    PutCardAtDestination(card: Card, state: GameState) {
        state.player[this.player_id].hand.push(card);
    }
}

export class BottomDrawPile implements Destination {
    constructor(public readonly player_id: number) { }
    str(): string { return `BottomDrawPile ${this.player_id}`; }
    PutCardAtDestination(card: Card, state: GameState) {
        state.player[this.player_id].draw_deck.splice(0, 0, card);
    }
}

function FindAndRemoveCard(target_card: CardId, card_array: Card[]): Card | undefined {
    for (let i = 0; i < card_array.length; ++i) {
        if (card_array[i].id == target_card) {
            return card_array.splice(i, 1)[0];
        }
    }
    return undefined;
}

export class MoveCard implements Operation {
    constructor(public readonly card_id: CardId, public readonly destination: Destination) { }
    str(): string { return `MoveCard ${this.card_id} to ${this.destination.str()}`; }
    MutateState(state: GameState) {
        let card: Card | undefined;
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
    constructor(public readonly player_id: number) { }
    str(): string { return `DrawCard ${this.player_id}`; }
    MutateState(state: GameState) {
        let p = state.player[this.player_id];
        let card = p.draw_deck.pop();
        if (!card) throw new Error('Trying to draw from empty deck');
        p.hand.push(card);
    }
}

function getRandomIntInclusive(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


export class ActivateCard implements Operation {
    constructor(public readonly card_id: CardId) { }
    str(): string { return 'Activate ${card_id}'; }
    MutateState(state: GameState) {
        for (let player of state.player) {
            for (let char of player.characters) {
                if (char.card.id === this.card_id) {
                    console.log('found char to activate');
                    char.state = CardState.Exhausted;
                    for (let die of char.dice) {
                        if (die.state === DieState.Ready) {
                            die.state = DieState.InPlay;
                            die.active_face = Math.floor(Math.random()) % 6;
                        }
                    }
                    for (let upgrade of char.upgrades) {
                        for (let die of upgrade.dice) {
                            die.state = DieState.InPlay;
                            die.active_face = Math.floor(Math.random()) % 6;
                        }
                    }
                    return;
                }
            }
        }
    }
}
