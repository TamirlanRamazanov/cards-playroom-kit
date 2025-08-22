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
}
