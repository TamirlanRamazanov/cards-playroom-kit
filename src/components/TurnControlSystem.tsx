import React, { useState } from 'react';
import type { GameState } from '../types';

interface TurnControlSystemProps {
    myId: string;
    game: GameState;
    onEndTurn: () => void;
    onPass: () => void;
    onTakeCards: () => void;
    onAttack: () => void;
    onDefend: () => void;
}

const TurnControlSystem: React.FC<TurnControlSystemProps> = ({
    myId,
    game,
    onEndTurn,
    onPass,
    onTakeCards,
    onAttack,
    onDefend
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { 
        currentTurn, 
        turnPhase, 
        turnActions,
        turnHistory,
        currentTurnIndex,
        turnOrder
    } = game;
    
    const isMyTurn = currentTurn === myId;
    const canControl = isMyTurn && turnActions;

    // Показываем систему управления ходом только если это наш ход
    if (!canControl) {
        return null;
    }

    const getTurnPhaseText = (phase?: string) => {
        switch (phase) {
            case "draw": return "🎯 Фаза добора карт";
            case "play": return "🎮 Фаза игры";
            case "attack": return "⚔️ Фаза атаки";
            case "defend": return "🛡️ Фаза защиты";
            case "end": return "🏁 Завершение хода";
            default: return "⏳ Ожидание";
        }
    };

    const getNextPlayerName = () => {
        if (!turnOrder || currentTurnIndex === undefined) return "Неизвестно";
        const nextIndex = (currentTurnIndex + 1) % turnOrder.length;
        return game.players[turnOrder[nextIndex]]?.name || "Игрок";
    };

    return (
        <div style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #10B981",
            borderRadius: "12px",
            color: "#fff",
            zIndex: 300,
            minWidth: isCollapsed ? "60px" : "320px",
            maxWidth: isCollapsed ? "60px" : "400px",
            transition: "all 0.3s ease"
        }}>
            {/* Header with Collapse Button */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: isCollapsed ? "none" : "2px solid #10B981",
                cursor: "pointer"
            }} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    opacity: isCollapsed ? 0 : 1,
                    transition: "opacity 0.3s ease"
                }}>
                    <h3 style={{ margin: 0, color: "#10B981", fontSize: "16px" }}>
                        🎮 УПРАВЛЕНИЕ ХОДОМ
                    </h3>
                </div>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "#10B981",
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
                    {/* Turn Status */}
                    <div style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid #10B981",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "12px",
                        textAlign: "center"
                    }}>
                        <div style={{ fontSize: "12px", color: "#10B981", marginBottom: "6px" }}>
                            🎯 СТАТУС ХОДА
                        </div>
                        <div style={{ fontSize: "14px", marginBottom: "8px", color: "#fff" }}>
                            <span style={{ color: "#10B981", fontWeight: "bold" }}>
                                {getTurnPhaseText(turnPhase)}
                            </span>
                        </div>
                        <div style={{ fontSize: "11px", opacity: 0.8 }}>
                            Следующий: {getNextPlayerName()}
                        </div>
                    </div>

                    {/* Turn Actions */}
                    <div style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "0 12px 12px 12px"
                    }}>
                        <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "8px", textAlign: "center" }}>
                            ⚡ ДОСТУПНЫЕ ДЕЙСТВИЯ
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {/* Draw Phase Actions */}
                            {turnPhase === "draw" && (
                                <>
                                    {turnActions.canTakeCards && (
                                        <button
                                            onClick={onTakeCards}
                                            style={{
                                                width: "100%",
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
                                    )}
                                </>
                            )}

                            {/* Play Phase Actions */}
                            {turnPhase === "play" && (
                                <>
                                    {turnActions.canAttack && (
                                        <button
                                            onClick={onAttack}
                                            style={{
                                                width: "100%",
                                                padding: "8px 12px",
                                                background: "#DC143C",
                                                border: "none",
                                                borderRadius: "6px",
                                                color: "#fff",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            ⚔️ Атаковать
                                        </button>
                                    )}
                                    
                                    {turnActions.canPass && (
                                        <button
                                            onClick={onPass}
                                            style={{
                                                width: "100%",
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
                                    )}
                                </>
                            )}

                            {/* Defend Phase Actions */}
                            {turnPhase === "defend" && (
                                <>
                                    {turnActions.canDefend && (
                                        <button
                                            onClick={onDefend}
                                            style={{
                                                width: "100%",
                                                padding: "8px 12px",
                                                background: "#4169E1",
                                                border: "none",
                                                borderRadius: "6px",
                                                color: "#fff",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            🛡️ Защищаться
                                        </button>
                                    )}
                                </>
                            )}

                            {/* End Turn Button - Always Available */}
                            {turnActions.canEndTurn && (
                                <button
                                    onClick={onEndTurn}
                                    style={{
                                        width: "100%",
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
                            )}
                        </div>
                    </div>

                    {/* Turn History */}
                    {turnHistory && turnHistory.length > 0 && (
                        <div style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            padding: "12px",
                            margin: "0 12px 12px 12px",
                            maxHeight: "120px",
                            overflowY: "auto"
                        }}>
                            <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "8px", textAlign: "center" }}>
                                📜 ИСТОРИЯ ХОДОВ
                            </div>
                            <div style={{ fontSize: "10px", opacity: 0.8, lineHeight: "1.3" }}>
                                {turnHistory.slice(-5).map((action, index) => (
                                    <div key={index} style={{ marginBottom: "4px" }}>
                                        <span style={{ color: "#A78BFA" }}>
                                            {game.players[action.playerId]?.name || action.playerId}
                                        </span>
                                        {" - "}
                                        <span style={{ color: "#10B981" }}>
                                            {action.action}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TurnControlSystem;
