import type { GameState, Card } from "../types";
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
        updateGame(() => ({
            phase: "lobby",
            hostId: myId,
            players: { [myId]: { name: game.players[myId]?.name || "Player" } },
            hands: {},
            slots: [],
            playerCountAtStart: undefined,
            winnerId: undefined,
            startedAt: undefined,
            // Card draw system
            deck: [],
            discardPile: [],
            maxHandSize: 6,
            cardsDrawnThisTurn: {},
            canDrawCards: true,
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
                        gridTemplateColumns: `repeat(${Math.max(1, playerIds.length)}, 120px)`,
                        gap: 16,
                    }}
                >
                    {game.slots.map((slot, idx) => (
                        <button
                            key={idx}
                            onClick={() => takeFromSlot(idx)}
                            style={{
                                height: 160,
                                width: 120,
                                borderRadius: 12,
                                border: "2px dashed #334155",
                                background: slot ? "#11172e" : "#0b1020",
                                color: "#fff",
                                cursor: slot ? "pointer" : "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "8px",
                            }}
                        >
                            {slot ? (
                                <>
                                    <div style={{ fontSize: "12px", fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
                                        {slot.name}
                                    </div>
                                    <div style={{ fontSize: "18px", color: "#8B0000", fontWeight: "bold" }}>
                                        {slot.power}
                                    </div>
                                </>
                            ) : (
                                <span style={{ fontSize: "14px", opacity: 0.5 }}>Пусто</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* My hand */}
            <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                {myHand.length === 0 && <div style={{ opacity: 0.7, fontSize: 14 }}>В руке нет карт</div>}
                {myHand.map((c, i) => (
                    <button
                        key={`${c.id}-${i}`}
                        onClick={() => moveMyCardToFreeSlot(c)}
                        style={{
                            height: 160,
                            width: 120,
                            borderRadius: 12,
                            border: "2px solid #8B0000",
                            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "8px",
                            transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 0, 0, 0.3)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div style={{ fontSize: "12px", fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
                            {c.name}
                        </div>
                        <div style={{ fontSize: "18px", color: "#8B0000", fontWeight: "bold" }}>
                            {c.power}
                        </div>
                    </button>
                ))}
            </div>

            <GameOverModal game={game} onRestartToLobby={onRestartToLobby} />
        </div>
    );
}