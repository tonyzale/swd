/// <reference path="./cards.ts" />
/// <reference path="./game.ts" />
//import cards = require('./cards');
//import game = require('./game');
import { Card } from './cards';
import { Player, PlayEventOnCard, TurnAction, Character } from './game';

let code_to_actions: { [code: string]: (card: Card, player: Player, opp: Player) => TurnAction[]; } = {};

if (code_to_actions == {}) {
    code_to_actions["01157"] = TakeCover;
}

export function GetEventActions(card: Card, player: Player, opponent: Player): TurnAction[] {
    try {
        return code_to_actions[card.code](card, player, opponent);
    } catch (e) {
        console.log('unimplemented event ' + card.code);
        return [];
    }
}

function CanGiveCharacterShield(character: Character) {
    return (character.shields < 3);
}

function TakeCover(card: Card, player: Player, opp: Player): TurnAction[] {
    let out: TurnAction[] = [];
    for (let c of player.characters) {
        if (CanGiveCharacterShield(c)) {
            out.push(new PlayEventOnCard(card, c));
        }
    }
    return out;
}
