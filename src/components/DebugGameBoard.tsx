import React, { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { GameState } from "../types";
import DropZone from "./DropZone";
import GameHUD from "./GameHUD";
import DuelSystem from "./DuelSystem";
import RoleSystem from "./RoleSystem";
import CardDrawSystem from "./CardDrawSystem";
import FactionSystem from "./FactionSystem";
import { CARDS_DATA } from "../engine/cards";

// Создаем тестовые данные для дебага
const createDebugGameState = (): GameState => ({
    phase: "playing",
    hostId: "debug-host",
    players: {
        "debug-host": { name: "Debug Host" },
        "player-2": { name: "Player 2" },
        "player-3": { name: "Player 3" },
    },
    hands: {
        "debug-host": [
            CARDS_DATA[0], // Luffy
            CARDS_DATA[1], // Zoro
            CARDS_DATA[2], // Nami
        ],
        "player-2": [
            CARDS_DATA[6], // Robin
            CARDS_DATA[7], // Franky
        ],
        "player-3": [
            CARDS_DATA[9], // Jinbe
            CARDS_DATA[10], // Vivi
        ]
    },
    slots: [
        CARDS_DATA[11], // Ace (атакующая карта)
        CARDS_DATA[12], // Sabo (защищающая карта)
        null,
        null,
        null,
        null
    ],
    playerCountAtStart: 3,
    winnerId: undefined,
    startedAt: Date.now(),
    
    // Turn system
    currentTurn: "debug-host",
    turnOrder: ["debug-host", "player-2", "player-3"],
    currentTurnIndex: 0,
    
    // Game mechanics
    attackingCard: null,
    defendingCard: null,
    attackTarget: undefined,
    canPass: true,
    canTakeCards: true,
    
    // Card draw system
    deck: [
        CARDS_DATA[3], // Usopp
        CARDS_DATA[4], // Sanji
        CARDS_DATA[5], // Chopper
        CARDS_DATA[8], // Brook
        CARDS_DATA[13], // Shanks
        CARDS_DATA[14], // Mihawk
        CARDS_DATA[15], // Whitebeard
    ],
    discardPile: [],
    maxHandSize: 6,
    cardsDrawnThisTurn: {},
    canDrawCards: true,
    
    // Faction system
    availableTargets: ["player-2", "player-3"],
    factionBonuses: {
        1: 2, // Фракция 1: +2 к силе
        2: 1, // Фракция 2: +1 к силе
        3: 3, // Фракция 3: +3 к силе
    },
    targetSelectionMode: false,
    selectedTarget: undefined,
    factionEffects: {
        1: ["Может атаковать дважды за ход", "Иммунитет к эффектам заморозки"],
        2: ["Получает дополнительную карту при победе", "Может защищаться от любой атаки"],
        3: ["Увеличивает силу всех карт в руке на +1", "Особая способность: 'Взрыв'"],
    },
});

interface DebugGameBoardProps {
    onBack?: () => void;
}

interface CardData {
    card: any;
    index: number;
    source: string;
}

const DebugGameBoard: React.FC<DebugGameBoardProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>(createDebugGameState);
    const [activeCard, setActiveCard] = useState<CardData | null>(null);
    const myId = "debug-host";
    const myHand = gameState.hands[myId] || [];

    const updateGame = (updater: (prev: GameState) => GameState) => {
        setGameState(updater);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const cardData = active.data.current as CardData;
        if (cardData) {
            setActiveCard(cardData);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        console.log('Drag result:', { active, over });
        
        if (!over) {
            setActiveCard(null);
            return;
        }

        const cardData = active.data.current as CardData;
        if (!cardData) {
            setActiveCard(null);
            return;
        }

        const { card, index, source } = cardData;
        const targetZone = over.id;

        // Перемещение карты из руки на стол
        if (source === 'hand' && targetZone === 'table') {
            const slotIndex = parseInt(over.id.toString().split('-')[1] || '0');
            
            updateGame((prev) => {
                if (!prev.slots) return prev;
                
                // Проверяем, что слот пустой
                if (prev.slots[slotIndex] !== null) return prev;
                
                const myCards = [...(prev.hands[myId] || [])];
                myCards.splice(index, 1);
                
                const slots = [...prev.slots];
                slots[slotIndex] = card;
                
                return {
                    ...prev,
                    hands: { ...prev.hands, [myId]: myCards },
                    slots,
                };
            });
        }
        
        // Взятие карты со стола
        if (source === 'table' && targetZone === 'my-hand') {
            const slotIndex = parseInt(active.id.toString().split('-')[2] || '0');
            
            updateGame((prev) => {
                if (!prev.slots) return prev;
                
                const myCards = [...(prev.hands[myId] || []), card];
                const slots = [...prev.slots];
                slots[slotIndex] = null;
                
                return {
                    ...prev,
                    hands: { ...prev.hands, [myId]: myCards },
                    slots,
                };
            });
        }

        setActiveCard(null);
    };

    const resetGame = () => {
        setGameState(createDebugGameState());
    };

    const addRandomCard = () => {
        const randomCard = CARDS_DATA[Math.floor(Math.random() * CARDS_DATA.length)];
        updateGame((prev) => ({
            ...prev,
            hands: {
                ...prev.hands,
                [myId]: [...(prev.hands[myId] || []), randomCard]
            }
        }));
    };

    // HUD Actions
    const handleEndTurn = () => {
        updateGame((prev) => {
            if (!prev.turnOrder || prev.currentTurnIndex === undefined) return prev;
            
            const nextIndex = (prev.currentTurnIndex + 1) % prev.turnOrder.length;
            const nextPlayer = prev.turnOrder[nextIndex];
            
            return {
                ...prev,
                currentTurn: nextPlayer,
                currentTurnIndex: nextIndex,
            };
        });
    };

    const handlePass = () => {
        console.log('Pass action');
        // Логика паса будет реализована позже
    };

    const handleTakeCards = () => {
        console.log('Take cards action');
        // Логика взятия карт будет реализована позже
    };

    // Card Draw Actions
    const handleDrawCard = () => {
        if (gameState.deck.length === 0) return;
        
        updateGame((prev) => {
            const newDeck = [...prev.deck];
            const drawnCard = newDeck.pop()!;
            const myCards = [...(prev.hands[myId] || []), drawnCard];
            const cardsDrawn = { ...prev.cardsDrawnThisTurn };
            cardsDrawn[myId] = (cardsDrawn[myId] || 0) + 1;
            
            return {
                ...prev,
                deck: newDeck,
                hands: { ...prev.hands, [myId]: myCards },
                cardsDrawnThisTurn: cardsDrawn,
            };
        });
    };

    const handleShuffleDeck = () => {
        if (gameState.deck.length === 0 && gameState.discardPile.length === 0) return;
        
        updateGame((prev) => {
            const allCards = [...prev.deck, ...prev.discardPile];
            const shuffledDeck = allCards.sort(() => Math.random() - 0.5);
            
            return {
                ...prev,
                deck: shuffledDeck,
                discardPile: [],
            };
        });
    };

    // Faction Actions
    const handleSelectTarget = (targetId: string) => {
        updateGame((prev) => ({
            ...prev,
            selectedTarget: targetId,
        }));
    };

    const handleConfirmTarget = () => {
        if (!gameState.selectedTarget) return;
        
        updateGame((prev) => ({
            ...prev,
            attackTarget: prev.selectedTarget,
            targetSelectionMode: false,
            selectedTarget: undefined,
        }));
    };

    const handleCancelTarget = () => {
        updateGame((prev) => ({
            ...prev,
            targetSelectionMode: false,
            selectedTarget: undefined,
        }));
    };

    // Toggle Target Selection Mode
    const toggleTargetSelection = () => {
        updateGame((prev) => ({
            ...prev,
            targetSelectionMode: !prev.targetSelectionMode,
            selectedTarget: undefined,
        }));
    };

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
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: "hidden"
            }}>
                {/* Game HUD */}
                <GameHUD
                    myId={myId}
                    game={gameState}
                    currentTurn={gameState.currentTurn}
                    onEndTurn={handleEndTurn}
                    onPass={handlePass}
                    onTakeCards={handleTakeCards}
                />

                {/* Duel System */}
                <DuelSystem
                    myId={myId}
                    game={gameState}
                />

                {/* Role System */}
                <RoleSystem
                    myId={myId}
                    game={gameState}
                />

                {/* Card Draw System */}
                <CardDrawSystem
                    myId={myId}
                    game={gameState}
                    onDrawCard={handleDrawCard}
                    onShuffleDeck={handleShuffleDeck}
                />

                {/* Faction System */}
                <FactionSystem
                    myId={myId}
                    game={gameState}
                    onSelectTarget={handleSelectTarget}
                    onConfirmTarget={handleConfirmTarget}
                    onCancelTarget={handleCancelTarget}
                />

                {/* Debug Header */}
                <div style={{ 
                    padding: "12px 20px", 
                    background: "#1a1a2e", 
                    borderBottom: "2px solid #8B0000",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "80px" // Отступ для HUD
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: "#FFD700" }}>🎮 Debug Game Board</h2>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            Карт в руке: {myHand.length} | Слотов на столе: {gameState.slots?.filter(s => s !== null).length || 0} | Колода: {gameState.deck.length}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                            onClick={toggleTargetSelection}
                            style={{
                                padding: "8px 12px",
                                background: gameState.targetSelectionMode ? "#DC143C" : "#7C3AED",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: "pointer"
                            }}
                        >
                            {gameState.targetSelectionMode ? "🎯 Отменить выбор" : "🎯 Выбор цели"}
                        </button>
                        <button 
                            onClick={addRandomCard}
                            style={{
                                padding: "8px 12px",
                                background: "#065f46",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: "pointer"
                            }}
                        >
                            + Карта
                        </button>
                        <button 
                            onClick={resetGame}
                            style={{
                                padding: "8px 12px",
                                background: "#dc2626",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: "pointer"
                            }}
                        >
                            Сброс
                        </button>
                        {onBack && (
                            <button 
                                onClick={onBack}
                                style={{
                                    padding: "8px 12px",
                                    background: "#374151",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer"
                                }}
                            >
                                ← Назад
                            </button>
                        )}
                    </div>
                </div>

                {/* Players Info */}
                <div style={{ padding: 12, background: "#101826" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {Object.keys(gameState.players).map((pid) => (
                            <div key={pid} style={{ 
                                padding: "6px 10px", 
                                borderRadius: 999, 
                                background: pid === myId ? "#065f46" : "#1f2937",
                                fontSize: "12px"
                            }}>
                                {gameState.players[pid]?.name || pid}
                                {pid === myId ? " • вы" : ""}
                                {pid === gameState.hostId ? " 👑" : ""}
                                <span style={{ marginLeft: "8px", opacity: 0.7 }}>
                                    ({gameState.hands[pid]?.length || 0} карт)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center table */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DropZone
                        id="table"
                        cards={gameState.slots || []}
                        onCardClick={(index) => {
                            console.log('Clicked table slot:', index);
                            // Логика взятия карты со стола
                            if (gameState.slots && gameState.slots[index]) {
                                const card = gameState.slots[index];
                                updateGame((prev) => {
                                    const myCards = [...(prev.hands[myId] || []), card!];
                                    const slots = [...prev.slots];
                                    slots[index] = null;
                                    
                                    return {
                                        ...prev,
                                        hands: { ...prev.hands, [myId]: myCards },
                                        slots,
                                    };
                                });
                            }
                        }}
                    />
                </div>

                {/* My hand */}
                <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "80px" }}>
                    <DropZone
                        id="my-hand"
                        cards={myHand}
                        onCardClick={(index) => {
                            console.log('Clicked hand card:', index);
                            // Логика выкладывания карты на стол
                            const card = myHand[index];
                            const freeSlotIndex = gameState.slots?.findIndex(slot => slot === null);
                            
                            if (freeSlotIndex !== undefined && freeSlotIndex >= 0) {
                                updateGame((prev) => {
                                    const myCards = [...(prev.hands[myId] || [])];
                                    myCards.splice(index, 1);
                                    
                                    const slots = [...prev.slots];
                                    slots[freeSlotIndex] = card;
                                    
                                    return {
                                        ...prev,
                                        hands: { ...prev.hands, [myId]: myCards },
                                        slots,
                                    };
                                });
                            }
                        }}
                    />
                </div>

                {/* Debug Info */}
                <div style={{ 
                    padding: "12px 20px", 
                    background: "#1a1a2e", 
                    borderTop: "2px solid #8B0000",
                    fontSize: "12px",
                    opacity: 0.8
                }}>
                    <div>🔄 Drag & Drop активен | 💡 Кликните на карту для быстрого перемещения | 🎮 HUD система активна | ⚔️ Дуэльная система активна | 👑 Система ролей активна | 📚 Система добора карт активна | 🏛️ Система фракций активна</div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeCard ? (
                        <div style={{
                            height: 160,
                            width: 120,
                            borderRadius: 12,
                            border: activeCard.source === 'hand' 
                                ? "2px solid #8B0000" 
                                : "2px solid #334155",
                            background: "linear-gradient(135deg, #2a2a4e 0%, #1e1e3e 100%)",
                            color: "#fff",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "8px",
                            transform: "rotate(5deg) scale(1.05)",
                            boxShadow: "0 8px 25px rgba(139, 0, 0, 0.4)",
                            zIndex: 1000,
                        }}>
                            <div style={{ 
                                fontSize: "12px", 
                                fontWeight: "bold", 
                                textAlign: "center", 
                                marginBottom: "4px",
                                color: "#FFD700"
                            }}>
                                {activeCard.card.name}
                            </div>
                            <div style={{ 
                                fontSize: "18px", 
                                color: "#8B0000", 
                                fontWeight: "bold",
                                textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
                            }}>
                                {activeCard.card.power}
                            </div>
                            <div style={{
                                position: "absolute",
                                top: "-10px",
                                right: "-10px",
                                background: "#8B0000",
                                color: "#fff",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}>
                                {activeCard.card.power}
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default DebugGameBoard;
