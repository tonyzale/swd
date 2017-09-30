import { Card } from './cards';
import { Character, Support } from './game';

interface ModalOption {
    text: string;
    option_idx: number;
    card_id: number;
}

export interface Modal {
    id: string;
    title: string;
    text: string | SerializedTurnAction;
    options?: ModalOption[];
}

export interface ModalSelection {
    content_id: string;
    choice: SerializedTurnAction;
}

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

export interface SerializedTurnAction {
    action: ActionName;
    card_id?: number;
    target?: number;
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
