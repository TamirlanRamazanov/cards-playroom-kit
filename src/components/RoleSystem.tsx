import React, { useState } from 'react';
import type { GameState } from '../types';

interface RoleSystemProps {
    myId: string;
    game: GameState;
}

const RoleSystem: React.FC<RoleSystemProps> = ({
    myId,
    game
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { players, currentTurn, turnOrder, currentTurnIndex } = game;
    
    const playerIds = Object.keys(players || {});
    if (playerIds.length === 0) return null;

    // Определяем роли игроков
    const getPlayerRoles = (playerId: string) => {
        if (!turnOrder || currentTurnIndex === undefined) return { role: "unknown", priority: 0 };
        
        const playerIndex = turnOrder.indexOf(playerId);
        if (playerIndex === -1) return { role: "unknown", priority: 0 };
        
        if (playerId === currentTurn) {
            return { role: "attacker", priority: 1 };
        }
        
        const nextIndex = (currentTurnIndex + 1) % turnOrder.length;
        if (playerIndex === nextIndex) {
            return { role: "defender", priority: 2 };
        }
        
        return { role: "observer", priority: 3 };
    };

    return (
        <div style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #8B5CF6",
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
                borderBottom: isCollapsed ? "none" : "2px solid #8B5CF6",
                cursor: "pointer"
            }} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    opacity: isCollapsed ? 0 : 1,
                    transition: "opacity 0.3s ease"
                }}>
                    <h3 style={{ margin: 0, color: "#8B5CF6", fontSize: "16px" }}>
                        👑 СИСТЕМА РОЛЕЙ
                    </h3>
                </div>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "#8B5CF6",
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
                <div style={{ padding: "12px" }}>
                    {playerIds.map((playerId) => {
                        const { role, priority } = getPlayerRoles(playerId);
                        const player = players[playerId];
                        const isMe = playerId === myId;
                        
                        const getRoleInfo = (role: string) => {
                            switch (role) {
                                case "attacker":
                                    return {
                                        emoji: "🗡️",
                                        color: "#DC143C",
                                        text: "Атакующий",
                                        description: "Ваш ход - атакуйте или играйте карты"
                                    };
                                case "defender":
                                    return {
                                        emoji: "🛡️",
                                        color: "#4169E1",
                                        text: "Следующий",
                                        description: "Следующий ход - готовьтесь к защите"
                                    };
                                case "observer":
                                    return {
                                        emoji: "👁️",
                                        color: "#6B7280",
                                        text: "Наблюдатель",
                                        description: "Ожидайте своего хода"
                                    };
                                default:
                                    return {
                                        emoji: "❓",
                                        color: "#6B7280",
                                        text: "Неизвестно",
                                        description: "Роль не определена"
                                    };
                            }
                        };
                        
                        const roleInfo = getRoleInfo(role);
                        
                        return (
                            <div
                                key={playerId}
                                style={{
                                    background: "rgba(0, 0, 0, 0.3)",
                                    border: `1px solid ${roleInfo.color}`,
                                    borderRadius: "8px",
                                    padding: "10px",
                                    marginBottom: "8px",
                                    opacity: isMe ? 1 : 0.8
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "6px"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}>
                                        <span style={{ fontSize: "16px" }}>
                                            {roleInfo.emoji}
                                        </span>
                                        <span style={{
                                            fontSize: "12px",
                                            fontWeight: "bold",
                                            color: roleInfo.color
                                        }}>
                                            {roleInfo.text}
                                        </span>
                                    </div>
                                    
                                    <div style={{
                                        background: roleInfo.color,
                                        color: "#fff",
                                        borderRadius: "50%",
                                        width: "20px",
                                        height: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "10px",
                                        fontWeight: "bold"
                                    }}>
                                        {priority}
                                    </div>
                                </div>
                                
                                <div style={{
                                    fontSize: "11px",
                                    color: "#fff",
                                    marginBottom: "4px"
                                }}>
                                    <span style={{ fontWeight: "bold" }}>
                                        {player?.name || playerId}
                                    </span>
                                    {isMe && <span style={{ color: "#10B981" }}> (вы)</span>}
                                </div>
                                
                                <div style={{
                                    fontSize: "10px",
                                    opacity: 0.7,
                                    color: roleInfo.color
                                }}>
                                    {roleInfo.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RoleSystem;
