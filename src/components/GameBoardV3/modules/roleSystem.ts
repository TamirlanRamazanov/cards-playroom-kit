import type { GameState } from '../../../types';

/**
 * Модуль системы ролей
 * Управляет распределением и сменой ролей игроков
 */

export interface WeakestPlayer {
    playerId: string;
    playerName: string;
    cardName: string;
    power: number;
}

/**
 * Определяет первого игрока по самой слабой карте
 */
export const determineFirstPlayer = (
    playerIds: string[],
    hands: GameState["hands"],
    players: GameState["players"]
): WeakestPlayer => {
    let weakestPlayer: WeakestPlayer = {
        playerId: playerIds[0],
        playerName: players[playerIds[0]]?.name || playerIds[0],
        cardName: "",
        power: 999
    };

    playerIds.forEach(playerId => {
        const playerHand = hands[playerId] || [];
        if (playerHand.length > 0) {
            const weakestCard = playerHand.reduce((weakest, card) =>
                card.power < weakest.power ? card : weakest, playerHand[0]);
            if (weakestCard.power < weakestPlayer.power) {
                weakestPlayer = {
                    playerId,
                    playerName: players[playerId]?.name || playerId,
                    cardName: weakestCard.name,
                    power: weakestCard.power
                };
            }
        }
    });

    return weakestPlayer;
};

/**
 * Распределяет роли игрокам на основе первого игрока
 */
export const assignPlayerRoles = (
    playerIds: string[],
    firstPlayerId: string
): Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> => {
    const roles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
    const playerCount = playerIds.length;
    const firstPlayerIndex = playerIds.indexOf(firstPlayerId);

    // Назначаем роли по кругу от первого игрока
    playerIds.forEach((playerId, index) => {
        const relativeIndex = (index - firstPlayerIndex + playerIds.length) % playerIds.length;

        if (relativeIndex === 0) {
            roles[playerId] = 'attacker'; // Главный атакующий
        } else if (relativeIndex === 1) {
            roles[playerId] = 'defender'; // Защищающийся
        } else if (relativeIndex === 2 && playerCount >= 3) {
            roles[playerId] = 'co-attacker'; // Со-атакующий
        } else {
            // Для 4-6 игроков: остальные становятся наблюдателями
            roles[playerId] = 'observer'; // Наблюдающий
        }
    });

    return roles;
};

/**
 * Меняет роли после взятия карт защитником
 */
export const rotateRolesAfterTakeCards = (
    prev: GameState
): Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> => {
    const playerIds = Object.keys(prev.players || {});
    const playerCount = playerIds.length;
    const currentRoles = { ...prev.playerRoles };
    const newRoles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};

    if (playerCount === 2) {
        // 2 игрока: роли не меняются
        console.log('🎯 2 игрока - роли не меняются');
    } else if (playerCount === 3) {
        // 3 игрока: со-атакующий → главный атакующий, главный → защитник, защитник → со-атакующий
        const currentAttacker = playerIds.find(id => currentRoles[id] === 'attacker');
        const currentCoAttacker = playerIds.find(id => currentRoles[id] === 'co-attacker');
        const currentDefender = playerIds.find(id => currentRoles[id] === 'defender');

        if (currentAttacker && currentCoAttacker && currentDefender) {
            newRoles[currentCoAttacker] = 'attacker';
            newRoles[currentAttacker] = 'defender';
            newRoles[currentDefender] = 'co-attacker';
            console.log('🎯 3 игрока - роли сдвинуты на 1 назад');
        }
    } else if (playerCount >= 4) {
        // 4+ игроков: со-атакующий → главный атакующий, следующий → защитник, следующий → со-атакующий
        const currentAttacker = playerIds.find(id => currentRoles[id] === 'attacker');
        const currentCoAttacker = playerIds.find(id => currentRoles[id] === 'co-attacker');
        const currentDefender = playerIds.find(id => currentRoles[id] === 'defender');

        if (currentAttacker && currentCoAttacker && currentDefender) {
            const coAttackerIndex = playerIds.indexOf(currentCoAttacker);
            const nextAfterCoAttacker = playerIds[(coAttackerIndex + 1) % playerIds.length];
            const nextAfterNewDefender = playerIds[(playerIds.indexOf(nextAfterCoAttacker) + 1) % playerIds.length];

            newRoles[currentCoAttacker] = 'attacker';
            newRoles[nextAfterCoAttacker] = 'defender';
            newRoles[nextAfterNewDefender] = 'co-attacker';

            playerIds.forEach(id => {
                if (![currentCoAttacker, nextAfterCoAttacker, nextAfterNewDefender].includes(id)) {
                    newRoles[id] = 'observer';
                }
            });

            console.log('🎯 4+ игроков - роли сдвинуты');
        }
    }

    return newRoles;
};

/**
 * Меняет роли после успешной защиты (Бито)
 * 
 * Для 2 игроков: атакующий ↔ защитник
 * Для 3 игроков: атакующий → со-атакующий, защитник → атакующий, со-атакующий → защитник
 * Для 4+ игроков: атакующий → наблюдатель, защитник → атакующий, со-атакующий → защитник, следующий → со-атакующий
 */
export const rotateRolesAfterBito = (
    prev: GameState
): Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> => {
    const playerIds = Object.keys(prev.players || {});
    const playerCount = playerIds.length;
    const currentRoles = { ...prev.playerRoles };
    const newRoles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};

    if (playerCount === 2) {
        // 2 игрока: атакующий ↔ защитник
        const currentAttacker = playerIds.find(id => currentRoles[id] === 'attacker');
        const currentDefender = playerIds.find(id => currentRoles[id] === 'defender');

        if (currentAttacker && currentDefender) {
            newRoles[currentAttacker] = 'defender';
            newRoles[currentDefender] = 'attacker';
            console.log('🎯 2 игрока - смена ролей: атакующий ↔ защитник');
        }
    } else if (playerCount === 3) {
        // 3 игрока: атакующий → со-атакующий, защитник → атакующий, со-атакующий → защитник
        const currentAttacker = playerIds.find(id => currentRoles[id] === 'attacker');
        const currentCoAttacker = playerIds.find(id => currentRoles[id] === 'co-attacker');
        const currentDefender = playerIds.find(id => currentRoles[id] === 'defender');

        if (currentAttacker && currentCoAttacker && currentDefender) {
            newRoles[currentDefender] = 'attacker';
            newRoles[currentCoAttacker] = 'defender';
            newRoles[currentAttacker] = 'co-attacker';
            console.log('🎯 3 игрока - смена ролей после Бито');
        }
    } else if (playerCount >= 4) {
        // 4+ игроков: атакующий → наблюдатель, защитник → атакующий, со-атакующий → защитник, следующий → со-атакующий
        const currentAttacker = playerIds.find(id => currentRoles[id] === 'attacker');
        const currentCoAttacker = playerIds.find(id => currentRoles[id] === 'co-attacker');
        const currentDefender = playerIds.find(id => currentRoles[id] === 'defender');

        if (currentAttacker && currentCoAttacker && currentDefender) {
            const coAttackerIndex = playerIds.indexOf(currentCoAttacker);
            const nextAfterCoAttacker = playerIds[(coAttackerIndex + 1) % playerIds.length];

            newRoles[currentDefender] = 'attacker';
            newRoles[currentCoAttacker] = 'defender';
            newRoles[nextAfterCoAttacker] = 'co-attacker';
            newRoles[currentAttacker] = 'observer';

            // Остальные остаются наблюдателями
            playerIds.forEach(id => {
                if (![currentDefender, currentCoAttacker, nextAfterCoAttacker, currentAttacker].includes(id)) {
                    newRoles[id] = 'observer';
                }
            });

            console.log('🎯 4+ игроков - смена ролей после Бито');
        }
    }

    return newRoles;
};

/**
 * Получает роль текущего игрока
 */
export const getCurrentPlayerRole = (
    gameState: GameState,
    currentPlayerId: string
): 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined => {
    return gameState.playerRoles?.[currentPlayerId];
};

