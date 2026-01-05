import { useState } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { GameState, Card } from '../../../types';
import { getCurrentPlayerRole } from '../modules/roleSystem';
import { canPlayerAttack, canPlayerDefend } from '../modules/turnSystem';
import { validateAttackCard } from '../utils/cardValidation';
import { isFirstAttackCard, getFirstAttackCardFactions, getFactionIntersection } from '../modules/factionSystem';
import { addAttackCard, addDefenseCard } from '../modules/cardManagement';
import { attachAttackCardThroughDefense } from '../modules/factionSystem';

/**
 * Хук для управления drag & drop карт
 */
export const useCardDragDrop = (
    gameState: GameState,
    currentPlayerId: string,
    effectiveGameMode: 'attack' | 'defense',
    defenseCards: (Card | null)[],
    hoveredDefenseCard: number | null,
    hoveredAttackCard: number | null,
    updateGame: (fn: (prev: GameState) => GameState) => void,
    setDefenseCards: (cards: (Card | null)[]) => void,
    isUpdatingDefenseCardsRef: React.MutableRefObject<boolean>
) => {
    const [activeCard, setActiveCard] = useState<{ card: Card; index: number; source: string } | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const cardData = active.data.current as { card: Card; index: number; source: string };
        if (cardData) {
            setActiveCard(cardData);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveCard(null);
            return;
        }

        const cardData = active.data.current as { card: Card; index: number; source: string };
        if (!cardData) {
            setActiveCard(null);
            return;
        }

        const { card, index, source } = cardData;
        const targetZone = over.id;
        const targetZoneString = String(targetZone);

        // Проверяем права на основе роли
        const role = getCurrentPlayerRole(gameState, currentPlayerId);
        if (role === 'observer') {
            alert('👁️ Наблюдатели не могут играть карты!');
            setActiveCard(null);
            return;
        }

        // Специальная обработка для карт защиты в режиме атаки
        if (source === 'hand' && effectiveGameMode === 'attack' && (hoveredDefenseCard !== null || targetZoneString.startsWith('defense-card-'))) {
            if (!canPlayerAttack(gameState, role)) {
                alert('❌ Вы не можете атаковать сейчас!');
                setActiveCard(null);
                return;
            }

            let defenseCard: Card | null = null;
            if (hoveredDefenseCard !== null && defenseCards[hoveredDefenseCard]) {
                defenseCard = defenseCards[hoveredDefenseCard];
            } else if (targetZoneString.startsWith('defense-card-')) {
                const defenseIndex = parseInt(targetZoneString.replace('defense-card-', ''));
                defenseCard = defenseCards[defenseIndex];
            }

            if (!defenseCard) {
                setActiveCard(null);
                return;
            }

            // Используем модуль фракций для прикрепления карты через защиту
            const result = attachAttackCardThroughDefense(gameState, card, defenseCard, defenseCards);
            if (!result.success) {
                alert(result.error || '❌ Не удалось прикрепить карту');
                setActiveCard(null);
                return;
            }

            // Добавляем карту атаки на стол
            const newState = addAttackCard(gameState, currentPlayerId, card, index);
            if (!newState) {
                setActiveCard(null);
                return;
            }

            // Обновляем фракции
            updateGame((prev) => ({
                ...prev,
                ...newState,
                factionCounter: result.newFactionCounter || prev.factionCounter,
                usedDefenseCardFactions: result.newUsedDefenseCardFactions || prev.usedDefenseCardFactions,
                defenseFactionsBuffer: result.newDefenseFactionsBuffer || prev.defenseFactionsBuffer,
            }));

            setActiveCard(null);
            return;
        }

        // Перемещение карты из руки на стол
        if (source === 'hand' && targetZone === 'table') {
            if (effectiveGameMode === 'defense') {
                if (!canPlayerDefend(role)) {
                    alert('❌ Только защитник может защищаться!');
                    setActiveCard(null);
                    return;
                }

                const attackCards = gameState.slots?.map((slot, idx) => ({ slot, index: idx })).filter(({ slot }) => slot !== null) || [];
                if (attackCards.length > 0) {
                    const targetIndex = hoveredAttackCard !== null ? hoveredAttackCard : attackCards[0].index;
                    const result = addDefenseCard(gameState, currentPlayerId, card, index, targetIndex);

                    if (result.success && result.newGameState) {
                        isUpdatingDefenseCardsRef.current = true;
                        updateGame(() => result.newGameState!);
                        setDefenseCards(result.newGameState.defenseSlots || []);
                    } else {
                        alert(result.error || '❌ Не удалось добавить карту защиты');
                    }
                } else {
                    alert('🛡️ Нет карт атаки для отбивания!');
                }
                setActiveCard(null);
                return;
            }

            // В режиме атаки добавляем карту на стол
            if (!canPlayerAttack(gameState, role)) {
                alert('❌ Вы не можете атаковать сейчас!');
                setActiveCard(null);
                return;
            }

            const validation = validateAttackCard(
                card,
                isFirstAttackCard(gameState),
                gameState.activeFirstAttackFactions || []
            );
            if (!validation.isValid) {
                alert(`❌ ${validation.reason}`);
                setActiveCard(null);
                return;
            }

            const newState = addAttackCard(gameState, currentPlayerId, card, index);
            if (!newState) {
                setActiveCard(null);
                return;
            }

            // Обновляем фракции
            const attackCardsCount = newState.slots.filter(slot => slot !== null).length;
            let updatedFactionCounter = { ...(gameState.factionCounter || {}) };
            let updatedActiveFirstAttackFactions = [...(gameState.activeFirstAttackFactions || [])];
            let updatedDefenseFactionsBuffer = { ...(gameState.defenseFactionsBuffer || {}) };

            if (attackCardsCount <= 6) {
                if (isFirstAttackCard(gameState)) {
                    // Первая карта - устанавливаем все её фракции
                    card.factions.forEach(factionId => {
                        updatedFactionCounter[factionId] = (updatedFactionCounter[factionId] || 0) + 1;
                    });
                    updatedActiveFirstAttackFactions = card.factions;
                } else {
                    // Для последующих карт - сохраняем фракции защиты в буфер
                    const firstAttackFactions = getFirstAttackCardFactions(gameState);
                    const firstAttackSet = new Set(firstAttackFactions);
                    const newBuffer: Record<number, number> = {};
                    Object.keys(updatedFactionCounter).forEach(factionIdStr => {
                        const factionId = parseInt(factionIdStr);
                        if (!firstAttackSet.has(factionId) && updatedFactionCounter[factionId] > 0) {
                            newBuffer[factionId] = updatedFactionCounter[factionId];
                        }
                    });
                    updatedDefenseFactionsBuffer = newBuffer;

                    // Пересечение с фракциями первой карты атаки
                    const intersection = getFactionIntersection(card.factions, firstAttackFactions);
                    updatedActiveFirstAttackFactions = intersection;

                    // Обновляем счётчик только для ПЕРЕСЕКАЮЩИХСЯ фракций
                    const newCounter: Record<number, number> = {};
                    intersection.forEach(factionId => {
                        if (updatedFactionCounter[factionId] && updatedFactionCounter[factionId] > 0) {
                            newCounter[factionId] = updatedFactionCounter[factionId];
                        }
                    });
                    updatedFactionCounter = newCounter;

                    // Восстанавливаем фракции защиты из буфера
                    Object.keys(updatedDefenseFactionsBuffer).forEach(factionIdStr => {
                        const factionId = parseInt(factionIdStr);
                        updatedFactionCounter[factionId] = updatedDefenseFactionsBuffer[factionId];
                    });
                }
            }

            updateGame((prev) => ({
                ...prev,
                ...newState,
                factionCounter: updatedFactionCounter,
                activeFirstAttackFactions: updatedActiveFirstAttackFactions,
                defenseFactionsBuffer: updatedDefenseFactionsBuffer,
                mainAttackerHasPlayed: role === 'attacker' ? true : prev.mainAttackerHasPlayed,
            }));
        }

        setActiveCard(null);
    };

    return {
        activeCard,
        handleDragStart,
        handleDragEnd,
    };
};

