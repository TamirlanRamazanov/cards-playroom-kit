import { useState, useEffect, useRef } from "react";
import { insertCoin, myPlayer, useMultiplayerState } from "playroomkit";
import type { GameState } from "./types";
import GameBoard from "./components/GameBoard";
import MainMenu from "./components/MainMenu";
import DebugGameBoard from "./components/DebugGameBoard";
// import DebugGameBoardV2 from "./components/DebugGameBoardV2";
import { CARDS_DATA } from "./engine/cards";
import { useGameStore } from "./store/gameStore";

// myId станет доступен после startNewPlay()
function useMyId(ready: boolean): string {
    const [id, setId] = useState("");
    useEffect(() => {
        if (!ready) return;
        const p = myPlayer?.();
        if (p?.id) setId(p.id);
    }, [ready]);
    return id;
}

// Функция для перемешивания колоды
function shuffleDeck<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Функция для определения первого игрока по самой слабой карте
const determineFirstPlayer = (hands: GameState["hands"], players: GameState["players"]): {playerId: string, playerName: string, cardName: string, power: number} => {
    let weakestPlayer = {playerId: "", playerName: "", cardName: "", power: 999};
    
    // Проходим по всем игрокам и находим самую слабую карту
    Object.keys(players).forEach(playerId => {
        const playerHand = hands[playerId] || [];
        if (playerHand.length === 0) return;
        
        // Находим самую слабую карту у игрока
        const weakestCard = playerHand.reduce((weakest, card) => 
            card.power < weakest.power ? card : weakest, playerHand[0]);
        
        // Если эта карта слабее текущей самой слабой
        if (weakestCard.power < weakestPlayer.power) {
            weakestPlayer = {
                playerId,
                playerName: players[playerId]?.name || playerId,
                cardName: weakestCard.name,
                power: weakestCard.power
            };
        }
    });
    
    return weakestPlayer;
};

// Функция для назначения ролей игрокам
const assignPlayerRoles = (firstPlayerId: string, playerIds: string[]): Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> => {
    const roles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
    
    const firstPlayerIndex = playerIds.indexOf(firstPlayerId);
    
    // Назначаем роли по кругу от первого игрока
    playerIds.forEach((playerId, index) => {
        const relativeIndex = (index - firstPlayerIndex + playerIds.length) % playerIds.length;
        
        if (relativeIndex === 0) {
            roles[playerId] = 'attacker'; // Главный атакующий
        } else if (relativeIndex === 1) {
            roles[playerId] = 'defender'; // Защищающийся
        } else if (relativeIndex === 2 && playerIds.length >= 3) {
            roles[playerId] = 'co-attacker'; // Со-атакующий
        } else {
            roles[playerId] = 'observer'; // Наблюдающий
        }
    });
    
    return roles;
};

// Функция для создания игрового состояния с колодой
const createGameWithDeck = (currentGame: GameState): GameState => {
    const playerIds = Object.keys(currentGame.players || {});
    
    if (playerIds.length === 0) {
        console.log('❌ Нет игроков для создания игры');
        return currentGame;
    }
    
    // Создаем полную колоду из всех карт и перемешиваем её случайно
    const shuffledDeck = shuffleDeck([...CARDS_DATA]);
    
    // Создаем игроков и раздаем карты в зависимости от количества
    const hands: GameState["hands"] = {};
    const turnOrder: string[] = [];
    
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        const playerCards = shuffledDeck.splice(0, 6);
        
        hands[playerId] = playerCards;
        turnOrder.push(playerId);
    }
    
    // Оставшиеся карты остаются в колоде
    const remainingDeck = shuffledDeck;
    
    console.log(`🎯 Создана колода из ${CARDS_DATA.length} карт`);
    console.log(`🎯 Раздано по 6 карт ${playerIds.length} игрокам`);
    console.log(`🎯 Осталось в колоде: ${remainingDeck.length} карт`);

    // Определяем первого игрока
    const firstPlayer = determineFirstPlayer(hands, currentGame.players);
    
    // Назначаем роли
    const playerRoles = assignPlayerRoles(firstPlayer.playerId, playerIds);
    
    console.log(`🎯 Первый игрок: ${firstPlayer.playerName} (${firstPlayer.cardName}, сила: ${firstPlayer.power})`);
    console.log(`🎯 Роли игроков:`, playerRoles);

    return {
        ...currentGame,
        phase: "playing",
        hands,
        slots: new Array(6).fill(null),
        defenseSlots: new Array(6).fill(null),
        deck: remainingDeck,
        discardPile: [],
        playerCountAtStart: playerIds.length,
        winnerId: undefined,
        startedAt: Date.now(),
        
        // Role system
        playerRoles,
        attackPriority: 'attacker',
        mainAttackerHasPlayed: false,
        attackerPassed: false,
        coAttackerPassed: false,
        attackerBitoPressed: false,
        coAttackerBitoPressed: false,
        attackerPasPressed: false,
        coAttackerPasPressed: false,
        
        // Draw queue
        drawQueue: [],
        
        // Game initialization
        gameInitialized: true,
        firstPlayerInfo: firstPlayer,
        
        // Turn system
        currentTurn: firstPlayer.playerId,
        turnOrder: playerIds,
        currentTurnIndex: playerIds.indexOf(firstPlayer.playerId),
        turnPhase: "play",
        
        // Game mechanics
        attackingCard: null,
        defendingCard: null,
        attackTarget: undefined,
        canPass: false,
        canTakeCards: false,
        
        // Card draw system
        maxHandSize: 6,
        cardsDrawnThisTurn: {},
        canDrawCards: false,
        
        // Faction system
        availableTargets: playerIds,
        factionBonuses: {},
        targetSelectionMode: false,
        selectedTarget: undefined,
        factionEffects: {},
        activeFactions: [],
        
        // Card power system
        minCardPower: 50,
        maxCardPower: 100,
        canDefendWithEqualPower: true,
        
        // Turn control system
        turnActions: {
            canEndTurn: false,
            canPass: false,
            canTakeCards: false,
            canAttack: false,
            canDefend: false,
        },
        turnHistory: [
            {
                playerId: firstPlayer.playerId,
                action: "Игра началась",
                timestamp: Date.now(),
            }
        ],
    };
};

export default function App() {
    const [ready, setReady] = useState(false);
    const [name, setName] = useState("");
    const [currentPage, setCurrentPage] = useState<"mainMenu" | "login" | "game" | "debug">("mainMenu");

    // Zustand store
    const { game: zustandGame, setGame: setZustandGame, updateGame: updateZustandGame } = useGameStore();

    // PlayroomKit multiplayer state для синхронизации между клиентами
    const [playroomGame, setPlayroomGame] = useMultiplayerState<GameState>("game", {
        phase: "lobby",
        hostId: undefined,
        players: {},
        hands: {},
        slots: [],
        defenseSlots: [],
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
        activeFactions: [],
        // Faction management
        factionCounter: {},
        activeFirstAttackFactions: [],
        usedDefenseCardFactions: {},
        displayActiveFactions: [],
        defenseFactionsBuffer: {},
        // Card power system (align with GameState)
        minCardPower: 50,
        maxCardPower: 100,
        canDefendWithEqualPower: true,
        // Turn control system
        turnActions: {
            canEndTurn: false,
            canPass: false,
            canTakeCards: false,
            canAttack: false,
            canDefend: false,
        },
        turnHistory: [],
        // Role system defaults
        playerRoles: {},
        attackPriority: 'attacker',
        mainAttackerHasPlayed: false,
        attackerPassed: false,
        coAttackerPassed: false,
        attackerBitoPressed: false,
        coAttackerBitoPressed: false,
        attackerPasPressed: false,
        coAttackerPasPressed: false,
        // Draw queue
        drawQueue: [],
        // Game initialization
        gameInitialized: false,
    });

    const myId = useMyId(ready);

    // Ref для отслеживания последнего состояния, чтобы избежать циклов
    const lastPlayroomStateRef = useRef<string>('');

    // Синхронизация PlayroomKit -> Zustand: обновляем Zustand когда PlayroomKit меняется
    // Это источник истины для мультиплеера
    useEffect(() => {
        if (!playroomGame) return;

        // Проверяем, действительно ли состояние изменилось
        const currentStateStr = JSON.stringify(playroomGame);
        
        // Обновляем Zustand только если PlayroomKit действительно изменился
        // Это предотвращает циклы, но позволяет синхронизировать изменения от других игроков
        if (currentStateStr !== lastPlayroomStateRef.current) {
            console.log('🔄 Синхронизация PlayroomKit -> Zustand');
            lastPlayroomStateRef.current = currentStateStr;
            setZustandGame(playroomGame);
        }
    }, [playroomGame, setZustandGame]);

    // Синхронизация Zustand -> PlayroomKit: обновляем PlayroomKit через updateGame
    // Используем updateGame для атомарных обновлений
    const updateGame = (fn: (prev: GameState) => GameState) => {
        updateZustandGame((prev) => {
            const newState = fn(prev);
            const newStateStr = JSON.stringify(newState);
            const prevStateStr = JSON.stringify(prev);
            
            // Обновляем PlayroomKit только если состояние действительно изменилось
            if (newStateStr !== prevStateStr) {
                console.log('🔄 Синхронизация Zustand -> PlayroomKit');
                lastPlayroomStateRef.current = newStateStr;
                // Синхронизируем с PlayroomKit (это обновит всех клиентов)
                setPlayroomGame(newState);
            }
            
            return newState;
        });
    };

    const startNewPlay = async () => {
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
        return <MainMenu onStartGame={handleStartGame} onDebugGame={handleDebugGame} onDebugGameV2={() => setCurrentPage("debug")} />;
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
                        onClick={startNewPlay}
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
                        New Play
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
    if (zustandGame.phase === "lobby") {
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
                        Игроки: {Object.values(zustandGame.players || {}).map((p) => p.name).join(", ")}
                    </div>
                    {myId === zustandGame.hostId && (
                        <button
                            onClick={() => {
                                updateGame((prev) => createGameWithDeck(prev));
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
            updateGame={updateGame}
        />
    );
}
