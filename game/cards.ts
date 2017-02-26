export enum Faction {
    red,
    blue,
    yellow,
    gray
};

export enum Affiliation {
    hero,
    villain,
    neutral
};

export enum CardType {
    Character,
    Upgrade,
    Support,
    Event,
    Battlefield
}

export enum CardSubType {
    None,
    Weapon,
    Equipment,
    Vehicle,
    Droid,
    Ability,
}

export class Card {
    constructor(public readonly json: any) {
        this.id = Card.card_count;
        ++Card.card_count;
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
    DebugString(): string {
        return `${this.name} - ${CardType[this.type]} - ${this.code} ${(this.die ? ('- ' + this.die.DebugString()) : '')}`;
    }
    MakeCopy(): Card {
        return new Card(this.json);
    }
    static card_count: number = 0;
    public readonly id: number;
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
    constructor(public readonly json: any) {
        this.sides = [];
        for (let side of json) {
            if (this.SideHelper(side, 'MD', SideType.Melee)) continue;
            if (this.SideHelper(side, 'RD', SideType.Ranged)) continue;
            if (this.SideHelper(side, 'Sh', SideType.Shield)) continue;
            if (this.SideHelper(side, 'Dr', SideType.Disrupt)) continue;
            if (this.SideHelper(side, 'Dc', SideType.Discard)) continue;
            if (this.SideHelper(side, 'Sp', SideType.Special)) continue;
            if (this.SideHelper(side, 'R', SideType.Resource)) continue;
            if (this.SideHelper(side, 'F', SideType.Focus)) continue;
            if (side == '-') {
                this.sides.push(new DieSide(SideType.Blank, 0, false, 0));
                continue;
            }
            throw new RangeError('Unknown Die Side');
        }
    }
    MakeCopy(): Die { 
        return new Die(this.json);
    }
    DebugString(): string {
        let out = '';
        for (let side of this.sides) {
            out += side.DebugString() + ' ';
        }
        return out;
    }
    private SideHelper(side: string, code: string, enum_val: SideType): boolean {
        let split = side.split(code);
        if (split.length == 1) return false;
        let val_str = split[0];
        let mod = (val_str[0] == '+');
        let val = Number(val_str);
        let cost = 0;
        if (split.length == 2) {
            cost = Number(split[1]);
        }
        
        this.sides.push(new DieSide(enum_val, val, mod, cost));
        return true;
    }
    public readonly sides: DieSide[];
}

export enum SideType {
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
    constructor(public readonly type: SideType, public readonly val: number, public readonly is_modifier: boolean, public readonly resource_cost: number){}
    DebugString(): string {
        return `[${(this.is_modifier ? '+':'')}${SideType[this.type]}${(this.val > 0) ? this.val : '' }${((this.resource_cost > 0) ? (' cost:' + this.resource_cost) : '')}]`;
    }
}
