import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMultiplayerState } from 'playroomkit';
import type { GameState, Card } from "../types";
// import { CARDS_DATA } from "../engine/cards"; // TODO: будет использоваться для создания игры
import DropZone from "./DropZone";
import DefenseZone from "./DefenseZone";

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
    const game = playroomGame || {
        phase: "lobby",
        players: {},
        hands: {},
        slots: [],
        defenseSlots: [],
        deck: [],
        discardPile: [],
        maxHandSize: 6,
        cardsDrawnThisTurn: {},
        canDrawCards: true,
        availableTargets: [],
        factionBonuses: {},
        targetSelectionMode: false,
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
    const updateGame = (fn: (prev: GameState) => GameState) => {
        const newState = fn(game);
        setPlayroomGame(newState);
    };

    // Регистрация игрока при монтировании
    useEffect(() => {
        if (myId) {
            updateGame((prev) => {
                const players = { ...(prev.players || {}) };
                players[myId] = players[myId] || { name: `Player ${myId.slice(-4)}` };
                const next: GameState = { ...prev, players };
                if (!prev.hostId) next.hostId = myId;
                return next;
            });
        }
    }, [myId]);

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

    // Если игра еще не начата, показываем лобби
    if (game.phase === "lobby") {
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
                <div style={{ width: 360, padding: 20, background: "#101826", borderRadius: 12 }}>
                    <h1 style={{ fontSize: 20, marginBottom: 8 }}>Лобби V2</h1>
                    <div style={{ marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
                        Игроков: {playerIds.length} / 6
                    </div>
                    <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.6 }}>
                        {Object.entries(game.players || {}).map(([playerId, player]) => (
                            <div key={playerId} style={{ marginBottom: 4 }}>
                                {player.name} {playerId === game.hostId ? '👑 (Хост)' : ''}
                            </div>
                        ))}
                    </div>
                    {myId === game.hostId && (
                        <button
                            onClick={() => {
                                // TODO: Реализовать старт игры
                                console.log('🎯 Начать игру V2');
                            }}
                            style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 10,
                                border: 0,
                                background: playerIds.length >= 2 && playerIds.length <= 6 ? "#10b981" : "#6b7280",
                                color: "#fff",
                                cursor: playerIds.length >= 2 && playerIds.length <= 6 ? "pointer" : "not-allowed",
                                opacity: playerIds.length >= 2 && playerIds.length <= 6 ? 1 : 0.5,
                            }}
                            disabled={playerIds.length < 2 || playerIds.length > 6}
                        >
                            Начать игру
                        </button>
                    )}
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                width: "100%",
                                marginTop: 10,
                                padding: 10,
                                borderRadius: 10,
                                border: 0,
                                background: "#6b7280",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Назад в меню
                        </button>
                    )}
                </div>
            </div>
        );
    }

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
                            Карт в руке: {myHand.length} | Слотов на столе: {game.slots?.filter(s => s !== null).length || 0} | Колода: {game.deck.length}
                        </div>
                    </div>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                padding: "8px 16px",
                                background: "#8B0000",
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

                {/* Game Board */}
                <div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
                    {/* Table with attack cards */}
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ marginBottom: "10px" }}>Стол атаки</h3>
                        <DropZone
                            id="attack-table"
                            cards={game.slots || []}
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

