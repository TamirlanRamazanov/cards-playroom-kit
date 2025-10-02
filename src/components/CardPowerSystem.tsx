import React, { useState } from 'react';
import type { GameState } from '../types';

interface CardPowerSystemProps {
    myId: string;
    game: GameState;
}

const CardPowerSystem: React.FC<CardPowerSystemProps> = ({
    myId,
    game
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { 
        minCardPower, 
        maxCardPower, 
        canDefendWithEqualPower,
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
            color: "#fff",
            zIndex: 300,
            minWidth: isCollapsed ? "60px" : "320px",
            maxWidth: isCollapsed ? "60px" : "500px",
            transition: "all 0.3s ease"
        }}>
            {/* Header with Collapse Button */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: isCollapsed ? "none" : "2px solid #FFD700",
                cursor: "pointer"
            }} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    opacity: isCollapsed ? 0 : 1,
                    transition: "opacity 0.3s ease"
                }}>
                    <h3 style={{ margin: 0, color: "#FFD700", fontSize: "16px" }}>
                        ⚔️ СИСТЕМА СИЛЫ КАРТ
                    </h3>
                </div>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "#FFD700",
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
                    {/* Current Card Analysis */}
                    {currentCard && (
                        <div style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            border: "1px solid #FFD700",
                            borderRadius: "8px",
                            padding: "12px",
                            margin: "12px",
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
                                    <span style={{ color: "#FFD700" }}>Сила:</span> {currentCard.power}
                                </div>
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                                            {currentCard.power >= 90 ? "🌟 Элитная карта" :
                            currentCard.power >= 80 ? "⭐ Сильная карта" :
                            currentCard.power >= 70 ? "💪 Хорошая карта" :
                            currentCard.power >= 60 ? "📊 Средняя карта" : "🔰 Базовая карта"}
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
                            margin: "0 12px 12px 12px"
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
                        </div>
                    )}

                    {/* Power Rules */}
                    <div style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "0 12px 12px 12px"
                    }}>
                        <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "8px", textAlign: "center" }}>
                            📋 ПРАВИЛА СИЛЫ КАРТ
                        </div>
                        <div style={{ fontSize: "11px", opacity: 0.8, lineHeight: "1.4" }}>
                            <div style={{ marginBottom: "4px" }}>
                                • <strong>Сила карт:</strong> от {minCardPower} до {maxCardPower}
                            </div>
                            <div style={{ marginBottom: "4px" }}>
                                • <strong>Защита:</strong> карта с рангом ≥ атакующей может защищаться
                            </div>
                            <div style={{ marginBottom: "4px" }}>
                                • <strong>Равная сила:</strong> {canDefendWithEqualPower ? "карта может отбить" : "карта не может отбить"}
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
                        margin: "0 12px 12px 12px",
                        textAlign: "center"
                    }}>
                        <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "8px" }}>
                            📊 РАСПРЕДЕЛЕНИЕ РАНГОВ
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", opacity: 0.8 }}>
                            <div>
                                <div style={{ color: "#10B981" }}>🔰 {minCardPower}-59</div>
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
                                <div style={{ color: "#EF4444" }}>🌟 90-{maxCardPower}</div>
                                <div>Элитная</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CardPowerSystem;
