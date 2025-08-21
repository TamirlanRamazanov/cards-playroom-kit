export type { Card } from "../types";

export function makeDeck(): string[] {
    const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
    const suits = ["S", "H", "D", "C"]; // Spades, Hearts, Diamonds, Clubs
    const deck: string[] = [];
    for (const r of ranks) {
        for (const s of suits) deck.push(r + s);
    }
    // Fisher–Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function drawOne(deck: string[]): string | null {
    return deck.length ? (deck.pop() as string) : null;
}

export function cardLabel(card: string): string {
    const suit = card.slice(1);
    const rank = card.slice(0, 1);
    const suitMap: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
    return `${rank}${suitMap[suit] || "?"}`;
}
