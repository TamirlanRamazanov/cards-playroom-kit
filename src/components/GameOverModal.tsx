import type { GameState } from "../types";

interface ModalProps {
    game: GameState;
    onRestartToLobby: () => void;
}

export default function GameOverModal({ game, onRestartToLobby }: ModalProps) {
    if (game.phase !== "gameover" || !game.winnerId) return null;

    const winnerName = game.players[game.winnerId]?.name || game.winnerId;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ width: 360, padding: 20, background: "#101826", borderRadius: 12, color: "#fff" }}>
                <h2 style={{ fontSize: 20, marginBottom: 8 }}>Игра окончена</h2>
                <p style={{ opacity: 0.9, marginBottom: 16 }}>Победитель: <b>{winnerName}</b></p>
                <button onClick={onRestartToLobby} style={{ padding: "10px 16px", border: 0, borderRadius: 10, background: "#6366f1", color: "#fff", cursor: "pointer" }}>
                    Вернуться в лобби
                </button>
            </div>
        </div>
    );
}