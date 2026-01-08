import type { GameState, Card } from '../../../types';

/**
 * Модуль системы ходов
 * Управляет приоритетами атаки, кнопками Бито и Пас
 * Разная логика для 2, 3 и 4+ игроков
 */

/**
 * Проверяет, может ли игрок атаковать
 */
export const canPlayerAttack = (
    gameState: GameState,
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined
): boolean => {
    if (!playerRole || (playerRole !== 'attacker' && playerRole !== 'co-attacker')) {
        return false;
    }

    // Проверяем приоритет атаки
    if (playerRole === 'attacker' && gameState.attackPriority === 'co-attacker') {
        return false;
    }
    if (playerRole === 'co-attacker' && gameState.attackPriority === 'attacker') {
        return false;
    }

    // Со-атакующий может играть только после того, как главный атакующий подкинул карту
    if (playerRole === 'co-attacker' && !gameState.mainAttackerHasPlayed) {
        return false;
    }

    // Проверяем, не нажал ли игрок уже "Пас"
    if (playerRole === 'attacker' && gameState.attackerPassed) {
        return false;
    }
    if (playerRole === 'co-attacker' && gameState.coAttackerPassed) {
        return false;
    }

    return true;
};

/**
 * Проверяет, может ли игрок защищаться
 */
export const canPlayerDefend = (
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined
): boolean => {
    return playerRole === 'defender';
};

/**
 * Проверяет наличие неотбитых карт на столе
 */
export const hasUnbeatenCards = (
    gameState: GameState,
    defenseCards: (Card | null)[]
): boolean => {
    const attackCards = gameState.slots || [];
    return attackCards.some((attackCard, index) => {
        if (!attackCard) return false;
        const defenseCard = defenseCards[index];
        return defenseCard === null;
    });
};

/**
 * Проверяет, можно ли нажать кнопку "Бито"
 * 
 * Для 2 игроков: Бито = конец хода (если подкинул хотя бы 1 карту и все карты отбиты)
 * Для 3+ игроков: Бито = передача приоритета (если подкинул карту, все отбиты, не нажат Пас)
 */
export const canPressBito = (
    gameState: GameState,
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined,
    hasUnbeatenCardsFn: () => boolean
): boolean => {
    // Только атакующие игроки могут нажимать Бито
    if (!playerRole || (playerRole !== 'attacker' && playerRole !== 'co-attacker')) {
        return false;
    }

    const playerCount = Object.keys(gameState.players || {}).length;

    // Главный атакующий должен сначала подкинуть хотя бы одну карту
    if (!gameState.mainAttackerHasPlayed) {
        return false;
    }

    // Нельзя нажимать Бито пока есть неотбитые карты на столе
    if (hasUnbeatenCardsFn()) {
        return false;
    }

    // ДЛЯ 2 ИГРОКОВ
    if (playerCount === 2) {
        // Только атакующий может нажать Бито (защитника нет в роли co-attacker)
        if (playerRole !== 'attacker') {
            return false;
        }
        // Можно нажать если подкинул карту и все отбиты
        return true;
    }

    // ДЛЯ 3+ ИГРОКОВ
    // Нельзя нажимать Бито, если уже нажал Пас
    if (playerRole === 'attacker' && gameState.attackerPassed) {
        return false;
    }
    if (playerRole === 'co-attacker' && gameState.coAttackerPassed) {
        return false;
    }

    // Проверяем, не заблокирована ли кнопка для текущего игрока
    if (playerRole === 'attacker' && gameState.attackerBitoPressed) {
        return false;
    }
    if (playerRole === 'co-attacker' && gameState.coAttackerBitoPressed) {
        return false;
    }

    return true;
};

/**
 * Проверяет, можно ли нажать кнопку "Пас"
 * 
 * Пас доступен только для 3+ игроков, после того как игрок нажал Бито хотя бы раз
 */
export const canPressPas = (
    gameState: GameState,
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined
): boolean => {
    // Только атакующие игроки могут нажимать Пас
    if (!playerRole || (playerRole !== 'attacker' && playerRole !== 'co-attacker')) {
        return false;
    }

    const playerCount = Object.keys(gameState.players || {}).length;

    // Пас только для 3+ игроков
    if (playerCount < 3) {
        return false;
    }

    // Проверяем, не нажат ли уже Пас
    if (playerRole === 'attacker' && gameState.attackerPassed) {
        return false;
    }
    if (playerRole === 'co-attacker' && gameState.coAttackerPassed) {
        return false;
    }

    // Пас доступен только после того, как игрок нажал Бито хотя бы раз
    if (playerRole === 'attacker' && !gameState.attackerBitoPressed) {
        return false;
    }
    if (playerRole === 'co-attacker' && !gameState.coAttackerBitoPressed) {
        return false;
    }

    return true;
};

/**
 * Обработка кнопки "Бито"
 * 
 * Для 2 игроков: завершает ход и меняет роли (атакующий ↔ защитник)
 * Для 3+ игроков: передает приоритет между атакующим и со-атакующим
 */
export const handleBito = (
    gameState: GameState,
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined,
    hasUnbeatenCardsFn: () => boolean
): { newState: GameState; endTurn: boolean } | null => {
    if (!canPressBito(gameState, playerRole, hasUnbeatenCardsFn)) {
        console.log('❌ Нельзя нажать Бито в данный момент');
        return null;
    }

    const playerCount = Object.keys(gameState.players || {}).length;

    // ДЛЯ 2 ИГРОКОВ: Бито = конец хода
    if (playerCount === 2) {
        console.log('✅ Бито нажато (2 игрока) - ход завершается');
        return {
            newState: gameState,
            endTurn: true, // Флаг для завершения хода
        };
    }

    // ДЛЯ 3+ ИГРОКОВ: Бито = передача приоритета
    const newPriority = gameState.attackPriority === 'attacker' ? 'co-attacker' : 'attacker';

    const updates: Partial<GameState> = {
        attackPriority: newPriority,
    };

    if (playerRole === 'attacker') {
        updates.attackerBitoPressed = true;
        updates.coAttackerBitoPressed = false;
        console.log('✅ Главный атакующий нажал Бито, приоритет передан со-атакующему');
    } else if (playerRole === 'co-attacker') {
        updates.coAttackerBitoPressed = true;
        updates.attackerBitoPressed = false;
        console.log('✅ Со-атакующий нажал Бито, приоритет передан главному атакующему');
    }

    return {
        newState: {
            ...gameState,
            ...updates,
        },
        endTurn: false,
    };
};

/**
 * Обработка кнопки "Пас"
 * 
 * Устанавливает флаг, что игрок больше не будет подкидывать карты
 * Если оба атакующих нажали Пас, ход завершается
 */
export const handlePas = (
    gameState: GameState,
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined
): { newState: GameState; endTurn: boolean } | null => {
    if (!canPressPas(gameState, playerRole)) {
        console.log('❌ Нельзя нажать Пас в данный момент');
        return null;
    }

    const updates: Partial<GameState> = {};

    if (playerRole === 'attacker') {
        updates.attackerPassed = true;
        console.log('✅ Главный атакующий нажал Пас');
        
        // Если со-атакующий тоже нажал Пас, ход завершается
        if (gameState.coAttackerPassed) {
            console.log('🎯 Оба атакующих нажали Пас - ход завершается');
            return {
                newState: { ...gameState, ...updates },
                endTurn: true,
            };
        }
    } else if (playerRole === 'co-attacker') {
        updates.coAttackerPassed = true;
        console.log('✅ Со-атакующий нажал Пас');
        
        // Если атакующий тоже нажал Пас, ход завершается
        if (gameState.attackerPassed) {
            console.log('🎯 Оба атакующих нажали Пас - ход завершается');
            return {
                newState: { ...gameState, ...updates },
                endTurn: true,
            };
        }
    }

    return {
        newState: { ...gameState, ...updates },
        endTurn: false,
    };
};

/**
 * Завершает ход: очищает стол, меняет роли, добавляет игроков в очередь добора
 * 
 * Для 2 игроков: атакующий ↔ защитник
 * Для 3 игроков: атакующий → со-атакующий, защитник → атакующий, со-атакующий → защитник
 * Для 4+ игроков: атакующий → наблюдатель, защитник → атакующий, со-атакующий → защитник, след. → со-атакующий
 */
export const completeTurn = (
    gameState: GameState,
    rotateRoles: (prev: GameState) => Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'>,
    processDrawQueue: (gameState: GameState) => { hands: GameState["hands"]; deck: Card[] }
): GameState => {
    console.log('🎯 Завершение хода...');
    
    const newState = { ...gameState };
    
    // Очищаем стол
    newState.slots = new Array(6).fill(null);
    newState.defenseSlots = new Array(6).fill(null);
    
    // Сбрасываем состояния кнопок и приоритетов
    newState.attackPriority = 'attacker';
    newState.mainAttackerHasPlayed = false;
    newState.attackerPassed = false;
    newState.coAttackerPassed = false;
    newState.attackerBitoPressed = false;
    newState.coAttackerBitoPressed = false;
    newState.attackerPasPressed = false;
    newState.coAttackerPasPressed = false;
    
    // Сбрасываем фракции
    newState.factionCounter = {};
    newState.activeFirstAttackFactions = [];
    newState.usedDefenseCardFactions = {};
    newState.displayActiveFactions = [];
    newState.defenseFactionsBuffer = {};
    
    // Меняем роли
    const newRoles = rotateRoles(newState);
    if (Object.keys(newRoles).length > 0) {
        newState.playerRoles = { ...gameState.playerRoles, ...newRoles };
    }
    
    // Добавляем всех игроков в очередь добора до 6 карт
    const playerIds = Object.keys(gameState.players || {});
    newState.drawQueue = [...playerIds];
    
    // Обрабатываем очередь добора карт
    const { hands: updatedHands, deck: updatedDeck } = processDrawQueue(newState);
    newState.hands = updatedHands;
    newState.deck = updatedDeck;
    
    console.log('✅ Ход завершен, роли обновлены, карты добраны');
    
    return newState;
};

/**
 * Проверяет, завершился ли ход
 */
export const checkTurnComplete = (
    gameState: GameState,
    defenseCards: (Card | null)[]
): boolean => {
    const playerCount = Object.keys(gameState.players || {}).length;
    
    // Проверяем, что все карты отбиты
    const allDefended = !hasUnbeatenCards(gameState, defenseCards);
    
    if (!allDefended) {
        return false;
    }
    
    // Для 2 игроков: не используется (Бито сразу завершает ход)
    if (playerCount === 2) {
        return false;
    }
    
    // Для 3+ игроков: проверяем, что оба атакующих нажали Пас
    const bothPassed = gameState.attackerPassed && gameState.coAttackerPassed;
    
    return bothPassed;
};
