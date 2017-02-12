enum Faction {
    red,
    blue,
    yellow,
    gray
};

enum Affiliation {
    hero,
    villain,
    neutral
};

enum CardType {
    Character,
    Upgrade,
    Support,
    Event,
    Battlefield
}

enum CardSubType {
    None,
    Weapon,
    Equipment,
    Vehicle,
    Droid,
    Ability,
}

export class Card {
    constructor(public readonly json: any) {
        this.name = json['name'];
        this.code = json['code'];
        switch (json['faction_code']) {
            case 'red':
                this.faction = Faction.red;
                break;
            case 'blue':
                this.faction = Faction.blue;
                break;
            case 'yellow':
                this.faction = Faction.yellow;
                break;
            case 'gray':
                this.faction = Faction.gray;
                break;
            default:
                throw new RangeError('unknown faction');
        }
        switch (json['type_code']) {
            case 'character':
                this.type = CardType.Character;
                break;
            case 'upgrade':
                this.type = CardType.Upgrade;
                break;
            case 'support':
                this.type = CardType.Support;
                break;
            case 'event':
                this.type = CardType.Event;
                break;
            case 'battlefield':
                this.type = CardType.Battlefield;
                break;
            default:
                throw new RangeError('unknown card type');
        }
        switch (json['affiliation_code']) {
            case 'hero':
                this.affiliation = Affiliation.hero;
                break;
            case 'villain':
                this.affiliation = Affiliation.villain;
                break;
            case 'neutral':
                this.affiliation = Affiliation.neutral;
                break;
            default:
                throw new RangeError('unknown affiliation');
        }
        switch (json['subtype_code']) {
            case undefined:
                this.subtype = CardSubType.None;
                break;
            case 'weapon':
                this.subtype = CardSubType.Weapon;
                break;
            case 'ability':
                this.subtype = CardSubType.Ability;
                break;
            case 'equipment':
                this.subtype = CardSubType.Equipment;
                break;
            case 'droid':
                this.subtype = CardSubType.Droid;
                break;
            case 'vehicle':
                this.subtype = CardSubType.Vehicle;
                break;
            default:
                throw new RangeError('unknown subtype');
        }
        this.die = (json['has_die'] ? new Die(json["sides"]) : undefined);
        this.cost = ((typeof json['cost'] === 'number') ? json['cost'] : undefined);
        this.is_unique = json['is_unique'];
    }
    public readonly name: string;
    public readonly code: string;
    public readonly faction: Faction;
    public readonly affiliation: Affiliation;
    public readonly type: CardType;
    public readonly subtype: CardSubType;
    public readonly die: Die;
    public readonly cost: number;
    public readonly is_unique: boolean;
}

export class Die {
    constructor(public readonly die_json: any){}
}

enum SideType {
    Melee,
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
    constructor(public readonly type: SideType, public readonly is_modifier: boolean, public readonly resource_cost: number){}
}
