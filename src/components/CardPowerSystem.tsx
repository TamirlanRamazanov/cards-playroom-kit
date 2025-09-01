import React from 'react';
import type { GameState } from '../types';

interface CardPowerSystemProps {
    myId: string;
    game: GameState;
}

const CardPowerSystem: React.FC<CardPowerSystemProps> = ({
    myId,
    game
}) => {
    const { 
        minCardRank, 
        maxCardRank, 
        canDefendWithEqualRank,
        currentTurn,
        attackingCard,
        defendingCard,
        attackTarget
    } = game;
    
    const isMyTurn = currentTurn === myId;
    const isUnderAttack = attackTarget === myId;
    const hasActiveDuel = attackingCard || isUnderAttack;

    // Показываем систему силы только если есть активная дуэль или это наш ход
    if (!hasActiveDuel && !isMyTurn) {
        return null;
    }

    // Определяем карту в руке для анализа
    const myHand = game.hands[myId] || [];
    const currentCard = myHand[myHand.length - 1]; // Последняя карта в руке

    return (
        <div style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #FFD700",
            borderRadius: "12px",
            padding: "16px",
            color: "#fff",
            zIndex: 300,
            minWidth: "320px",
            maxWidth: "500px"
        }}>
            {/* Card Power Header */}
            <div style={{
                textAlign: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "2px solid #FFD700"
            }}>
                <h3 style={{ margin: 0, color: "#FFD700", fontSize: "18px" }}>
                    ⚔️ СИСТЕМА СИЛЫ КАРТ
                </h3>
                <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
                    Ранги: {minCardRank} - {maxCardRank}
                </div>
            </div>

            {/* Current Card Analysis */}
            {currentCard && (
                <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid #FFD700",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "6px" }}>
                        🎯 ТЕКУЩАЯ КАРТА В РУКЕ
                    </div>
                    <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                        <span style={{ color: "#fff", fontWeight: "bold" }}>
                            {currentCard.name}
                        </span>
                    </div>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "8px"
                    }}>
                        <div style={{
                            background: "rgba(255, 215, 0, 0.2)",
                            border: "1px solid #FFD700",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px"
                        }}>
                            <span style={{ color: "#FFD700" }}>Сила:</span> {currentCard.power}
                        </div>
                        <div style={{
                            background: "rgba(255, 215, 0, 0.2)",
                            border: "1px solid #FFD700",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px"
                        }}>
                            <span style={{ color: "#FFD700" }}>Ранг:</span> {currentCard.rank}
                        </div>
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.8 }}>
                        {currentCard.rank >= 90 ? "🌟 Элитная карта" : 
                         currentCard.rank >= 80 ? "⭐ Сильная карта" :
                         currentCard.rank >= 70 ? "💪 Хорошая карта" :
                         currentCard.rank >= 60 ? "📊 Средняя карта" : "🔰 Базовая карта"}
                    </div>
                </div>
            )}

            {/* Duel Status */}
            {hasActiveDuel && (
                <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid #DC143C",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px"
                }}>
                    <div style={{ fontSize: "12px", color: "#DC143C", marginBottom: "8px", textAlign: "center" }}>
                        ⚔️ СТАТУС ДУЭЛИ
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
                                <span style={{ color: "#FFD700" }}>{attackingCard.rank}</span>
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
                                <span style={{ color: "#FFD700" }}>{defendingCard.rank}</span>
                                {")"}
                            </div>
                        </div>
                    )}

                    {/* Duel Result */}
                    {attackingCard && defendingCard && (
                        <div style={{
                            background: "rgba(0, 0, 0, 0.4)",
                            border: "1px solid #FFD700",
                            borderRadius: "6px",
                            padding: "8px",
                            textAlign: "center",
                            marginTop: "8px"
                        }}>
                            <div style={{ fontSize: "11px", color: "#FFD700", marginBottom: "4px" }}>
                                🎯 РЕЗУЛЬТАТ ДУЭЛИ
                            </div>
                            <div style={{ fontSize: "12px" }}>
                                {defendingCard.rank >= attackingCard.rank ? (
                                    <span style={{ color: "#10B981" }}>
                                        🛡️ Защита успешна! (Ранг {defendingCard.rank} ≥ {attackingCard.rank})
                                    </span>
                                ) : (
                                    <span style={{ color: "#DC143C" }}>
                                        🗡️ Атака пробила защиту! (Ранг {attackingCard.rank} &gt; {defendingCard.rank})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Power Rules */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px"
            }}>
                <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "8px", textAlign: "center" }}>
                    📋 ПРАВИЛА СИЛЫ КАРТ
                </div>
                <div style={{ fontSize: "11px", opacity: 0.8, lineHeight: "1.4" }}>
                    <div style={{ marginBottom: "4px" }}>
                        • <strong>Ранги карт:</strong> от {minCardRank} до {maxCardRank}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                        • <strong>Защита:</strong> карта с рангом ≥ атакующей может защищаться
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                        • <strong>Равный ранг:</strong> {canDefendWithEqualRank ? "карта может отбить" : "карта не может отбить"}
                    </div>
                    <div>
                        • <strong>Победа:</strong> атакующая карта побеждает только при более высоком ранге
                    </div>
                </div>
            </div>

            {/* Rank Distribution */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "8px" }}>
                    📊 РАСПРЕДЕЛЕНИЕ РАНГОВ
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", opacity: 0.8 }}>
                    <div>
                        <div style={{ color: "#10B981" }}>🔰 {minCardRank}-59</div>
                        <div>Базовая</div>
                    </div>
                    <div>
                        <div style={{ color: "#3B82F6" }}>📊 60-69</div>
                        <div>Средняя</div>
                    </div>
                    <div>
                        <div style={{ color: "#8B5CF6" }}>💪 70-79</div>
                        <div>Хорошая</div>
                    </div>
                    <div>
                        <div style={{ color: "#F59E0B" }}>⭐ 80-89</div>
                        <div>Сильная</div>
                    </div>
                    <div>
                        <div style={{ color: "#EF4444" }}>🌟 90-{maxCardRank}</div>
                        <div>Элитная</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardPowerSystem;
