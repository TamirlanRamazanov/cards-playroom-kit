import React from 'react';
import type { GameState } from '../types';

interface GameHUDProps {
    myId: string;
    game: GameState;
    currentTurn?: string;
    onEndTurn?: () => void;
    onPass?: () => void;
    onTakeCards?: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({
    myId,
    game,
    currentTurn,
    onEndTurn,
    onPass,
    onTakeCards
}) => {
    const playerIds = Object.keys(game.players || {});
    const myHand = game.hands[myId] || [];
    const isMyTurn = currentTurn === myId;

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            pointerEvents: "none"
        }}>
            {/* Top HUD Bar */}
            <div style={{
                background: "linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(26, 26, 46, 0.8) 100%)",
                backdropFilter: "blur(10px)",
                borderBottom: "2px solid #8B0000",
                padding: "12px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pointerEvents: "auto"
            }}>
                {/* Game Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                        background: "#065f46",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "bold"
                    }}>
                        🎮 Игра
                    </div>
                    
                    {currentTurn && (
                        <div style={{
                            background: isMyTurn ? "#dc2626" : "#374151",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            animation: isMyTurn ? "pulse 2s infinite" : "none"
                        }}>
                            {isMyTurn ? "🎯 Ваш ход" : `Ход: ${game.players[currentTurn]?.name || currentTurn}`}
                        </div>
                    )}
                </div>

                {/* Players Info */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {playerIds.map((pid) => (
                        <div key={pid} style={{
                            padding: "6px 10px",
                            borderRadius: "20px",
                            background: pid === myId 
                                ? "#065f46" 
                                : pid === currentTurn 
                                    ? "#dc2626" 
                                    : "#1f2937",
                            fontSize: "12px",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            border: pid === currentTurn ? "2px solid #ffd700" : "none"
                        }}>
                            <span>{game.players[pid]?.name || pid}</span>
                            {pid === myId && <span>• вы</span>}
                            {pid === game.hostId && <span>👑</span>}
                            <span style={{ opacity: 0.7 }}>
                                ({game.hands[pid]?.length || 0})
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom HUD Bar */}
            <div style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(0deg, rgba(26, 26, 46, 0.95) 0%, rgba(26, 26, 46, 0.8) 100%)",
                backdropFilter: "blur(10px)",
                borderTop: "2px solid #8B0000",
                padding: "12px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pointerEvents: "auto"
            }}>
                {/* My Hand Info */}
                <div style={{
                    background: "#1a1a2e",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    border: "2px solid #8B0000",
                    color: "#fff"
                }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
                        🃏 Моя рука
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                        Карт: {myHand.length} | Общая сила: {myHand.reduce((sum, card) => sum + card.power, 0)}
                    </div>
                </div>

                {/* Game Controls */}
                {isMyTurn && (
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={onEndTurn}
                            style={{
                                padding: "8px 16px",
                                background: "#065f46",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "bold"
                            }}
                        >
                            ✅ Завершить ход
                        </button>
                        
                        <button
                            onClick={onPass}
                            style={{
                                padding: "8px 16px",
                                background: "#dc2626",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "bold"
                            }}
                        >
                            🚫 Пас
                        </button>
                        
                        <button
                            onClick={onTakeCards}
                            style={{
                                padding: "8px 16px",
                                background: "#7c3aed",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "bold"
                            }}
                        >
                            📥 Взять карты
                        </button>
                    </div>
                )}

                {/* Game Stats */}
                <div style={{
                    background: "#1a1a2e",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    border: "2px solid #334155",
                    color: "#fff"
                }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
                        📊 Статистика
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                        Игроков: {playerIds.length} | Карт на столе: {game.slots?.filter(s => s !== null).length || 0}
                    </div>
                </div>
            </div>

            {/* Turn Indicator */}
            {isMyTurn && (
                <div style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(220, 38, 38, 0.9)",
                    color: "#fff",
                    padding: "16px 32px",
                    borderRadius: "12px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    animation: "pulse 1s infinite",
                    pointerEvents: "none",
                    zIndex: 200
                }}>
                    🎯 ВАШ ХОД!
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes pulse {
                        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
                        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    }
                `
            }} />
        </div>
    );
};

export default GameHUD;
