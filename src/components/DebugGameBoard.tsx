import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import type { GameState } from "../types";
import DropZone from "./DropZone";
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
            CARDS_DATA[3], // Usopp
            CARDS_DATA[4], // Sanji
            CARDS_DATA[5], // Chopper
        ],
        "player-2": [
            CARDS_DATA[6], // Robin
            CARDS_DATA[7], // Franky
            CARDS_DATA[8], // Brook
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
});

const DebugGameBoard: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(createDebugGameState);
    const myId = "debug-host";
    const myHand = gameState.hands[myId] || [];

    const updateGame = (updater: (prev: GameState) => GameState) => {
        setGameState(updater);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination } = result;
        
        console.log('Drag result:', { source, destination });
        
        // Перемещение карты из руки на стол
        if (source.droppableId === 'my-hand' && destination.droppableId === 'table') {
            const cardIndex = parseInt(source.index.toString());
            const slotIndex = parseInt(destination.index.toString());
            
            if (cardIndex >= 0 && slotIndex >= 0 && cardIndex < myHand.length) {
                const card = myHand[cardIndex];
                
                updateGame((prev) => {
                    if (!prev.slots) return prev;
                    
                    // Проверяем, что слот пустой
                    if (prev.slots[slotIndex] !== null) return prev;
                    
                    const myCards = [...(prev.hands[myId] || [])];
                    myCards.splice(cardIndex, 1);
                    
                    const slots = [...prev.slots];
                    slots[slotIndex] = card;
                    
                    return {
                        ...prev,
                        hands: { ...prev.hands, [myId]: myCards },
                        slots,
                    };
                });
            }
        }
        
        // Взятие карты со стола
        if (source.droppableId === 'table' && destination.droppableId === 'my-hand') {
            const slotIndex = parseInt(source.index.toString());
            
            if (slotIndex >= 0 && gameState.slots && gameState.slots[slotIndex]) {
                const card = gameState.slots[slotIndex];
                
                updateGame((prev) => {
                    if (!prev.slots) return prev;
                    
                    const myCards = [...(prev.hands[myId] || []), card!];
                    const slots = [...prev.slots];
                    slots[slotIndex] = null;
                    
                    return {
                        ...prev,
                        hands: { ...prev.hands, [myId]: myCards },
                        slots,
                    };
                });
            }
        }
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

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div style={{ 
                minHeight: "100vh", 
                display: "flex", 
                flexDirection: "column", 
                background: "#0b1020", 
                color: "#fff" 
            }}>
                {/* Debug Header */}
                <div style={{ 
                    padding: "12px 20px", 
                    background: "#1a1a2e", 
                    borderBottom: "2px solid #8B0000",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: "#FFD700" }}>🎮 Debug Game Board</h2>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            Карт в руке: {myHand.length} | Слотов на столе: {gameState.slots?.filter(s => s !== null).length || 0}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
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
                        maxCards={6}
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
                <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DropZone
                        id="my-hand"
                        cards={myHand}
                        maxCards={myHand.length}
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
                    <div>🔄 Drag & Drop активен | 💡 Кликните на карту для быстрого перемещения</div>
                </div>
            </div>
        </DragDropContext>
    );
};

export default DebugGameBoard;
