import { useState, useEffect, useRef } from "react";
import { insertCoin, myPlayer, useMultiplayerState } from "playroomkit";
import type { GameState } from "./types";
import GameBoard from "./components/GameBoard";
import GameBoardV2 from "./components/GameBoardV2";
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

// Функция для назначения ролей игрокам (поддерживает 2-6 игроков)
const assignPlayerRoles = (firstPlayerId: string, playerIds: string[]): Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> => {
    const roles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
    const playerCount = playerIds.length;
    const firstPlayerIndex = playerIds.indexOf(firstPlayerId);
    
    // Назначаем роли по кругу от первого игрока
    playerIds.forEach((playerId, index) => {
        const relativeIndex = (index - firstPlayerIndex + playerIds.length) % playerIds.length;
        
        if (relativeIndex === 0) {
            roles[playerId] = 'attacker'; // Главный атакующий
        } else if (relativeIndex === 1) {
            roles[playerId] = 'defender'; // Защищающийся
        } else if (relativeIndex === 2 && playerCount >= 3) {
            roles[playerId] = 'co-attacker'; // Со-атакующий
        } else {
            // Для 4-6 игроков: остальные становятся наблюдателями
            roles[playerId] = 'observer'; // Наблюдающий
        }
    });
    
    console.log(`🎯 Распределение ролей для ${playerCount} игроков:`, roles);
    return roles;
};

// Функция для создания игрового состояния с колодой
const createGameWithDeck = (currentGame: GameState): GameState => {
    const playerIds = Object.keys(currentGame.players || {});
    const playerCount = playerIds.length;
    
    console.log(`🎯 createGameWithDeck вызвана с ${playerCount} игроками:`, playerIds);
    console.log(`🎯 Список игроков:`, Object.entries(currentGame.players || {}).map(([id, p]) => `${id}: ${p.name}`));
    
    if (playerCount === 0) {
        console.log('❌ Нет игроков для создания игры');
        return currentGame;
    }
    
    if (playerCount < 2) {
        console.log('❌ Минимум 2 игрока для начала игры');
        alert('❌ Минимум 2 игрока для начала игры!');
        return currentGame;
    }
    
    if (playerCount > 6) {
        console.log('❌ Максимум 6 игроков');
        alert('❌ Максимум 6 игроков!');
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
        
        if (playerCards.length !== 6) {
            console.warn(`⚠️ Игроку ${playerId} раздано только ${playerCards.length} карт вместо 6!`);
        }
        
        hands[playerId] = playerCards;
        turnOrder.push(playerId);
        console.log(`🎯 Игроку ${playerId} (${currentGame.players[playerId]?.name || playerId}) раздано ${playerCards.length} карт`);
    }
    
    // Оставшиеся карты остаются в колоде
    const remainingDeck = shuffledDeck;
    
    console.log(`🎯 Создана колода из ${CARDS_DATA.length} карт`);
    console.log(`🎯 Раздано по 6 карт ${playerIds.length} игрокам`);
    console.log(`🎯 Осталось в колоде: ${remainingDeck.length} карт`);
    console.log(`🎯 Распределение карт:`, Object.entries(hands).map(([id, cards]) => `${id}: ${cards.length}`));

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
    const [currentPage, setCurrentPage] = useState<"mainMenu" | "game" | "gameV2" | "debug">("mainMenu");

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

    // startNewPlay удалена, используется прямой вызов insertCoin в кнопке Launch

    const handleStartGame = async () => {
        // Для старой игры - используем лобби PlayroomKit
        await insertCoin();
        setReady(true);
        setCurrentPage("game");
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

        updateGame((prev) => {
            const players = { ...(prev.players || {}) };
            // Генерируем имя по умолчанию на основе ID
            const playerName = `Player ${p.id.slice(-4)}`;
            players[p.id] = players[p.id] || { name: playerName };
            const next: GameState = { ...prev, players };
            if (!prev.hostId) next.hostId = p.id;
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);

    // Автоматическое подключение для gameV2 - убрано, так как подключение происходит в onGameV2

    // Отображаем главное меню
    if (currentPage === "mainMenu") {
        return <MainMenu 
            onStartGame={handleStartGame} 
            onDebugGame={handleDebugGame} 
            onDebugGameV2={() => setCurrentPage("debug")}
            onGameV2={async () => {
                // Прямой переход к GameBoardV2 с автоматическим подключением
                console.log('🎯 Play V2 нажата, подключаемся...');
                try {
                    await insertCoin();
                    console.log('✅ insertCoin завершен');
                    setReady(true);
                    // Переходим сразу, myId обновится через useMyId
                    setCurrentPage("gameV2");
                } catch (error) {
                    console.error('❌ Ошибка при подключении:', error);
                    alert('Ошибка при подключении к игре');
                }
            }}
        />;
    }

    // Отображаем debug страницу
    if (currentPage === "debug") {
        return <DebugGameBoard onBack={handleBackToMainMenu} />;
    }

    // Отображаем GameBoardV2 (постоянная комната, без промежуточных меню)
    if (currentPage === "gameV2") {
        if (!ready || !myId) {
            return (
                <div style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0b1020",
                    color: "#fff",
                }}>
                    <div>Подключение к комнате...</div>
                </div>
            );
        }
        return <GameBoardV2 myId={myId} onBack={handleBackToMainMenu} />;
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
                    <div style={{ marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
                        Игроков: {Object.keys(zustandGame.players || {}).length} / 6
                    </div>
                    <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.6 }}>
                        {Object.entries(zustandGame.players || {}).map(([playerId, player]) => (
                            <div key={playerId} style={{ marginBottom: 4 }}>
                                {player.name} {playerId === zustandGame.hostId ? '👑 (Хост)' : ''}
                            </div>
                        ))}
                    </div>
                    {Object.keys(zustandGame.players || {}).length < 2 && (
                        <div style={{ marginBottom: 12, fontSize: 12, color: '#fbbf24' }}>
                            ⚠️ Минимум 2 игрока для начала игры
                        </div>
                    )}
                    {Object.keys(zustandGame.players || {}).length >= 6 && (
                        <div style={{ marginBottom: 12, fontSize: 12, color: '#ef4444' }}>
                            ⚠️ Достигнут максимум игроков (6)
                        </div>
                    )}
                    {myId === zustandGame.hostId && (
                        <button
                            onClick={() => {
                                // Используем актуальное состояние из Zustand для получения списка игроков
                                const currentPlayers = Object.keys(zustandGame.players || {});
                                console.log(`🎯 Хост нажал "Начать игру". Текущие игроки: ${currentPlayers.length}`, currentPlayers);
                                
                                if (currentPlayers.length < 2) {
                                    alert('❌ Минимум 2 игрока для начала игры!');
                                    return;
                                }
                                
                                if (currentPlayers.length > 6) {
                                    alert('❌ Максимум 6 игроков!');
                                    return;
                                }
                                
                                updateGame((prev) => {
                                    // Двойная проверка: используем актуальное состояние из prev
                                    const actualPlayerIds = Object.keys(prev.players || {});
                                    console.log(`🎯 В updateGame: актуальные игроки: ${actualPlayerIds.length}`, actualPlayerIds);
                                    
                                    if (actualPlayerIds.length !== currentPlayers.length) {
                                        console.warn(`⚠️ Несоответствие количества игроков! В UI: ${currentPlayers.length}, в состоянии: ${actualPlayerIds.length}`);
                                    }
                                    
                                    return createGameWithDeck(prev);
                                });
                            }}
                            disabled={Object.keys(zustandGame.players || {}).length < 2 || Object.keys(zustandGame.players || {}).length > 6}
                            style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 10,
                                border: 0,
                                background: (Object.keys(zustandGame.players || {}).length < 2 || Object.keys(zustandGame.players || {}).length > 6) ? "#6b7280" : "#10b981",
                                color: "#fff",
                                cursor: (Object.keys(zustandGame.players || {}).length < 2 || Object.keys(zustandGame.players || {}).length > 6) ? "not-allowed" : "pointer",
                                opacity: (Object.keys(zustandGame.players || {}).length < 2 || Object.keys(zustandGame.players || {}).length > 6) ? 0.5 : 1,
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
