/// <reference path="./cards.ts" />
/// <reference path="./game.ts" />
import cards = require('./cards');
import game = require('./game');

let code_to_actions: { [code: string]: (card: cards.Card, player: game.Player, opp: game.Player) => game.TurnAction[]; } = {};

if (code_to_actions == {}) {
    code_to_actions["01157"] = TakeCover;
}

export function GetEventActions(card: cards.Card, player: game.Player, opponent: game.Player): game.TurnAction[] {
    try {
        return code_to_actions[card.code](card, player, opponent);
    } catch (e) {
        console.log('unimplemented event ' + card.code);
        return [];
    }
}

function CanGiveCharacterShield(character: game.Character) {
    return (character.shields < 3);
}

function TakeCover(card: cards.Card, player: game.Player, opp: game.Player): game.TurnAction[] {
    let out: game.TurnAction[] = [];
    for (let c of player.characters) {
        if (CanGiveCharacterShield(c)) {
            out.push(new game.PlayEventOnCard(card, c));
        }
    }
    return out;
}