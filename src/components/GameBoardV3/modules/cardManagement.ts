import type { GameState, Card } from '../../../types';
import { validateDefenseCard } from '../utils/cardValidation';
import { updateActiveFactionsFromDefenseCard } from './factionSystem';

/**
 * Модуль управления картами
 * Управляет размещением карт на столе, взятием карт защитником
 */

/**
 * Проверяет, можно ли взять карты (только для защитника, если есть неотбитые карты)
 */
export const checkCanTakeCards = (
    gameState: GameState,
    _currentPlayerId: string,
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined
): boolean => {
    if (playerRole !== 'defender') {
        return false;
    }

    const attackCards = gameState.slots?.filter(card => card !== null) || [];
    const defenseSlots = gameState.defenseSlots || [];
    
    // Проверяем, есть ли неотбитые карты атаки
    for (let i = 0; i < attackCards.length; i++) {
        const attackCard = attackCards[i];
        if (attackCard && !defenseSlots[i]) {
            // Есть неотбитая карта атаки
            return true;
        }
    }

    return false;
};

/**
 * Взятие карт защитником
 * Переносит все карты со стола в руку защитника, очищает стол, меняет роли, обрабатывает очередь добора
 */
export const handleTakeCards = (
    gameState: GameState,
    currentPlayerId: string,
    rotateRoles: (prev: GameState) => Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'>,
    processDrawQueue: (gameState: GameState) => { hands: GameState["hands"]; deck: Card[] }
): GameState => {
    // Собираем все карты со стола (атаки и защиты)
    const attackCards = gameState.slots?.filter(card => card !== null) || [];
    const defenseCardsFromTable = (gameState.defenseSlots || []).filter(card => card !== null);
    const allTableCards = [...attackCards, ...defenseCardsFromTable];

    if (allTableCards.length === 0) {
        console.log('⚠️ На столе нет карт для взятия');
        return gameState;
    }

    // Создаем новое состояние
    const newState = { ...gameState };

    // Получаем текущую руку защитника
    const currentHand = gameState.hands[currentPlayerId] || [];
    const myCards = [...currentHand];
    const newHand = [...myCards, ...allTableCards];

    console.log(`✅ Карты добавлены в руку. Было: ${myCards.length}, стало: ${newHand.length}`);

    // Обновляем руку защитника
    newState.hands = {
        ...gameState.hands,
        [currentPlayerId]: newHand
    };

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

    // Меняем роли после взятия карт
    const newRoles = rotateRoles(newState);
    if (Object.keys(newRoles).length > 0) {
        newState.playerRoles = { ...gameState.playerRoles, ...newRoles };
    }

    // Добавляем защитника в очередь добора карт
    const currentQueue = [...(gameState.drawQueue || [])];
    currentQueue.push(currentPlayerId);
    newState.drawQueue = currentQueue;

    // Обрабатываем очередь добора карт
    const { hands: updatedHands, deck: updatedDeck } = processDrawQueue(newState);
    newState.hands = updatedHands;
    newState.deck = updatedDeck;
    newState.drawQueue = []; // Очищаем очередь после обработки

    // Сбрасываем состояния фракций
    newState.factionCounter = {};
    newState.defenseFactionsBuffer = {};
    newState.activeFirstAttackFactions = [];
    newState.usedDefenseCardFactions = {};

    return newState;
};

/**
 * Добавляет карту атаки на стол
 */
export const addAttackCard = (
    gameState: GameState,
    currentPlayerId: string,
    card: Card,
    cardIndex: number
): GameState | null => {
    const slots = gameState.slots || [];
    const freeSlotIndex = slots.findIndex(slot => slot === null);

    if (freeSlotIndex < 0) {
        alert('🃏 Стол полон! Максимум 6 карт.');
        return null;
    }

    const myCards = [...(gameState.hands[currentPlayerId] || [])];
    myCards.splice(cardIndex, 1);

    const newSlots = [...slots];
    newSlots[freeSlotIndex] = card;

    return {
        ...gameState,
        hands: { ...gameState.hands, [currentPlayerId]: myCards },
        slots: newSlots,
    };
};

/**
 * Добавляет карту защиты на стол
 */
export const addDefenseCard = (
    gameState: GameState,
    currentPlayerId: string,
    card: Card,
    cardIndex: number,
    attackCardIndex: number
): { success: boolean; newGameState?: GameState; error?: string } => {
    const attackCard = gameState.slots?.[attackCardIndex];
    if (!attackCard) {
        return { success: false, error: 'Карта атаки не найдена' };
    }

    // Валидация
    if (!validateDefenseCard(card, attackCard)) {
        return {
            success: false,
            error: `❌ Недостаточная сила! Карта "${card.name}" (${card.power}) не может защитить от "${attackCard.name}" (${attackCard.power}). Требуется сила >= ${attackCard.power}`
        };
    }

    const currentDefenseSlots = [...(gameState.defenseSlots || [])];
    while (currentDefenseSlots.length <= attackCardIndex) {
        currentDefenseSlots.push(null);
    }

    // Проверяем, не занят ли уже слот
    if (currentDefenseSlots[attackCardIndex] !== null) {
        return { success: false, error: 'Слот защиты уже занят' };
    }

    // Добавляем карту защиты
    currentDefenseSlots[attackCardIndex] = card;

    // Удаляем карту из руки
    const myCards = [...(gameState.hands[currentPlayerId] || [])];
    if (cardIndex >= 0 && cardIndex < myCards.length && myCards[cardIndex]?.id === card.id) {
        myCards.splice(cardIndex, 1);
    }

    // Обновляем фракции
    const newFactionCounter = updateActiveFactionsFromDefenseCard(gameState, card);

    const newGameState: GameState = {
        ...gameState,
        hands: { ...gameState.hands, [currentPlayerId]: myCards },
        defenseSlots: currentDefenseSlots,
        factionCounter: newFactionCounter,
    };

    return { success: true, newGameState };
};

