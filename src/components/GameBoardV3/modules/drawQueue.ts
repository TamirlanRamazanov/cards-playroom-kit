import type { GameState, Card } from '../../../types';

/**
 * Модуль очереди добора карт
 * Управляет добором карт игрокам до 6 карт
 */

/**
 * Обрабатывает очередь добора карт
 * Добирает карты игрокам до 6 карт из колоды
 */
export const processDrawQueue = (
    gameState: GameState
): { hands: GameState["hands"]; deck: Card[] } => {
    const deck = [...(gameState.deck || [])];
    const hands = { ...gameState.hands };
    const queue = [...(gameState.drawQueue || [])];

    for (const playerId of queue) {
        const playerHand = hands[playerId] || [];

        // Добираем карты до 6, если в колоде есть карты
        while (playerHand.length < 6 && deck.length > 0) {
            const card = deck.shift();
            if (card) {
                playerHand.push(card);
                console.log(`🎯 Игрок ${playerId} получил карту: ${card.name}`);
            }
        }
        hands[playerId] = playerHand;
    }

    return { hands, deck };
};

