import React, { useState } from 'react';
import type { GameState } from '../types';

interface GameHUDProps {
    myId: string;
    game: GameState;
    currentTurn?: string;
    onEndTurn: () => void;
    onPass: () => void;
    onTakeCards: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({
    myId,
    game,
    currentTurn,
    onEndTurn,
    onPass,
    onTakeCards
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { players, hands, currentTurnIndex, turnOrder } = game;
    
    const isMyTurn = currentTurn === myId;
    const myHand = hands[myId] || [];
    const playerCount = Object.keys(players).length;

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            borderBottom: "2px solid #7C3AED",
            color: "#fff",
            zIndex: 200,
            transition: "all 0.3s ease",
            height: isCollapsed ? "40px" : "80px"
        }}>
            {/* Header with Collapse Button */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 16px",
                cursor: "pointer"
            }} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    opacity: isCollapsed ? 0 : 1,
                    transition: "opacity 0.3s ease"
                }}>
                    <h2 style={{ margin: 0, fontSize: "18px", color: "#A78BFA" }}>
                        🎮 ИГРОВАЯ ИНФОРМАЦИЯ
                    </h2>
                    <div style={{ fontSize: "14px", opacity: 0.8 }}>
                        Игроков: {playerCount} | Карт в руке: {myHand.length}
                    </div>
                </div>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "#A78BFA",
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
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 16px 8px 16px"
                }}>
                    {/* Turn Info */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                    }}>
                        <div style={{
                            padding: "8px 12px",
                            background: isMyTurn ? "rgba(16, 185, 129, 0.2)" : "rgba(107, 114, 128, 0.2)",
                            border: `1px solid ${isMyTurn ? "#10B981" : "#6B7280"}`,
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: isMyTurn ? "#10B981" : "#6B7280"
                        }}>
                            {isMyTurn ? "🎯 Ваш ход" : "⏳ Ожидание"}
                        </div>
                        
                        {currentTurn && (
                            <div style={{
                                padding: "8px 12px",
                                background: "rgba(124, 58, 237, 0.2)",
                                border: "1px solid #7C3AED",
                                borderRadius: "8px",
                                fontSize: "14px"
                            }}>
                                Ход: {players[currentTurn]?.name || currentTurn}
                            </div>
                        )}
                        
                        {turnOrder && currentTurnIndex !== undefined && (
                            <div style={{
                                padding: "8px 12px",
                                background: "rgba(59, 130, 246, 0.2)",
                                border: "1px solid #3B82F6",
                                borderRadius: "8px",
                                fontSize: "14px"
                            }}>
                                {currentTurnIndex + 1} / {turnOrder.length}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {isMyTurn && (
                        <div style={{
                            display: "flex",
                            gap: "8px"
                        }}>
                            <button
                                onClick={onTakeCards}
                                style={{
                                    padding: "8px 12px",
                                    background: "#3B82F6",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                📚 Взять карты
                            </button>
                            
                            <button
                                onClick={onPass}
                                style={{
                                    padding: "8px 12px",
                                    background: "#6B7280",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                🚫 Пас
                            </button>
                            
                            <button
                                onClick={onEndTurn}
                                style={{
                                    padding: "8px 12px",
                                    background: "#10B981",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                ✅ Завершить ход
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameHUD;
