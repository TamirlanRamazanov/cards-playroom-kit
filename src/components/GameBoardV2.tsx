import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMultiplayerState } from 'playroomkit';
import type { GameState, Card } from "../types";
import { CARDS_DATA } from "../engine/cards";
import DropZone from "./DropZone";
import DefenseZone from "./DefenseZone";

// Простой генератор псевдослучайных чисел с seed
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

// Убрал константу - используем объект напрямую в useMultiplayerState как в старом коммите

interface GameBoardV2Props {
    myId: string;
    onBack?: () => void;
}

// Начальное состояние игры - вынесено за пределы компонента для стабильности
const INITIAL_GAME_STATE: GameState = {
    phase: "lobby",
    hostId: undefined,
    players: {},
    hands: {},
    slots: [null, null, null, null, null, null],
    defenseSlots: [null, null, null, null, null, null],
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

const GameBoardV2: React.FC<GameBoardV2Props> = ({ myId, onBack }) => {
    // ВСЕГДА вызываем ВСЕ хуки на верхнем уровне БЕЗ УСЛОВИЙ - это критично для React
    // PlayroomKit для синхронизации - используем константу для стабильности
    const [playroomGame, setPlayroomGame] = useMultiplayerState<GameState>("gameV2", INITIAL_GAME_STATE);
    
    // Локальные UI состояния (как в DebugGameBoardV2) - ВСЕГДА вызываем
    const [activeCard, setActiveCard] = useState<{ card: Card; index: number; source: string } | null>(null);
    // Используем gameState.defenseSlots напрямую, без локального состояния
    const [hoveredAttackCard, setHoveredAttackCard] = useState<number | null>(null);
    const [hoveredDefenseCard, setHoveredDefenseCard] = useState<number | null>(null);
    
    // Используем PlayroomKit game как источник истины с fallback (используем константу)
    const gameState = playroomGame || INITIAL_GAME_STATE;
    
    // Если myId пустой, показываем loading ПОСЛЕ всех хуков
    if (!myId) {
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
    
    const currentPlayerId = myId;
    // TODO: Будут использоваться позже при реализации полной логики
    // const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    // const [showSensorCircle, setShowSensorCircle] = useState<boolean>(false);
    // const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
    // const [dropZoneTimeout, setDropZoneTimeout] = useState<number | null>(null);
    // const [invalidDefenseCard, setInvalidDefenseCard] = useState<number | null>(null);
    // TODO: Будут использоваться позже при реализации полной логики
    // const [canTakeCards, setCanTakeCards] = useState<boolean>(false);
    // const [factionCounter, setFactionCounter] = useState<Record<number, number>>({});
    // const [defenseFactionsBuffer, setDefenseFactionsBuffer] = useState<Record<number, number>>({});
    // const [activeFirstAttackFactions, setActiveFirstAttackFactions] = useState<number[]>([]);
    // const [usedDefenseCardFactions, setUsedDefenseCardFactions] = useState<Record<string, number[]>>({});

    // Регистрируем игрока при подключении (как в App.tsx)
    useEffect(() => {
        if (!myId) return;
        if (!gameState) return;
        
        // Проверяем, зарегистрирован ли игрок
        const players = gameState.players || {};
        if (players[myId]) {
            // Игрок уже зарегистрирован
            return;
        }
        
        // Регистрируем игрока в gameState
        const newPlayers = { ...players };
        newPlayers[myId] = { name: `Player ${myId.slice(-4)}` };
        console.log(`✅ Игрок ${myId} зарегистрирован в GameBoardV2`);
        
        const next: GameState = { 
            ...gameState, 
            players: newPlayers,
            // Назначаем хоста, если его еще нет
            hostId: gameState.hostId || myId,
        };
        
        if (!gameState.hostId) {
            console.log(`👑 Игрок ${myId} назначен хостом`);
        }
        
        setPlayroomGame(next);
    }, [myId, gameState, setPlayroomGame]);

    // Функция создания игры (как в DebugGameBoardV2)
    const createGame = () => {
        if (!gameState) return;
        
        const playerIds = Object.keys(gameState.players || {});
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

        const newGameState: GameState = {
            ...gameState,
            phase: "playing",
            hands,
            slots: [null, null, null, null, null, null],
            defenseSlots: [null, null, null, null, null, null],
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
        
        setPlayroomGame(newGameState);
    };

    // Функция рестарта игры
    const restartGame = () => {
        if (!gameState) return;
        setPlayroomGame({
            phase: "lobby",
            hostId: undefined,
            players: {},
            hands: {},
            slots: [null, null, null, null, null, null],
            defenseSlots: [null, null, null, null, null, null],
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
    };

    // Обработчики drag & drop (базовая версия)
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

    // Всегда используем gameState (даже если он undefined, используем fallback)
    const myHand = gameState.hands[currentPlayerId] || [];
    const playerIds = Object.keys(gameState.players || {});

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
                            Игроков: {playerIds.length} | Карт в руке: {myHand.length} | Слотов на столе: {gameState.slots?.filter(s => s !== null).length || 0} | Колода: {gameState.deck.length}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {gameState.phase === "lobby" || !gameState.gameInitialized ? (
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
                            cards={gameState.slots || []}
                            minVisibleCards={1}
                            onCardHover={setHoveredAttackCard}
                            highlightedCardIndex={hoveredAttackCard}
                        />
                    </div>

                    {/* Defense zone */}
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ marginBottom: "10px" }}>Защита</h3>
                        <DefenseZone
                            attackCards={gameState.slots || []}
                            defenseCards={gameState.defenseSlots || []}
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

