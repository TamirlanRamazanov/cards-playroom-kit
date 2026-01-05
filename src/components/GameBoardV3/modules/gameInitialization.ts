import type { GameState } from '../../../types';
import { CARDS_DATA } from '../../../engine/cards';
import { SeededRandom } from '../utils/SeededRandom';
import { determineFirstPlayer, assignPlayerRoles } from './roleSystem';

/**
 * Модуль инициализации игры
 * Управляет созданием и рестартом игры
 */

/**
 * Создает новую игру: раздает карты, определяет первого игрока, назначает роли
 */
export const createGame = (
    gameState: GameState,
    _myId: string
): GameState | null => {
    const playerIds = Object.keys(gameState.players || {});
    if (playerIds.length === 0) {
        alert('❌ Нет игроков для создания игры!');
        return null;
    }

    const random = new SeededRandom(Date.now());
    const shuffledDeck = random.shuffle([...CARDS_DATA]);

    const hands: GameState["hands"] = {};
    const turnOrder: string[] = [];

    // Раздаем карты всем игрокам
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        const playerCards = shuffledDeck.splice(0, 6);
        hands[playerId] = playerCards;
        turnOrder.push(playerId);
    }

    // Определяем первого игрока (самая слабая карта)
    const weakestPlayer = determineFirstPlayer(playerIds, hands, gameState.players || {});

    // Назначаем роли игрокам
    const roles = assignPlayerRoles(playerIds, weakestPlayer.playerId);

    console.log(`🎯 Распределение ролей для ${playerIds.length} игроков:`, roles);
    console.log(`🎯 Первый игрок: ${weakestPlayer.playerName} (${weakestPlayer.cardName}, сила: ${weakestPlayer.power})`);

    const newGameState: GameState = {
        ...gameState,
        phase: "playing",
        hands,
        slots: [null, null, null, null, null, null],
        defenseSlots: [null, null, null, null, null, null],
        deck: shuffledDeck,
        discardPile: [],
        playerCountAtStart: playerIds.length,
        startedAt: Date.now(),
        currentTurn: weakestPlayer.playerId,
        turnOrder,
        currentTurnIndex: turnOrder.indexOf(weakestPlayer.playerId),
        turnPhase: "play",
        gameInitialized: true,
        playerRoles: roles,
        mainAttackerHasPlayed: false,
        attackerPassed: false,
        coAttackerPassed: false,
        attackerBitoPressed: false,
        coAttackerBitoPressed: false,
        attackerPasPressed: false,
        coAttackerPasPressed: false,
        attackPriority: 'attacker',
        drawQueue: [],
    };

    return newGameState;
};

/**
 * Рестарт игры (сохраняет игроков и хоста)
 */
export const restartGame = (
    gameState: GameState,
    myId: string
): GameState => {
    return {
        ...gameState,
        phase: "lobby",
        // Сохраняем игроков и хоста при рестарте
        players: { ...gameState.players },
        hostId: gameState.hostId || myId,
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
        firstPlayerInfo: undefined,
    };
};

