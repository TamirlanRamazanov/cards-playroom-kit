import React from 'react';
import type { GameState } from '../types';

interface DuelSystemProps {
    myId: string;
    game: GameState;
}

const DuelSystem: React.FC<DuelSystemProps> = ({
    myId,
    game
}) => {
    const { attackingCard, defendingCard, attackTarget } = game;
    const isUnderAttack = attackTarget === myId;

    // Показываем дуэль только если она активна
    if (!attackingCard && !isUnderAttack) {
        return null;
    }

    return (
        <div style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #8B0000",
            borderRadius: "12px",
            padding: "16px",
            color: "#fff",
            zIndex: 300,
            minWidth: "300px",
            maxWidth: "400px"
        }}>
            {/* Duel Header */}
            <div style={{
                textAlign: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "2px solid #8B0000"
            }}>
                <h3 style={{ margin: 0, color: "#FFD700", fontSize: "18px" }}>
                    ⚔️ ДУЭЛЬ
                </h3>
                {attackingCard && attackTarget && (
                    <div style={{ marginTop: "8px", fontSize: "14px" }}>
                        <span style={{ color: "#DC143C" }}>
                            {game.players[attackTarget]?.name || attackTarget}
                        </span>
                        {" атакует "}
                        <span style={{ color: "#FFD700" }}>
                            {game.players[myId]?.name || myId}
                        </span>
                    </div>
                )}
            </div>

            {/* Attacking Card Display */}
            {attackingCard && (
                <div style={{
                    background: "rgba(220, 20, 60, 0.1)",
                    border: "2px solid #DC143C",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "12px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "12px", color: "#DC143C", marginBottom: "6px" }}>
                        🗡️ АТАКУЮЩАЯ КАРТА
                    </div>
                    <div style={{
                        background: "linear-gradient(135deg, #2a2a4e 0%, #1e1e3e 100%)",
                        border: "2px solid #DC143C",
                        borderRadius: "6px",
                        padding: "8px",
                        display: "inline-block"
                    }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "2px" }}>
                            {attackingCard.name}
                        </div>
                        <div style={{ fontSize: "16px", color: "#DC143C", fontWeight: "bold" }}>
                            {attackingCard.power}
                        </div>
                    </div>
                </div>
            )}

            {/* Defending Card Display */}
            {defendingCard && (
                <div style={{
                    background: "rgba(65, 105, 225, 0.1)",
                    border: "2px solid #4169E1",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "12px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "12px", color: "#4169E1", marginBottom: "6px" }}>
                        🛡️ ЗАЩИЩАЮЩАЯ КАРТА
                    </div>
                    <div style={{
                        background: "linear-gradient(135deg, #2a2a4e 0%, #1e1e3e 100%)",
                        border: "2px solid #4169E1",
                        borderRadius: "6px",
                        padding: "8px",
                        display: "inline-block"
                    }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "2px" }}>
                            {defendingCard.name}
                        </div>
                        <div style={{ fontSize: "16px", color: "#4169E1", fontWeight: "bold" }}>
                            {defendingCard.power}
                        </div>
                    </div>
                </div>
            )}

            {/* Duel Status */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "6px" }}>
                    СТАТУС ДУЭЛИ
                </div>
                <div style={{ fontSize: "14px" }}>
                    {!defendingCard && isUnderAttack ? (
                        <span style={{ color: "#DC143C" }}>
                            🚨 Выберите карту для защиты!
                        </span>
                    ) : defendingCard ? (
                        <span style={{ color: "#4169E1" }}>
                            🛡️ Защита активна
                        </span>
                    ) : (
                        <span style={{ color: "#FFD700" }}>
                            ⚔️ Дуэль в процессе
                        </span>
                    )}
                </div>
            </div>

            {/* Duel Result */}
            {attackingCard && defendingCard && (
                <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "2px solid #FFD700",
                    borderRadius: "8px",
                    padding: "12px",
                    textAlign: "center",
                    marginTop: "12px"
                }}>
                    <div style={{ fontSize: "14px", color: "#FFD700", marginBottom: "6px" }}>
                        ⚔️ РЕЗУЛЬТАТ
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "6px" }}>
                        Атака: <span style={{ color: "#DC143C" }}>{attackingCard.power}</span>
                        {" vs "}
                        Защита: <span style={{ color: "#4169E1" }}>{defendingCard.power}</span>
                    </div>
                    <div style={{ 
                        fontSize: "16px", 
                        fontWeight: "bold",
                        color: attackingCard.power > defendingCard.power ? "#DC143C" : "#4169E1"
                    }}>
                        {attackingCard.power > defendingCard.power 
                            ? "🗡️ Атака пробила защиту!" 
                            : "🛡️ Защита успешна!"}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DuelSystem;
