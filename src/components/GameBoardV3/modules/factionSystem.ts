import type { GameState, Card } from '../../../types';
import { FACTIONS } from '../../../engine/cards';

/**
 * Модуль системы фракций
 * Управляет активными фракциями, их пересечениями и буферами
 */

/**
 * Получает названия фракций по ID
 */
export const getFactionNames = (factionIds: number[]): string[] => {
    return factionIds.map(id => FACTIONS[id] || `Unknown Faction ${id}`);
};

/**
 * Проверяет пересечение фракций
 */
export const hasCommonFactions = (cardFactions: number[], activeFactionIds: number[]): boolean => {
    return cardFactions.some(factionId => activeFactionIds.includes(factionId));
};

/**
 * Получает пересечение фракций
 */
export const getFactionIntersection = (cardFactions: number[], activeFactionIds: number[]): number[] => {
    return cardFactions.filter(factionId => activeFactionIds.includes(factionId));
};

/**
 * Проверяет, является ли карта первой в атаке
 */
export const isFirstAttackCard = (gameState: GameState): boolean => {
    const attackCards = gameState.slots || [];
    return attackCards.filter(card => card !== null).length === 0;
};

/**
 * Получает фракции первой карты атаки
 */
export const getFirstAttackCardFactions = (gameState: GameState): number[] => {
    const attackCards = gameState.slots?.filter(card => card !== null) || [];
    if (attackCards.length === 0) return [];
    return attackCards[0].factions;
};

/**
 * Проверяет, может ли карта защиты использовать фракцию
 */
export const canDefenseCardUseFaction = (
    defenseCard: Card,
    factionId: number,
    usedDefenseCardFactions: Record<number, number[]>
): boolean => {
    const usedFactions = usedDefenseCardFactions[defenseCard.id] || [];
    return !usedFactions.includes(factionId);
};

/**
 * Обновляет счётчик фракций
 */
export const updateFactionCounter = (
    gameState: GameState,
    factionIds: number[],
    increment: number = 1
): Record<number, number> => {
    const newCounter = { ...(gameState.factionCounter || {}) };
    factionIds.forEach(factionId => {
        newCounter[factionId] = (newCounter[factionId] || 0) + increment;
        if (newCounter[factionId] <= 0) {
            delete newCounter[factionId];
        }
    });
    return newCounter;
};

/**
 * Обновляет активные фракции после добавления карты защиты
 */
export const updateActiveFactionsFromDefenseCard = (
    gameState: GameState,
    card: Card
): Record<number, number> => {
    const attackCardsCount = gameState.slots?.filter(slot => slot !== null).length || 0;
    if (attackCardsCount >= 6) {
        return gameState.factionCounter || {};
    }
    return updateFactionCounter(gameState, card.factions, 1);
};

/**
 * Прикрепляет атакующую карту через защитную (обновляет фракции)
 */
export const attachAttackCardThroughDefense = (
    gameState: GameState,
    attackCard: Card,
    defenseCard: Card,
    defenseCards: (Card | null)[]
): {
    success: boolean;
    newFactionCounter?: Record<number, number>;
    newUsedDefenseCardFactions?: Record<number, number[]>;
    newDefenseFactionsBuffer?: Record<number, number>;
    error?: string;
} => {
    const attackCardsCount = gameState.slots?.filter(slot => slot !== null).length || 0;
    if (attackCardsCount >= 6) {
        return { success: false, error: 'Стол полон' };
    }

    const factionCounter = gameState.factionCounter || {};
    const usedDefenseCardFactions = gameState.usedDefenseCardFactions || {};

    const availableDefenseFactions = defenseCard.factions.filter(factionId =>
        canDefenseCardUseFaction(defenseCard, factionId, usedDefenseCardFactions)
    );

    const intersection = getFactionIntersection(attackCard.factions, availableDefenseFactions);

    if (intersection.length === 0) {
        const attackFactionNames = getFactionNames(attackCard.factions);
        const availableDefenseFactionNames = getFactionNames(availableDefenseFactions);
        return {
            success: false,
            error: `❌ Нет общих фракций! Атакующая карта: ${attackFactionNames.join(', ')}, Защитная карта: ${availableDefenseFactionNames.join(', ')}`
        };
    }

    // Сохраняем фракции защиты в буфер
    const firstAttackFactions = getFirstAttackCardFactions(gameState);
    const firstAttackSet = new Set(firstAttackFactions);
    const defenseBuffer: Record<number, number> = {};
    Object.keys(factionCounter).forEach(factionIdStr => {
        const factionId = parseInt(factionIdStr);
        if (!firstAttackSet.has(factionId) && factionCounter[factionId] > 0) {
            defenseBuffer[factionId] = factionCounter[factionId];
        }
    });

    const keepFactions = [...firstAttackFactions, ...intersection];

    // Обновляем счётчик: оставляем только фракции первой карты атаки + пересечение
    let newCounter: Record<number, number> = {};
    keepFactions.forEach(factionId => {
        if (factionCounter[factionId] && factionCounter[factionId] > 0) {
            newCounter[factionId] = factionCounter[factionId];
        }
    });

    // Отнимаем все фракции текущей карты защиты
    defenseCard.factions.forEach(factionId => {
        if (newCounter[factionId] && newCounter[factionId] > 0) {
            newCounter[factionId] = newCounter[factionId] - 1;
            if (newCounter[factionId] <= 0) {
                delete newCounter[factionId];
            }
        }
    });

    // Отмечаем использованные фракции для текущей карты защиты
    const defenseCardNonIntersectingFactions = defenseCard.factions.filter(factionId => !intersection.includes(factionId));
    const newUsedDefenseCardFactions = {
        ...usedDefenseCardFactions,
        [defenseCard.id]: [...(usedDefenseCardFactions[defenseCard.id] || []), ...defenseCardNonIntersectingFactions]
    };

    // Фильтруем буфер защиты (учитываем другие карты защиты на столе)
    const filteredDefenseBuffer: Record<number, number> = {};
    Object.keys(defenseBuffer).forEach(factionIdStr => {
        const factionId = parseInt(factionIdStr);
        const bufferCount = defenseBuffer[factionId];
        if (!firstAttackFactions.includes(factionId)) {
            if (intersection.includes(factionId) || !defenseCard.factions.includes(factionId)) {
                filteredDefenseBuffer[factionId] = bufferCount;
            } else {
                // Проверяем, есть ли другие карты защиты с этой фракцией
                const hasOtherDefenseCards = defenseCards.some(card =>
                    card && card.id !== defenseCard.id && card.factions.includes(factionId)
                );
                if (hasOtherDefenseCards) {
                    filteredDefenseBuffer[factionId] = bufferCount;
                }
            }
        }
    });

    // Восстанавливаем фракции защиты из буфера
    Object.keys(filteredDefenseBuffer).forEach(factionIdStr => {
        const factionId = parseInt(factionIdStr);
        newCounter[factionId] = filteredDefenseBuffer[factionId];
    });

    return {
        success: true,
        newFactionCounter: newCounter,
        newUsedDefenseCardFactions: newUsedDefenseCardFactions,
        newDefenseFactionsBuffer: filteredDefenseBuffer,
    };
};

/**
 * Обновляет активные фракции после добавления первой карты атаки
 */
export const updateActiveFactionsFromFirstAttackCard = (
    gameState: GameState,
    card: Card
): { newFactionCounter: Record<number, number>; newActiveFirstAttackFactions: number[] } => {
    const newFactionCounter = updateFactionCounter(gameState, card.factions, 1);
    return {
        newFactionCounter,
        newActiveFirstAttackFactions: card.factions,
    };
};

/**
 * Обновляет активные фракции после добавления последующей карты атаки
 */
export const updateActiveFactionsFromAttackCard = (
    gameState: GameState,
    card: Card
): Record<number, number> => {
    const activeFirstAttackFactions = gameState.activeFirstAttackFactions || [];
    const intersection = getFactionIntersection(card.factions, activeFirstAttackFactions);
    
    if (intersection.length === 0) {
        return gameState.factionCounter || {};
    }

    return updateFactionCounter(gameState, intersection, 1);
};

