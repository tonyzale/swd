namespace destiny {
    class GameState {
        player: Player[] = [new Player('P1'), new Player('P2')];
        active_player: number;
    }
    
    class Player {
        constructor(public readonly name: string){}
        hand: Card[];
        draw_deck: Card[];
        discard_pile: Card[];
        characters: Character[];
        supports: Support[];
        resources: number;
    }
    
    class InPlay {
        exhausted: boolean;
    }
    
    class Character extends InPlay {
        card: Card;
        damage: number;
        upgrades: Card[];
    }
    
    class Support extends InPlay {
        card: Card;
    }
    
    class Card {
        name: string;
    }
    
    class EventCard extends Card {
        
    }
    
    class SupportCard extends Card {
        
    }
    
    class CharacterCard extends Card {
        
    }
    
    class Die {
        constructor(public readonly die_sides: DieSide[]){
            if (die_sides.length != 6) throw new RangeError();
        }
    }
    
    enum SideType {
        Melee = 0,
        Ranged,
        Shield,
        Resource,
        Disrupt,
        Discard,
        Focus,
        Special,
        Blank
    }
        
    class DieSide {
        constructor(public readonly type: SideType){}
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
}