import type { GameState } from '../../../types';

/**
 * Модуль системы ходов
 * Управляет приоритетами атаки, кнопками Бито и Пас
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
    defenseCards: (import('../../../types').Card | null)[]
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

    // Для 2 игроков Бито не показываем (только Пас)
    const playerCount = Object.keys(gameState.players || {}).length;
    if (playerCount === 2) {
        return false;
    }

    // Нельзя нажимать Бито, если кто-то уже нажал Пас
    if (gameState.attackerPassed || gameState.coAttackerPassed) {
        return false;
    }

    // Главный атакующий должен сначала подкинуть хотя бы одну карту
    if (!gameState.mainAttackerHasPlayed) {
        return false;
    }

    // Нельзя нажимать Бито пока есть неотбитые карты на столе
    if (hasUnbeatenCardsFn()) {
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
 * Обработка кнопки "Бито" (передача приоритета между атакующими)
 * 
 * Логика:
 * 1. Атакующий нажимает Бито -> приоритет переходит к со-атакующему
 * 2. Со-атакующий нажимает Бито -> приоритет возвращается к атакующему
 * 3. Если оба нажали Бито, то защитник может взять карты или ход завершается
 */
export const handleBito = (
    gameState: GameState,
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined,
    hasUnbeatenCardsFn: () => boolean
): GameState | null => {
    if (!canPressBito(gameState, playerRole, hasUnbeatenCardsFn)) {
        console.log('❌ Нельзя нажать Бито в данный момент');
        return null;
    }

    // Логика передачи приоритета
    const newPriority = gameState.attackPriority === 'attacker' ? 'co-attacker' : 'attacker';

    // Блокируем кнопку Бито для текущего игрока и разблокируем для другого
    const updates: Partial<GameState> = {
        attackPriority: newPriority,
    };

    if (playerRole === 'attacker') {
        updates.attackerBitoPressed = true;
        updates.coAttackerBitoPressed = false;
        console.log('✅ Главный атакующий нажал Бито, приоритет передан со-атакующему');
        
        // Если со-атакующий уже нажал Бито ранее, то оба отказались атаковать
        if (gameState.coAttackerBitoPressed) {
            console.log('🎯 Оба атакующих нажали Бито - ход завершается');
        }
    } else if (playerRole === 'co-attacker') {
        updates.coAttackerBitoPressed = true;
        updates.attackerBitoPressed = false;
        console.log('✅ Со-атакующий нажал Бито, приоритет передан главному атакующему');
        
        // Если главный атакующий уже нажал Бито ранее, то оба отказались атаковать
        if (gameState.attackerBitoPressed) {
            console.log('🎯 Оба атакующих нажали Бито - ход завершается');
        }
    }

    return {
        ...gameState,
        ...updates,
    };
};

/**
 * Проверяет, завершился ли ход (оба атакующих нажали Бито)
 */
export const checkTurnComplete = (
    gameState: GameState,
    defenseCards: (import('../../../types').Card | null)[]
): boolean => {
    // Проверяем, что все карты отбиты
    const allDefended = !hasUnbeatenCards(gameState, defenseCards);
    
    // Проверяем, что оба атакующих нажали Бито
    const bothBitoPressed = gameState.attackerBitoPressed && gameState.coAttackerBitoPressed;
    
    return allDefended && bothBitoPressed;
};

