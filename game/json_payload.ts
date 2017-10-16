import { Card } from './cards';
import { Character, Support } from './game';
import { autoserialize } from 'cerialize';

export interface Chat {
    text: string,
    name: string
}

export interface ClientGameState {
    player: UserPlayer;
    opp: OppPlayer;
    player_active: boolean;
}

type ActionName =
    "PlayEventOnCard" |
    "PlayEventOnPlayer" |
    "InstallUpgrade" |
    "InstallSupport" |
    "Activate" |
    "Resolve" |
    "Discard" |
    "UseCardAction" |
    "ClaimBattlefield" |
    "Pass" |
    "RoundReset";

export class SerializedTurnAction {
    @autoserialize action: string;
    @autoserialize card_id?: number;
    @autoserialize target?: number;
    constructor(action: ActionName, card_id?: number, target?: number) {
        this.action = action;
        this.card_id = card_id;
        this.target = target;
    }
}

export class ModalSelection {
    @autoserialize public content_id: string;
    @autoserialize public choice: SerializedTurnAction;
    constructor(content_id: string, choice: SerializedTurnAction) {
        this.content_id = content_id;
        this.choice = choice;
    }
}

export interface UserPlayer {
    hand: Card[];
    draw_deck_size: number;
    discard_pile: Card[];
    out_pile: Card[];
    characters: Character[];
    supports: Support[];
    resources: number;
}

export interface OppPlayer {
    hand_size: number;
    draw_deck_size: number;
    discard_pile: Card[];
    out_pile: Card[];
    characters: Character[];
    supports: Support[];
    resources: number;
}

export interface ModalOption {
    card_id: number;
    option_idx: number;
    sta: SerializedTurnAction;
    text: string;
};

export interface Modal {
    id: string;
    title: string;
    text: string | SerializedTurnAction;
    options?: ModalOption[];
}
