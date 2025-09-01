export interface Card {
    id: number;
    name: string;
    power: number;
    factions: number[];
    image: string;
}

export type PlayersMap = Record<string, { name: string }>; // playerId -> profile

export interface GameState {
    phase: "lobby" | "playing" | "gameover";
    hostId?: string; // first player who joined (simplest host logic)
    players: PlayersMap; // all known players (by our own shared-state registry)
    hands: Record<string, Card[]>; // playerId -> hand (cards)
    slots: (Card | null)[]; // center slots (length equals number of players at start)
    playerCountAtStart?: number; // fixed at start
    winnerId?: string; // set when someone collects all cards
    startedAt?: number;
    
    // Turn system
    currentTurn?: string; // playerId whose turn it is
    turnOrder?: string[]; // order of players for turns
    currentTurnIndex?: number; // index in turnOrder
    
    // Game mechanics
    attackingCard?: Card | null; // card that is currently attacking
    defendingCard?: Card | null; // card that is defending
    attackTarget?: string; // playerId being attacked
    canPass?: boolean; // whether current player can pass
    canTakeCards?: boolean; // whether current player can take cards
    
    // Card draw system
    deck: Card[]; // remaining cards in deck
    discardPile: Card[]; // discarded cards
    maxHandSize: number; // maximum cards in hand
    cardsDrawnThisTurn: Record<string, number>; // cards drawn by each player this turn
    canDrawCards: boolean; // whether current player can draw cards
    
    // Faction system
    availableTargets: string[]; // playerIds that can be targeted
    factionBonuses: Record<number, number>; // faction -> bonus power
    targetSelectionMode: boolean; // whether player is selecting attack target
    selectedTarget?: string; // currently selected target for attack
    factionEffects: Record<number, string[]>; // faction -> list of effect descriptions
}
