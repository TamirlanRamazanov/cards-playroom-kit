import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMultiplayerState } from 'playroomkit';
import type { GameState, Card } from "../types";
import { CARDS_DATA } from "../engine/cards";
import DropZone from "./DropZone";
import DefenseZone from "./DefenseZone";

// Простой генератор псевдослучайных чисел
class SeededRandom {
    private seed: number;
    
    constructor(seed: number) {
        this.seed = seed;
    }
    
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    shuffle<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

interface GameBoardV2Props {
    myId: string;
    onBack?: () => void;
}

const GameBoardV2: React.FC<GameBoardV2Props> = ({ myId, onBack }) => {
    // PlayroomKit для синхронизации (используем отдельный ключ "gameV2")
    const [playroomGame, setPlayroomGame] = useMultiplayerState<GameState>("gameV2", {
        phase: "lobby",
        hostId: undefined,
        players: {},
        hands: {},
        slots: [],
        defenseSlots: [],
        playerCountAtStart: undefined,
        winnerId: undefined,
        startedAt: undefined,
        deck: [],
        discardPile: [],
        maxHandSize: 6,
        cardsDrawnThisTurn: {},
        canDrawCards: true,
        availableTargets: [],
        factionBonuses: {},
        targetSelectionMode: false,
        selectedTarget: undefined,
        factionEffects: {},
        activeFactions: [],
        factionCounter: {},
        activeFirstAttackFactions: [],
        usedDefenseCardFactions: {},
        displayActiveFactions: [],
        defenseFactionsBuffer: {},
        minCardPower: 50,
        maxCardPower: 100,
        canDefendWithEqualPower: true,
        turnActions: {
            canEndTurn: false,
            canPass: false,
            canTakeCards: false,
            canAttack: false,
            canDefend: false,
        },
        turnHistory: [],
        playerRoles: {},
        attackPriority: 'attacker',
        mainAttackerHasPlayed: false,
        attackerPassed: false,
        coAttackerPassed: false,
        attackerBitoPressed: false,
        coAttackerBitoPressed: false,
        attackerPasPressed: false,
        coAttackerPasPressed: false,
        drawQueue: [],
        gameInitialized: false,
    });

    // Используем PlayroomKit game как источник истины
    // Если playroomGame еще не загружен, используем начальное состояние
    const game = playroomGame || {
        phase: "lobby" as const,
        hostId: undefined,
        players: {},
        hands: {},
        slots: [],
        defenseSlots: [],
        playerCountAtStart: undefined,
        winnerId: undefined,
        startedAt: undefined,
        deck: [],
        discardPile: [],
        maxHandSize: 6,
        cardsDrawnThisTurn: {},
        canDrawCards: true,
        availableTargets: [],
        factionBonuses: {},
        targetSelectionMode: false,
        selectedTarget: undefined,
        factionEffects: {},
        activeFactions: [],
        factionCounter: {},
        activeFirstAttackFactions: [],
        usedDefenseCardFactions: {},
        displayActiveFactions: [],
        defenseFactionsBuffer: {},
        minCardPower: 50,
        maxCardPower: 100,
        canDefendWithEqualPower: true,
        turnActions: {
            canEndTurn: false,
            canPass: false,
            canTakeCards: false,
            canAttack: false,
            canDefend: false,
        },
        turnHistory: [],
        playerRoles: {},
        attackPriority: 'attacker' as const,
        mainAttackerHasPlayed: false,
        attackerPassed: false,
        coAttackerPassed: false,
        attackerBitoPressed: false,
        coAttackerBitoPressed: false,
        attackerPasPressed: false,
        coAttackerPasPressed: false,
        drawQueue: [],
        gameInitialized: false,
    };

    // Локальные состояния для UI
    const [activeCard, setActiveCard] = useState<{ card: Card; index: number; source: string } | null>(null);
    // const [gameMode, setGameMode] = useState<'attack' | 'defense'>('attack'); // TODO: будет использоваться позже
    const [defenseCards, setDefenseCards] = useState<(Card | null)[]>([]);
    const [hoveredAttackCard, setHoveredAttackCard] = useState<number | null>(null);
    const [hoveredDefenseCard, setHoveredDefenseCard] = useState<number | null>(null);
    // const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null); // TODO: будет использоваться позже
    // const [showSensorCircle, setShowSensorCircle] = useState<boolean>(false); // TODO: будет использоваться позже
    
    // Фракционная система (TODO: будет использоваться позже)
    // const [factionCounter, setFactionCounter] = useState<Record<number, number>>({});
    // const [defenseFactionsBuffer, setDefenseFactionsBuffer] = useState<Record<number, number>>({});
    // const [activeFirstAttackFactions, setActiveFirstAttackFactions] = useState<number[]>([]);
    // const [usedDefenseCardFactions, setUsedDefenseCardFactions] = useState<Record<string, number[]>>({});

    const myHand = game.hands[myId] || [];
    const playerIds = Object.keys(game.players || {});

    // Функция для обновления игры (синхронизирует с PlayroomKit)
    // Используем актуальное состояние из playroomGame для предотвращения stale closures
    const updateGame = (fn: (prev: GameState) => GameState) => {
        // Всегда используем актуальное состояние из PlayroomKit
        const currentGame = playroomGame || game;
        const newState = fn(currentGame);
        setPlayroomGame(newState);
    };

    // Регистрация игрока при монтировании (автоматически)
    useEffect(() => {
        if (!myId) return;
        
        // Используем актуальное состояние из playroomGame
        const currentGame = playroomGame;
        if (!currentGame) {
            // Если playroomGame еще не загружен, инициализируем его
            const initialGame: GameState = {
                phase: "lobby",
                hostId: myId,
                players: { [myId]: { name: `Player ${myId.slice(-4)}` } },
                hands: {},
                slots: [],
                defenseSlots: [],
                playerCountAtStart: undefined,
                winnerId: undefined,
                startedAt: undefined,
                deck: [],
                discardPile: [],
                maxHandSize: 6,
                cardsDrawnThisTurn: {},
                canDrawCards: true,
                availableTargets: [],
                factionBonuses: {},
                targetSelectionMode: false,
                selectedTarget: undefined,
                factionEffects: {},
                activeFactions: [],
                factionCounter: {},
                activeFirstAttackFactions: [],
                usedDefenseCardFactions: {},
                displayActiveFactions: [],
                defenseFactionsBuffer: {},
                minCardPower: 50,
                maxCardPower: 100,
                canDefendWithEqualPower: true,
                turnActions: {
                    canEndTurn: false,
                    canPass: false,
                    canTakeCards: false,
                    canAttack: false,
                    canDefend: false,
                },
                turnHistory: [],
                playerRoles: {},
                attackPriority: 'attacker',
                mainAttackerHasPlayed: false,
                attackerPassed: false,
                coAttackerPassed: false,
                attackerBitoPressed: false,
                coAttackerBitoPressed: false,
                attackerPasPressed: false,
                coAttackerPasPressed: false,
                drawQueue: [],
                gameInitialized: false,
            };
            setPlayroomGame(initialGame);
            console.log('🎯 Инициализировано начальное состояние для игрока:', myId);
            return;
        }
        
        // Регистрируем игрока, если его еще нет
        const players = { ...(currentGame.players || {}) };
        if (!players[myId]) {
            players[myId] = { name: `Player ${myId.slice(-4)}` };
            const newGame: GameState = {
                ...currentGame,
                players,
                hostId: currentGame.hostId || myId,
            };
            setPlayroomGame(newGame);
            console.log('🎯 Игрок зарегистрирован:', myId);
        }
    }, [myId, playroomGame, setPlayroomGame]);

    // Функция создания игры (как в DebugGameBoardV2)
    const createGame = () => {
        // Используем актуальное состояние из playroomGame
        const currentGameState = playroomGame || game;
        const playerIds = Object.keys(currentGameState.players || {});
        
        console.log('🎯 Создание игры. Игроки:', playerIds, 'Текущее состояние:', currentGameState);
        
        if (playerIds.length === 0) {
            alert('❌ Нет игроков для создания игры!');
            return;
        }

        const random = new SeededRandom(Date.now());
        const shuffledDeck = random.shuffle([...CARDS_DATA]);
        
        const hands: GameState["hands"] = {};
        const turnOrder: string[] = [];
        
        // Раздаем карты всем игрокам
        for (let i = 0; i < playerIds.length; i++) {
            const playerId = playerIds[i];
            const playerCards = shuffledDeck.splice(0, 6);
            hands[playerId] = playerCards;
            turnOrder.push(playerId);
        }

        // Определяем первого игрока (самая слабая карта)
        let weakestPlayer = { playerId: playerIds[0], power: 999 };
        playerIds.forEach(playerId => {
            const playerHand = hands[playerId] || [];
            if (playerHand.length > 0) {
                const weakestCard = playerHand.reduce((weakest, card) => 
                    card.power < weakest.power ? card : weakest, playerHand[0]);
                if (weakestCard.power < weakestPlayer.power) {
                    weakestPlayer = { playerId, power: weakestCard.power };
                }
            }
        });

        // Создаем новое состояние игры
        const newGameState: GameState = {
            ...currentGameState,
            phase: "playing",
            hands,
            slots: new Array(6).fill(null),
            defenseSlots: new Array(6).fill(null),
            deck: shuffledDeck,
            discardPile: [],
            playerCountAtStart: playerIds.length,
            startedAt: Date.now(),
            currentTurn: weakestPlayer.playerId,
            turnOrder,
            currentTurnIndex: turnOrder.indexOf(weakestPlayer.playerId),
            turnPhase: "play",
            gameInitialized: true,
            playerRoles: Object.fromEntries(playerIds.map(id => [id, 'observer' as const])),
        };
        
        console.log('🎯 Игра создана:', { 
            players: playerIds.length, 
            cardsInDeck: shuffledDeck.length,
            firstPlayer: weakestPlayer.playerId,
            hands: Object.keys(hands).length
        });
        
        setPlayroomGame(newGameState);
    };

    // Функция рестарта игры
    const restartGame = () => {
        updateGame((prev) => ({
            ...prev,
            phase: "lobby",
            hands: {},
            slots: [],
            defenseSlots: [],
            deck: [],
            discardPile: [],
            gameInitialized: false,
            playerRoles: {},
        }));
    };

    // Обработчики drag & drop
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const cardData = active.data.current;
        
        if (cardData?.card) {
            setActiveCard({
                card: cardData.card,
                index: cardData.index,
                source: cardData.source || 'hand'
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const cardData = active.data.current;
        
        if (!cardData?.card || !over) {
            setActiveCard(null);
            return;
        }

        // TODO: Реализовать логику размещения карт
        console.log('🎯 Drag end:', { card: cardData.card.name, over: over.id });
        
        setActiveCard(null);
    };

    // Синхронизация defenseCards с глобальным состоянием
    useEffect(() => {
        const globalDefense = game.defenseSlots || [];
        setDefenseCards(globalDefense);
    }, [game.defenseSlots]);

    // TODO: Глобальный обработчик мыши для сенсора (будет реализован позже)
    // useEffect(() => {
    //     if (showSensorCircle || activeCard) {
    //         const handleGlobalMouseMove = (e: MouseEvent) => {
    //             setMousePosition({ x: e.clientX, y: e.clientY });
    //         };
    //
    //         document.addEventListener('mousemove', handleGlobalMouseMove);
    //         return () => {
    //             document.removeEventListener('mousemove', handleGlobalMouseMove);
    //         };
    //     }
    // }, [showSensorCircle, activeCard]);

    // Всегда показываем игровую доску (как в DebugGameBoardV2)
    // Логирование для отладки
    useEffect(() => {
        console.log('🎯 GameBoardV2 состояние:', {
            myId,
            playroomGameExists: !!playroomGame,
            phase: game.phase,
            playersCount: Object.keys(game.players || {}).length,
            myHandLength: myHand.length,
            slotsCount: game.slots?.length || 0,
        });
    }, [myId, playroomGame, game.phase, game.players, myHand.length, game.slots]);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ 
                minHeight: "100vh", 
                width: "100vw",
                margin: 0,
                padding: 0,
                display: "flex", 
                flexDirection: "column", 
                background: "#0b1020", 
                color: "#fff",
            }}>
                {/* Header */}
                <div style={{ 
                    padding: "12px 20px", 
                    background: "#1a1a2e", 
                    borderBottom: "2px solid #8B0000",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: "#FFD700" }}>🎮 Game Board V2</h2>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            Игроков: {playerIds.length} | Карт в руке: {myHand.length} | Слотов на столе: {game.slots?.filter(s => s !== null).length || 0} | Колода: {game.deck.length}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {/* Кнопки управления для всех игроков (для тестирования) */}
                        {game.phase === "lobby" || !game.gameInitialized ? (
                            <button
                                onClick={createGame}
                                style={{
                                    padding: "8px 16px",
                                    background: "#10b981",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                }}
                            >
                                🚀 Старт
                            </button>
                        ) : (
                            <button
                                onClick={restartGame}
                                style={{
                                    padding: "8px 16px",
                                    background: "#ef4444",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                }}
                            >
                                🔄 Рестарт
                            </button>
                        )}
                        {onBack && (
                            <button
                                onClick={onBack}
                                style={{
                                    padding: "8px 16px",
                                    background: "#6b7280",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                }}
                            >
                                Назад
                            </button>
                        )}
                    </div>
                </div>

                {/* Game Board */}
                <div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
                    {/* Table with attack cards */}
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ marginBottom: "10px" }}>Стол атаки</h3>
                        <DropZone
                            id="attack-table"
                            cards={game.slots || []}
                            minVisibleCards={1}
                            onCardHover={setHoveredAttackCard}
                            highlightedCardIndex={hoveredAttackCard}
                        />
                    </div>

                    {/* Defense zone */}
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ marginBottom: "10px" }}>Защита</h3>
                        <DefenseZone
                            attackCards={game.slots || []}
                            defenseCards={defenseCards}
                            onCardHover={setHoveredDefenseCard}
                            highlightedCardIndex={hoveredDefenseCard}
                        />
                    </div>

                    {/* My hand */}
                    <div>
                        <h3 style={{ marginBottom: "10px" }}>Мои карты</h3>
                        <div style={{ 
                            display: "flex", 
                            gap: "10px", 
                            flexWrap: "wrap",
                            position: "sticky",
                            bottom: 0,
                            background: "#0b1020",
                            padding: "10px 0",
                            borderTop: "1px solid #333",
                        }}>
                            {myHand.map((card) => (
                                <div
                                    key={card.id}
                                    style={{
                                        width: 120,
                                        height: 160,
                                        background: "#1f2937",
                                        border: "2px solid #10b981",
                                        borderRadius: 12,
                                        padding: "8px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "grab",
                                    }}
                                >
                                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>{card.name}</div>
                                    <div style={{ opacity: 0.7 }}>Power: {card.power}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeCard ? (
                        <div style={{
                            width: 120,
                            height: 160,
                            background: "#1f2937",
                            border: "2px solid #10b981",
                            borderRadius: 12,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            textAlign: "center",
                            transform: "rotate(5deg)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        }}>
                            <div>
                                <div style={{ fontWeight: "bold", marginBottom: 4 }}>{activeCard.card.name}</div>
                                <div style={{ opacity: 0.7 }}>Power: {activeCard.card.power}</div>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default GameBoardV2;

