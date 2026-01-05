import React from 'react';
import type { GameState } from '../../../types';

interface PlayersInfoProps {
    gameState: GameState;
    currentPlayerId: string;
}

/**
 * Компонент информации об игроках
 * Отображает список игроков с их ролями и количеством карт
 */
export const PlayersInfo: React.FC<PlayersInfoProps> = ({
    gameState,
    currentPlayerId,
}) => {
    const playerIds = Object.keys(gameState.players || {});
    
    const getRoleEmoji = (role?: string): string => {
        switch (role) {
            case 'attacker': return '⚔️';
            case 'co-attacker': return '🗡️';
            case 'defender': return '🛡️';
            case 'observer': return '👁️';
            default: return '❓';
        }
    };
    
    const getRoleName = (role?: string): string => {
        switch (role) {
            case 'attacker': return 'Атакующий';
            case 'co-attacker': return 'Со-атакующий';
            case 'defender': return 'Защитник';
            case 'observer': return 'Наблюдатель';
            default: return 'Не назначена';
        }
    };
    
    return (
        <div style={{ padding: 12, background: "#101826" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {playerIds.map((pid) => {
                    const playerRole = gameState.playerRoles?.[pid];
                    
                    return (
                        <div key={pid} style={{ 
                            padding: "6px 10px", 
                            borderRadius: "6px", 
                            background: pid === currentPlayerId ? "#065f46" : "#1f2937",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <span>
                                {gameState.players[pid]?.name || pid}
                                {pid === currentPlayerId ? " • вы" : ""}
                                {pid === gameState.hostId ? " 👑" : ""}
                                {pid === gameState.currentTurn ? " ⏳" : ""}
                            </span>
                            {playerRole && (
                                <span style={{ 
                                    opacity: 0.9,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "2px 6px",
                                    background: "rgba(59, 130, 246, 0.2)",
                                    borderRadius: "4px",
                                    border: "1px solid rgba(59, 130, 246, 0.3)"
                                }}>
                                    {getRoleEmoji(playerRole)} {getRoleName(playerRole)}
                                </span>
                            )}
                            <span style={{ opacity: 0.7 }}>
                                ({gameState.hands[pid]?.length || 0} карт)
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

