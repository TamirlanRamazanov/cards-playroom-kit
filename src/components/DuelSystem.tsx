import React, { useState } from 'react';
import type { GameState } from '../types';

interface DuelSystemProps {
    game: GameState;
}

const DuelSystem: React.FC<DuelSystemProps> = ({
    game
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { attackingCard, defendingCard, attackTarget, players } = game;
    
    const hasActiveDuel = attackingCard || defendingCard || attackTarget;

    // Показываем дуэльную систему только если есть активная дуэль
    if (!hasActiveDuel) {
        return null;
    }

    return (
        <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #DC143C",
            borderRadius: "12px",
            color: "#fff",
            zIndex: 250,
            minWidth: isCollapsed ? "60px" : "400px",
            maxWidth: isCollapsed ? "60px" : "500px",
            transition: "all 0.3s ease"
        }}>
            {/* Header with Collapse Button */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: isCollapsed ? "none" : "2px solid #DC143C",
                cursor: "pointer"
            }} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    opacity: isCollapsed ? 0 : 1,
                    transition: "opacity 0.3s ease"
                }}>
                    <h3 style={{ margin: 0, color: "#DC143C", fontSize: "18px" }}>
                        ⚔️ ДУЭЛЬ
                    </h3>
                </div>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "#DC143C",
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
                    {/* Duel Status */}
                    <div style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid #DC143C",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "12px",
                        textAlign: "center"
                    }}>
                        <div style={{ fontSize: "12px", color: "#DC143C", marginBottom: "8px" }}>
                            🎯 СТАТУС ДУЭЛИ
                        </div>
                        
                        {attackingCard && (
                            <div style={{ marginBottom: "8px" }}>
                                <div style={{ fontSize: "11px", color: "#DC143C", marginBottom: "4px" }}>
                                    🗡️ Атакующая карта:
                                </div>
                                <div style={{
                                    background: "rgba(220, 20, 60, 0.1)",
                                    border: "1px solid #DC143C",
                                    borderRadius: "6px",
                                    padding: "8px",
                                    fontSize: "12px"
                                }}>
                                    <span style={{ fontWeight: "bold" }}>{attackingCard.name}</span>
                                    {" - Сила: "}
                                    <span style={{ color: "#DC143C" }}>{attackingCard.power}</span>
                                    {" (Ранг: "}
                                    <span style={{ color: "#FFD700" }}>{attackingCard.power}</span>
                                    {")"}
                                </div>
                            </div>
                        )}

                        {defendingCard && (
                            <div style={{ marginBottom: "8px" }}>
                                <div style={{ fontSize: "11px", color: "#4169E1", marginBottom: "4px" }}>
                                    🛡️ Защищающая карта:
                                </div>
                                <div style={{
                                    background: "rgba(65, 105, 225, 0.1)",
                                    border: "1px solid #4169E1",
                                    borderRadius: "6px",
                                    padding: "8px",
                                    fontSize: "12px"
                                }}>
                                    <span style={{ fontWeight: "bold" }}>{defendingCard.name}</span>
                                    {" - Сила: "}
                                    <span style={{ color: "#4169E1" }}>{defendingCard.power}</span>
                                    {" (Ранг: "}
                                    <span style={{ color: "#FFD700" }}>{defendingCard.power}</span>
                                    {")"}
                                </div>
                            </div>
                        )}

                        {attackTarget && (
                            <div style={{
                                background: "rgba(0, 0, 0, 0.4)",
                                border: "1px solid #FFD700",
                                borderRadius: "6px",
                                padding: "8px",
                                marginTop: "8px"
                            }}>
                                <div style={{ fontSize: "11px", color: "#FFD700", marginBottom: "4px" }}>
                                    🎯 Цель атаки:
                                </div>
                                <div style={{ fontSize: "12px", color: "#FFD700" }}>
                                    {players[attackTarget]?.name || attackTarget}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Duel Result */}
                    {attackingCard && defendingCard && (
                        <div style={{
                            background: "rgba(0, 0, 0, 0.4)",
                            border: "1px solid #FFD700",
                            borderRadius: "6px",
                            padding: "8px",
                            margin: "0 12px 12px 12px",
                            textAlign: "center"
                        }}>
                            <div style={{ fontSize: "11px", color: "#FFD700", marginBottom: "4px" }}>
                                🎯 РЕЗУЛЬТАТ ДУЭЛИ
                            </div>
                            <div style={{ fontSize: "12px" }}>
                                {defendingCard.power >= attackingCard.power ? (
                                    <span style={{ color: "#10B981" }}>
                                        🛡️ Защита успешна! (Сила {defendingCard.power} ≥ {attackingCard.power})
                                    </span>
                                ) : (
                                    <span style={{ color: "#DC143C" }}>
                                        🗡️ Атака пробила защиту! (Сила {attackingCard.power} &gt; {defendingCard.power})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DuelSystem;
