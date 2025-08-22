import { CARDS_DATA } from "./cards";
import type { Card } from "../types";

export function makeDeck(): Card[] {
    // Создаем копию всех карт
    const deck: Card[] = [...CARDS_DATA];
    
    // Fisher–Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function drawOne(deck: Card[]): Card | null {
    return deck.length ? (deck.pop() as Card) : null;
}

export function cardLabel(card: Card): string {
    return `${card.name} (${card.power})`;
}
