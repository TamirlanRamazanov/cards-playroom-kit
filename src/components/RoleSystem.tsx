import React from 'react';
import type { GameState } from '../types';

interface RoleSystemProps {
    myId: string;
    game: GameState;
}

interface PlayerRole {
    id: string;
    name: string;
    role: 'attacker' | 'defender' | 'observer' | 'none';
    priority: number;
    isActive: boolean;
}

const RoleSystem: React.FC<RoleSystemProps> = ({
    myId,
    game
}) => {
    const { currentTurn, attackingCard, defendingCard, attackTarget } = game;
    const playerIds = Object.keys(game.players || {});

    // Определяем роли игроков
    const getPlayerRoles = (): PlayerRole[] => {
        return playerIds.map((pid) => {
            let role: PlayerRole['role'] = 'none';
            let priority = 0;
            let isActive = false;

            if (attackingCard && attackTarget === pid) {
                role = 'attacker';
                priority = 1;
                isActive = true;
            } else if (attackTarget === pid && !defendingCard) {
                role = 'defender';
                priority = 2;
                isActive = true;
            } else if (attackTarget === pid && defendingCard) {
                role = 'defender';
                priority = 3;
                isActive = false;
            } else if (currentTurn === pid && !attackingCard) {
                role = 'observer';
                priority = 4;
                isActive = true;
            } else {
                role = 'observer';
                priority = 5;
                isActive = false;
            }

            return {
                id: pid,
                name: game.players[pid]?.name || pid,
                role,
                priority,
                isActive
            };
        }).sort((a, b) => a.priority - b.priority);
    };

    const playerRoles = getPlayerRoles();
    const myRole = playerRoles.find(pr => pr.id === myId);

    // Показываем систему ролей только если есть активная дуэль или ход
    if (!attackingCard && !myRole?.isActive) {
        return null;
    }

    const getRoleIcon = (role: PlayerRole['role']) => {
        switch (role) {
            case 'attacker': return '🗡️';
            case 'defender': return '🛡️';
            case 'observer': return '👁️';
            default: return '⚪';
        }
    };

    const getRoleColor = (role: PlayerRole['role']) => {
        switch (role) {
            case 'attacker': return '#DC143C';
            case 'defender': return '#4169E1';
            case 'observer': return '#FFD700';
            default: return '#666';
        }
    };

    const getRoleDescription = (role: PlayerRole['role']) => {
        switch (role) {
            case 'attacker': return 'Атакующий';
            case 'defender': return 'Защищающийся';
            case 'observer': return 'Наблюдатель';
            default: return 'Без роли';
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #8B0000",
            borderRadius: "12px",
            padding: "16px",
            color: "#fff",
            zIndex: 300,
            minWidth: "280px",
            maxWidth: "350px"
        }}>
            {/* Role System Header */}
            <div style={{
                textAlign: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "2px solid #8B0000"
            }}>
                <h3 style={{ margin: 0, color: "#FFD700", fontSize: "18px" }}>
                    👑 РОЛИ И ПРИОРИТЕТЫ
                </h3>
                <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
                    Приоритет: 1 (высший) → 5 (низший)
                </div>
            </div>

            {/* Current Phase Info */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "6px" }}>
                    ТЕКУЩАЯ ФАЗА
                </div>
                <div style={{ fontSize: "14px" }}>
                    {attackingCard ? (
                        <span style={{ color: "#DC143C" }}>
                            ⚔️ Дуэль в процессе
                        </span>
                    ) : (
                        <span style={{ color: "#FFD700" }}>
                            🎯 Выбор действия
                        </span>
                    )}
                </div>
            </div>

            {/* Player Roles List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {playerRoles.map((playerRole) => (
                    <div
                        key={playerRole.id}
                        style={{
                            background: playerRole.isActive 
                                ? "rgba(0, 0, 0, 0.4)" 
                                : "rgba(0, 0, 0, 0.2)",
                            border: playerRole.id === myId 
                                ? "2px solid #FFD700" 
                                : playerRole.isActive 
                                    ? "2px solid #8B0000" 
                                    : "1px solid #334155",
                            borderRadius: "8px",
                            padding: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            opacity: playerRole.isActive ? 1 : 0.7
                        }}
                    >
                        {/* Priority Badge */}
                        <div style={{
                            background: getRoleColor(playerRole.role),
                            color: "#fff",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold",
                            flexShrink: 0
                        }}>
                            {playerRole.priority}
                        </div>

                        {/* Role Icon */}
                        <div style={{
                            fontSize: "20px",
                            flexShrink: 0
                        }}>
                            {getRoleIcon(playerRole.role)}
                        </div>

                        {/* Player Info */}
                        <div style={{ flex: 1 }}>
                            <div style={{ 
                                fontSize: "14px", 
                                fontWeight: "bold",
                                color: playerRole.id === myId ? "#FFD700" : "#fff"
                            }}>
                                {playerRole.name}
                                {playerRole.id === myId && " (вы)"}
                                {playerRole.id === game.hostId && " 👑"}
                            </div>
                            <div style={{ 
                                fontSize: "12px", 
                                color: getRoleColor(playerRole.role),
                                fontWeight: "bold"
                            }}>
                                {getRoleDescription(playerRole.role)}
                                {playerRole.isActive && " • АКТИВЕН"}
                            </div>
                        </div>

                        {/* Status Indicator */}
                        <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: playerRole.isActive ? "#10B981" : "#6B7280",
                            flexShrink: 0
                        }} />
                    </div>
                ))}
            </div>

            {/* Action Hints */}
            {myRole && (
                <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid #FFD700",
                    borderRadius: "8px",
                    padding: "12px",
                    marginTop: "16px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "6px" }}>
                        💡 ВАШЕ ДЕЙСТВИЕ
                    </div>
                    <div style={{ fontSize: "14px" }}>
                        {myRole.role === 'attacker' && (
                            <span style={{ color: "#DC143C" }}>
                                Вы атакуете! Перетащите карту на стол для атаки
                            </span>
                        )}
                        {myRole.role === 'defender' && !defendingCard && (
                            <span style={{ color: "#4169E1" }}>
                                Вас атакуют! Перетащите карту на стол для защиты
                            </span>
                        )}
                        {myRole.role === 'defender' && defendingCard && (
                            <span style={{ color: "#4169E1" }}>
                                Защита активна! Ожидайте результат дуэли
                            </span>
                        )}
                        {myRole.role === 'observer' && myRole.isActive && (
                            <span style={{ color: "#FFD700" }}>
                                Ваш ход! Выберите действие
                            </span>
                        )}
                        {myRole.role === 'observer' && !myRole.isActive && (
                            <span style={{ color: "#666" }}>
                                Ожидайте своего хода
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleSystem;
