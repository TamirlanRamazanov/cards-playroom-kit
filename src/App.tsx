import { useState, useEffect } from "react";
import { insertCoin, myPlayer, useMultiplayerState } from "playroomkit";
import type { GameState } from "./types";
import GameBoard from "./components/GameBoard";
import MainMenu from "./components/MainMenu";
import DebugGameBoard from "./components/DebugGameBoard";

// myId станет доступен после insertCoin()
function useMyId(ready: boolean): string {
    const [id, setId] = useState("");
    useEffect(() => {
        if (!ready) return;
        const p = myPlayer?.();
        if (p?.id) setId(p.id);
    }, [ready]);
    return id;
}

export default function App() {
    const [ready, setReady] = useState(false);
    const [name, setName] = useState("");
    const [currentPage, setCurrentPage] = useState<"mainMenu" | "login" | "game" | "debug">("mainMenu");

    const [game, setGame] = useMultiplayerState<GameState>("game", {
        phase: "lobby",
        hostId: undefined,
        players: {},
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
        // Faction system
        availableTargets: [],
        factionBonuses: {},
        targetSelectionMode: false,
        selectedTarget: undefined,
        factionEffects: {},
    });

    const myId = useMyId(ready);

    // setGame НЕ принимает функцию-апдейтер — всегда отдаём готовое значение
    const updateGame = (fn: (prev: GameState) => GameState) => {
        setGame(fn(game));
    };

    const enter = async () => {
        await insertCoin();
        setReady(true);
        setCurrentPage("game");
    };

    const handleStartGame = () => {
        setCurrentPage("login");
    };

    const handleDebugGame = () => {
        setCurrentPage("debug");
    };

    const handleBackToMainMenu = () => {
        setCurrentPage("mainMenu");
    };

    // регистрируем себя в общем стейте, назначаем хоста если ещё нет
    useEffect(() => {
        if (!ready) return;
        const p = myPlayer?.();
        if (!p?.id) return;
        if (!name) return;

        updateGame((prev) => {
            const players = { ...(prev.players || {}) };
            players[p.id] = players[p.id] || { name };
            const next: GameState = { ...prev, players };
            if (!prev.hostId) next.hostId = p.id;
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, name]);

    // Отображаем главное меню
    if (currentPage === "mainMenu") {
        return <MainMenu onStartGame={handleStartGame} onDebugGame={handleDebugGame} />;
    }

    // Отображаем страницу входа
    if (currentPage === "login") {
        return (
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0b1020",
                    color: "#fff",
                }}
            >
                <div style={{ width: 360, padding: 20, background: "#101826", borderRadius: 12 }}>
                    <h1 style={{ fontSize: 20, marginBottom: 8 }}>Playroom – вход</h1>
                    <input
                        placeholder="Ваше имя"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #374151",
                            background: "#0b1020",
                            color: "#fff",
                            marginBottom: 12,
                        }}
                    />
                    <button
                        onClick={enter}
                        disabled={!name}
                        style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 10,
                            border: 0,
                            background: name ? "#6366f1" : "#374151",
                            color: "#fff",
                            cursor: name ? "pointer" : "not-allowed",
                        }}
                    >
                        Войти в лобби
                    </button>
                </div>
            </div>
        );
    }

    // Отображаем debug страницу
    if (currentPage === "debug") {
        return <DebugGameBoard onBack={handleBackToMainMenu} />;
    }

    // Отображаем игру (лобби или игровую доску)
    if (game.phase === "lobby") {
        return (
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0b1020",
                    color: "#fff",
                }}
            >
                <div style={{ width: 360, padding: 20, background: "#101826", borderRadius: 12 }}>
                    <h1 style={{ fontSize: 20, marginBottom: 8 }}>Лобби</h1>
                    <div style={{ marginBottom: 12 }}>
                        Игроки: {Object.values(game.players || {}).map((p) => p.name).join(", ")}
                    </div>
                    {myId === game.hostId && (
                        <button
                            onClick={() => {
                                updateGame((prev) => ({ ...prev, phase: "playing" }));
                            }}
                            style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 10,
                                border: 0,
                                background: "#10b981",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Начать игру
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Отображаем игровую доску
    return (
        <GameBoard
            myId={myId}
            game={game}
            updateGame={updateGame}
        />
    );
}
