import React, { useState } from 'react';
import type { GameState } from '../types';

interface CardDrawSystemProps {
    myId: string;
    game: GameState;
    onDrawCard: () => void;
    onShuffleDeck: () => void;
}

const CardDrawSystem: React.FC<CardDrawSystemProps> = ({
    myId,
    game,
    onDrawCard,
    onShuffleDeck
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { 
        deck, 
        discardPile, 
        maxHandSize, 
        cardsDrawnThisTurn, 
        canDrawCards,
        currentTurn,
        hands
    } = game;
    
    const isMyTurn = currentTurn === myId;
    const myHand = hands[myId] || [];
    const canDraw = isMyTurn && canDrawCards && myHand.length < maxHandSize;

    return (
        <div style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #3B82F6",
            borderRadius: "12px",
            color: "#fff",
            zIndex: 300,
            minWidth: isCollapsed ? "60px" : "280px",
            maxWidth: isCollapsed ? "60px" : "350px",
            transition: "all 0.3s ease"
        }}>
            {/* Header with Collapse Button */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: isCollapsed ? "none" : "2px solid #3B82F6",
                cursor: "pointer"
            }} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    opacity: isCollapsed ? 0 : 1,
                    transition: "opacity 0.3s ease"
                }}>
                    <h3 style={{ margin: 0, color: "#3B82F6", fontSize: "16px" }}>
                        📚 СИСТЕМА ДОБОРА КАРТ
                    </h3>
                </div>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "#3B82F6",
                        fontSize: "18px",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        transition: "transform 0.3s ease"
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(!isCollapsed);
                    }}
                >
                    {isCollapsed ? "▶️" : "◀️"}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Deck Status */}
                    <div style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid #3B82F6",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "12px",
                        textAlign: "center"
                    }}>
                        <div style={{ fontSize: "12px", color: "#3B82F6", marginBottom: "6px" }}>
                            🃏 СТАТУС КОЛОДЫ
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px"
                        }}>
                            <div style={{
                                background: "rgba(59, 130, 246, 0.2)",
                                border: "1px solid #3B82F6",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "12px"
                            }}>
                                <span style={{ color: "#3B82F6" }}>Колода:</span> {deck.length}
                            </div>
                            <div style={{
                                background: "rgba(107, 114, 128, 0.2)",
                                border: "1px solid #6B7280",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "12px"
                            }}>
                                <span style={{ color: "#6B7280" }}>Сброс:</span> {discardPile.length}
                            </div>
                        </div>
                    </div>

                    {/* Hand Status */}
                    <div style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid #10B981",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "0 12px 12px 12px"
                    }}>
                        <div style={{ fontSize: "12px", color: "#10B981", marginBottom: "6px", textAlign: "center" }}>
                            🃏 МОЯ РУКА
                        </div>
                        <div style={{
                            background: "rgba(16, 185, 129, 0.2)",
                            border: "1px solid #10B981",
                            borderRadius: "6px",
                            padding: "8px",
                            textAlign: "center",
                            marginBottom: "8px"
                        }}>
                            <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
                                {myHand.length} / {maxHandSize}
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                Карт в руке
                            </div>
                        </div>
                        
                        {cardsDrawnThisTurn[myId] && (
                            <div style={{
                                background: "rgba(59, 130, 246, 0.2)",
                                border: "1px solid #3B82F6",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "11px",
                                textAlign: "center"
                            }}>
                                <span style={{ color: "#3B82F6" }}>
                                    Взято за этот ход: {cardsDrawnThisTurn[myId]}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "0 12px 12px 12px"
                    }}>
                        <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "8px", textAlign: "center" }}>
                            ⚡ ДЕЙСТВИЯ
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <button
                                onClick={onDrawCard}
                                disabled={!canDraw}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    background: canDraw ? "#3B82F6" : "#6B7280",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: canDraw ? "pointer" : "not-allowed",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                📚 Взять карту
                            </button>
                            
                            <button
                                onClick={onShuffleDeck}
                                disabled={deck.length === 0 && discardPile.length === 0}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    background: (deck.length > 0 || discardPile.length > 0) ? "#8B5CF6" : "#6B7280",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: (deck.length > 0 || discardPile.length > 0) ? "pointer" : "not-allowed",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                🔀 Перемешать колоду
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CardDrawSystem;
