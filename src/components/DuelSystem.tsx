import React from 'react';
import type { Card, GameState } from '../types';

interface DuelSystemProps {
    myId: string;
    game: GameState;
    onAttack: (attackingCard: Card, targetPlayer: string) => void;
    onDefend: (defendingCard: Card) => void;
    onPass: () => void;
}

const DuelSystem: React.FC<DuelSystemProps> = ({
    myId,
    game,
    onAttack,
    onDefend,
    onPass
}) => {
    const { attackingCard, defendingCard, attackTarget, currentTurn } = game;
    const isMyTurn = currentTurn === myId;
    const isUnderAttack = attackTarget === myId;
    const canDefend = isUnderAttack && !defendingCard;
    const canAttack = isMyTurn && !attackingCard && !defendingCard;

    const myHand = game.hands[myId] || [];
    const otherPlayers = Object.keys(game.players).filter(pid => pid !== myId);

    if (!attackingCard && !isUnderAttack && !canAttack) {
        return null; // Не показываем дуэль, если она не активна
    }

    return (
        <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "3px solid #8B0000",
            borderRadius: "16px",
            padding: "24px",
            color: "#fff",
            zIndex: 300,
            minWidth: "400px",
            maxWidth: "600px"
        }}>
            {/* Duel Header */}
            <div style={{
                textAlign: "center",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "2px solid #8B0000"
            }}>
                <h2 style={{ margin: 0, color: "#FFD700", fontSize: "24px" }}>
                    ⚔️ ДУЭЛЬ
                </h2>
                {attackingCard && attackTarget && (
                    <div style={{ marginTop: "8px", fontSize: "16px" }}>
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
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "14px", color: "#DC143C", marginBottom: "8px" }}>
                        🗡️ АТАКУЮЩАЯ КАРТА
                    </div>
                    <div style={{
                        background: "linear-gradient(135deg, #2a2a4e 0%, #1e1e3e 100%)",
                        border: "2px solid #DC143C",
                        borderRadius: "8px",
                        padding: "12px",
                        display: "inline-block"
                    }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
                            {attackingCard.name}
                        </div>
                        <div style={{ fontSize: "20px", color: "#DC143C", fontWeight: "bold" }}>
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
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "14px", color: "#4169E1", marginBottom: "8px" }}>
                        🛡️ ЗАЩИЩАЮЩАЯ КАРТА
                    </div>
                    <div style={{
                        background: "linear-gradient(135deg, #2a2a4e 0%, #1e1e3e 100%)",
                        border: "2px solid #4169E1",
                        borderRadius: "8px",
                        padding: "12px",
                        display: "inline-block"
                    }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
                            {defendingCard.name}
                        </div>
                        <div style={{ fontSize: "20px", color: "#4169E1", fontWeight: "bold" }}>
                            {defendingCard.power}
                        </div>
                    </div>
                </div>
            )}

            {/* Duel Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Attack Action */}
                {canAttack && (
                    <div>
                        <div style={{ fontSize: "14px", color: "#FFD700", marginBottom: "8px" }}>
                            🗡️ Выберите карту для атаки и цель:
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                            {myHand.map((card, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        // Показываем выбор цели
                                        const target = otherPlayers[0]; // Упрощенно - атакуем первого игрока
                                        onAttack(card, target);
                                    }}
                                    style={{
                                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                                        border: "2px solid #8B0000",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        color: "#fff",
                                        cursor: "pointer",
                                        minWidth: "80px",
                                        transition: "all 0.2s ease"
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = "scale(1.05)";
                                        e.currentTarget.style.borderColor = "#DC143C";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.borderColor = "#8B0000";
                                    }}
                                >
                                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                                        {card.name}
                                    </div>
                                    <div style={{ fontSize: "16px", color: "#8B0000", fontWeight: "bold" }}>
                                        {card.power}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Defend Action */}
                {canDefend && (
                    <div>
                        <div style={{ fontSize: "14px", color: "#4169E1", marginBottom: "8px" }}>
                            🛡️ Выберите карту для защиты:
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                            {myHand.map((card, index) => (
                                <button
                                    key={index}
                                    onClick={() => onDefend(card)}
                                    style={{
                                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                                        border: "2px solid #4169E1",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        color: "#fff",
                                        cursor: "pointer",
                                        minWidth: "80px",
                                        transition: "all 0.2s ease"
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = "scale(1.05)";
                                        e.currentTarget.style.borderColor = "#87CEEB";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.borderColor = "#4169E1";
                                    }}
                                >
                                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                                        {card.name}
                                    </div>
                                    <div style={{ fontSize: "16px", color: "#4169E1", fontWeight: "bold" }}>
                                        {card.power}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pass Action */}
                {canDefend && (
                    <button
                        onClick={onPass}
                        style={{
                            background: "#DC143C",
                            border: "none",
                            borderRadius: "8px",
                            padding: "12px 24px",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "bold",
                            width: "100%"
                        }}
                    >
                        🚫 Пас (принять урон)
                    </button>
                )}

                {/* Duel Result */}
                {attackingCard && defendingCard && (
                    <div style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "2px solid #FFD700",
                        borderRadius: "12px",
                        padding: "16px",
                        textAlign: "center"
                    }}>
                        <div style={{ fontSize: "18px", color: "#FFD700", marginBottom: "8px" }}>
                            ⚔️ РЕЗУЛЬТАТ ДУЭЛИ
                        </div>
                        <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                            Атака: <span style={{ color: "#DC143C" }}>{attackingCard.power}</span>
                            {" vs "}
                            Защита: <span style={{ color: "#4169E1" }}>{defendingCard.power}</span>
                        </div>
                        <div style={{ 
                            fontSize: "20px", 
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
        </div>
    );
};

export default DuelSystem;
