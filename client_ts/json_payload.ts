import cards = require('../game/cards');
import game = require('../game/game');

interface ModalOption {
  text: string;
  option_idx: number;
  card_id: number;
}

export interface Modal {
  id: string;
  title: string;
  text: string;
  options?: ModalOption[];
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

export interface UserPlayer {
  hand: cards.Card[];
  draw_deck_size: number;
  discard_pile: cards.Card[];
  out_pile: cards.Card[];
  characters: game.Character[];
  supports: game.Support[];
  resources: number;
}

export interface OppPlayer {
  hand_size: number;
  draw_deck_size: number;
  discard_pile: cards.Card[];
  out_pile: cards.Card[];
  characters: game.Character[];
  supports: game.Support[];
  resources: number;
}