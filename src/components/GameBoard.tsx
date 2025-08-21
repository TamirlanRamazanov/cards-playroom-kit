import type { GameState, Card } from "../types";
import { cardLabel } from "../engine/deck";
import GameOverModal from "./GameOverModal";

interface Props {
    myId: string;
    game: GameState;
    updateGame: (updater: (prev: GameState) => GameState) => void;
}

export default function GameBoard({ myId, game, updateGame }: Props) {
    const playerIds = Object.keys(game.players || {});
    const myHand = game.hands[myId] || [];

    const tryDeclareWinner = (draft: GameState): GameState => {
        const N = draft.playerCountAtStart || playerIds.length || 0;
        for (const pid of Object.keys(draft.players)) {
            if ((draft.hands[pid]?.length || 0) >= N && N > 0) {
                return { ...draft, phase: "gameover", winnerId: pid };
            }
        }
        return draft;
    };

    const moveMyCardToFreeSlot = (card: Card) => {
        if (game.phase !== "playing") return;
        updateGame((prev) => {
            if (!prev.slots) return prev;
            const freeIndex = prev.slots.findIndex((s) => s === null);
            if (freeIndex === -1) return prev; // no free slot
            const myCards = [...(prev.hands[myId] || [])];
            const idx = myCards.indexOf(card);
            if (idx === -1) return prev; // card not found
            myCards.splice(idx, 1);
            const slots = [...prev.slots];
            slots[freeIndex] = card;
            const next: GameState = {
                ...prev,
                hands: { ...prev.hands, [myId]: myCards },
                slots,
            };
            return tryDeclareWinner(next);
        });
    };

    const takeFromSlot = (index: number) => {
        if (game.phase !== "playing") return;
        updateGame((prev) => {
            if (!prev.slots) return prev;
            const slots = [...prev.slots];
            const card = slots[index];
            if (!card) return prev;
            const myCards = [...(prev.hands[myId] || [])];
            myCards.push(card);
            slots[index] = null;
            const next: GameState = {
                ...prev,
                hands: { ...prev.hands, [myId]: myCards },
                slots,
            };
            return tryDeclareWinner(next);
        });
    };

    const onRestartToLobby = () => {
        updateGame((prev) => ({
            phase: "lobby",
            hostId: prev.hostId, // keep same host
            players: prev.players, // keep players list
            hands: {},
            slots: [],
            playerCountAtStart: undefined,
            winnerId: undefined,
            startedAt: undefined,
        }));
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0b1020", color: "#fff" }}>
            {/* Header with players */}
            <div style={{ padding: 12, background: "#101826", position: "sticky", top: 0 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {playerIds.map((pid) => (
                        <div key={pid} style={{ padding: "6px 10px", borderRadius: 999, background: pid === myId ? "#065f46" : "#1f2937" }}>
                            {game.players[pid]?.name || pid}
                            {pid === myId ? " • вы" : ""}
                            {pid === game.hostId ? " 👑" : ""}
                        </div>
                    ))}
                </div>
            </div>

            {/* Center slots */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${Math.max(1, playerIds.length)}, 100px)`,
                        gap: 16,
                    }}
                >
                    {game.slots.map((slot, idx) => (
                        <button
                            key={idx}
                            onClick={() => takeFromSlot(idx)}
                            style={{
                                height: 140,
                                width: 100,
                                borderRadius: 12,
                                border: "2px dashed #334155",
                                background: slot ? "#11172e" : "#0b1020",
                                color: "#fff",
                                cursor: slot ? "pointer" : "pointer",
                            }}
                        >
              <span style={{ fontSize: 28 }}>
                {slot ? cardLabel(slot) : ""}
              </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* My hand */}
            <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                {myHand.length === 0 && <div style={{ opacity: 0.7, fontSize: 14 }}>В руке нет карт</div>}
                {myHand.map((c, i) => (
                    <button
                        key={`${c}-${i}`}
                        onClick={() => moveMyCardToFreeSlot(c)}
                        style={{
                            height: 140,
                            width: 100,
                            borderRadius: 12,
                            border: "1px solid #6366f1",
                            background: "#312e81",
                            color: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        <span style={{ fontSize: 28 }}>{cardLabel(c)}</span>
                    </button>
                ))}
            </div>

            <GameOverModal game={game} onRestartToLobby={onRestartToLobby} />
        </div>
    );
}