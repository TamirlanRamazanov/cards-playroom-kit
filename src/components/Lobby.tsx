import type { GameState } from "../types";
import { makeDeck, drawOne } from "../engine/deck";

interface Props {
    myId: string;
    game: GameState;
    updateGame: (updater: (prev: GameState) => GameState) => void;
}

export default function Lobby({ myId, game, updateGame }: Props) {
    const playerIds = Object.keys(game.players || {});
    const iAmHost = game.hostId === myId;

    const startGame = () => {
        // Host only (simple guard)
        if (!iAmHost) return;
        if (playerIds.length < 1) return;

        // Build a fresh deck and deal exactly 1 card to each player
        const deck = makeDeck();
        const hands: GameState["hands"] = {};
        for (const pid of playerIds) {
            const c = drawOne(deck);
            hands[pid] = c ? [c] : [];
        }

        const slots = new Array(playerIds.length).fill(null) as (string | null)[];

        updateGame((prev) => ({
            ...prev,
            phase: "playing",
            hands,
            slots,
            playerCountAtStart: playerIds.length,
            winnerId: undefined,
            startedAt: Date.now(),
        }));
    };

    return (
        <div style={{ minHeight: "100vh", padding: 24, background: "#0b1020", color: "#fff" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Лобби</h1>
                <div style={{ padding: 16, background: "#11172e", borderRadius: 12 }}>
                    <div style={{ opacity: 0.7, marginBottom: 8 }}>Игроки:</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {playerIds.length === 0 && <li style={{ opacity: 0.6 }}>Пока никого…</li>}
                        {playerIds.map((pid) => (
                            <li key={pid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                                <span style={{ display: "inline-block", height: 8, width: 8, borderRadius: 999, background: "#34d399" }} />
                                <span>{game.players[pid]?.name || pid}</span>
                                {pid === myId && <span style={{ opacity: 0.6, fontSize: 12 }}>(вы)</span>}
                                {pid === game.hostId && <span style={{ marginLeft: 6, fontSize: 12 }}>👑 хост</span>}
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button
                        onClick={startGame}
                        disabled={!iAmHost || playerIds.length < 1}
                        style={{ padding: "10px 16px", borderRadius: 10, background: iAmHost ? "#6366f1" : "#374151", color: "#fff", border: 0, cursor: iAmHost ? "pointer" : "not-allowed" }}
                    >
                        Начать игру (1 карта каждому)
                    </button>
                </div>
            </div>
        </div>
    );
}
