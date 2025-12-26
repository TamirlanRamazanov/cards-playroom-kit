import { create } from 'zustand';
import type { GameState } from '../types';

interface GameStore {
    game: GameState;
    setGame: (game: GameState) => void;
    updateGame: (fn: (prev: GameState) => GameState) => void;
    reset: () => void;
}

const initialGameState: GameState = {
    phase: "lobby",
    hostId: undefined,
    players: {},
    hands: {},
    slots: [],
    defenseSlots: [],
    playerCountAtStart: undefined,
    winnerId: undefined,
    startedAt: undefined,
    // Card draw system
    deck: [],
    discardPile: [],
    maxHandSize: 6,
    cardsDrawnThisTurn: {},
    canDrawCards: true,
    // Faction system
    availableTargets: [],
    factionBonuses: {},
    targetSelectionMode: false,
    selectedTarget: undefined,
    factionEffects: {},
    activeFactions: [],
    // Card power system
    minCardPower: 50,
    maxCardPower: 100,
    canDefendWithEqualPower: true,
    // Turn control system
    turnActions: {
        canEndTurn: false,
        canPass: false,
        canTakeCards: false,
        canAttack: false,
        canDefend: false,
    },
    turnHistory: [],
    // Role system defaults
    playerRoles: {},
    attackPriority: 'attacker',
    mainAttackerHasPlayed: false,
    attackerPassed: false,
    coAttackerPassed: false,
    attackerBitoPressed: false,
    coAttackerBitoPressed: false,
    attackerPasPressed: false,
    coAttackerPasPressed: false,
    // Draw queue
    drawQueue: [],
    // Game initialization
    gameInitialized: false,
};

export const useGameStore = create<GameStore>((set) => ({
    game: initialGameState,
    setGame: (game) => set({ game }),
    updateGame: (fn) => set((state) => ({ game: fn(state.game) })),
    reset: () => set({ game: initialGameState }),
}));

