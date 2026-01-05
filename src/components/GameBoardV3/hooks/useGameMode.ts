import type { GameState } from '../../../types';
import { getCurrentPlayerRole } from '../modules/roleSystem';

/**
 * Хук для определения режима игры на основе роли игрока
 */
export const useGameMode = (
    gameState: GameState,
    currentPlayerId: string,
    defaultMode: 'attack' | 'defense'
): 'attack' | 'defense' => {
    if (!gameState.gameInitialized) {
        return defaultMode;
    }

    const role = getCurrentPlayerRole(gameState, currentPlayerId);
    
    if (role === 'attacker' || role === 'co-attacker') {
        return 'attack';
    } else if (role === 'defender') {
        return 'defense';
    }
    
    // Для наблюдателя возвращаем 'attack' по умолчанию (но он не сможет ничего делать)
    return 'attack';
};

