import { useRef, useEffect } from 'react';
import { useMultiplayerState } from 'playroomkit';
import type { GameState } from '../../../types';

const INITIAL_GAME_STATE: GameState = {
    phase: "lobby",
    hostId: undefined,
    players: {},
    hands: {},
    slots: [null, null, null, null, null, null],
    defenseSlots: [null, null, null, null, null, null],
    playerCountAtStart: undefined,
    winnerId: undefined,
    startedAt: undefined,
    deck: [],
    discardPile: [],
    maxHandSize: 6,
    cardsDrawnThisTurn: {},
    canDrawCards: true,
    availableTargets: [],
    factionBonuses: {},
    targetSelectionMode: false,
    selectedTarget: undefined,
    factionEffects: {},
    activeFactions: [],
    factionCounter: {},
    activeFirstAttackFactions: [],
    usedDefenseCardFactions: {},
    displayActiveFactions: [],
    defenseFactionsBuffer: {},
    minCardPower: 50,
    maxCardPower: 100,
    canDefendWithEqualPower: true,
    turnActions: {
        canEndTurn: false,
        canPass: false,
        canTakeCards: false,
        canAttack: false,
        canDefend: false,
    },
    turnHistory: [],
    playerRoles: {},
    attackPriority: 'attacker',
    mainAttackerHasPlayed: false,
    attackerPassed: false,
    coAttackerPassed: false,
    attackerBitoPressed: false,
    coAttackerBitoPressed: false,
    attackerPasPressed: false,
    coAttackerPasPressed: false,
    drawQueue: [],
    gameInitialized: false,
};

/**
 * Хук для управления состоянием игры через PlayroomKit
 * 
 * Предоставляет:
 * - gameState - текущее состояние игры
 * - updateGame - функция для атомарных обновлений
 * - playroomGameRef - ref для получения актуального состояния
 */
export const useGameState = () => {
    const [playroomGame, setPlayroomGame] = useMultiplayerState<GameState>("gameV3", INITIAL_GAME_STATE);
    
    // Ref для хранения актуального состояния (для атомарных обновлений)
    const playroomGameRef = useRef<GameState>(playroomGame || INITIAL_GAME_STATE);
    
    // Синхронизируем ref с playroomGame при каждом обновлении
    useEffect(() => {
        if (playroomGame) {
            playroomGameRef.current = playroomGame;
        }
    }, [playroomGame]);
    
    // Функция-обновлятель для атомарных обновлений
    const updateGame = (fn: (prev: GameState) => GameState) => {
        const prev = playroomGameRef.current;
        const newState = fn(prev);
        
        // Обновляем ref сразу
        playroomGameRef.current = newState;
        
        // Обновляем PlayroomKit
        setPlayroomGame(newState);
    };
    
    const gameState = playroomGame || INITIAL_GAME_STATE;
    
    return {
        gameState,
        updateGame,
        playroomGameRef,
    };
};

