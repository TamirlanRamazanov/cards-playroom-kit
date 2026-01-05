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
 * Обработка кнопки "Бито" (передача приоритета между атакующими)
 */
export const handleBito = (
    gameState: GameState,
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined,
    hasUnbeatenCardsFn: () => boolean
): GameState | null => {
    if (!playerRole || (playerRole !== 'attacker' && playerRole !== 'co-attacker')) {
        alert('❌ Только атакующие игроки могут нажимать Бито');
        return null;
    }

    if (!gameState.mainAttackerHasPlayed) {
        alert('❌ Главный атакующий должен сначала подкинуть хотя бы одну карту');
        return null;
    }

    // Проверяем, есть ли неотбитые карты на столе
    if (hasUnbeatenCardsFn()) {
        alert('❌ Нельзя нажимать Бито пока есть неотбитые карты на столе');
        return null;
    }

    // Проверяем, не заблокирована ли кнопка
    if (playerRole === 'attacker' && gameState.attackerBitoPressed) {
        return null;
    }
    if (playerRole === 'co-attacker' && gameState.coAttackerBitoPressed) {
        return null;
    }

    // Обычная логика передачи приоритета
    const newPriority = gameState.attackPriority === 'attacker' ? 'co-attacker' : 'attacker';

    // Блокируем кнопку Бито для текущего игрока и разблокируем для другого
    const updates: Partial<GameState> = {
        attackPriority: newPriority,
    };

    if (playerRole === 'attacker') {
        updates.attackerBitoPressed = true;
        updates.coAttackerBitoPressed = false;
    } else if (playerRole === 'co-attacker') {
        updates.coAttackerBitoPressed = true;
        updates.attackerBitoPressed = false;
    }

    return {
        ...gameState,
        ...updates,
    };
};

