import React from 'react';
import type { GameState } from '../types';

interface FactionSystemProps {
    myId: string;
    game: GameState;
    onSelectTarget: (targetId: string) => void;
    onConfirmTarget: () => void;
    onCancelTarget: () => void;
}

const FactionSystem: React.FC<FactionSystemProps> = ({
    myId,
    game,
    onSelectTarget,
    onConfirmTarget,
    onCancelTarget
}) => {
    const { 
        availableTargets, 
        factionBonuses, 
        targetSelectionMode, 
        selectedTarget,
        factionEffects,
        currentTurn,
        players
    } = game;
    
    const isMyTurn = currentTurn === myId;
    const canSelectTarget = isMyTurn && targetSelectionMode && availableTargets.length > 0;

    // Определяем фракции для текущей карты в руке (если есть)
    const myHand = game.hands[myId] || [];
    const currentCard = myHand[myHand.length - 1]; // Последняя карта в руке
    const currentFactions = currentCard?.factions || [];

    // Показываем систему фракций только если она актуальна
    if (!canSelectTarget && !currentFactions.length) {
        return null;
    }

    return (
        <div style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #7C3AED",
            borderRadius: "12px",
            padding: "16px",
            color: "#fff",
            zIndex: 300,
            minWidth: "300px",
            maxWidth: "400px"
        }}>
            {/* Faction System Header */}
            <div style={{
                textAlign: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "2px solid #7C3AED"
            }}>
                <h3 style={{ margin: 0, color: "#A78BFA", fontSize: "18px" }}>
                    🏛️ СИСТЕМА ФРАКЦИЙ
                </h3>
                <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
                    {targetSelectionMode ? "Выбор цели для атаки" : "Фракции карт"}
                </div>
            </div>

            {/* Current Card Factions */}
            {currentFactions.length > 0 && (
                <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid #7C3AED",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "12px", color: "#A78BFA", marginBottom: "6px" }}>
                        🎯 ТЕКУЩАЯ КАРТА
                    </div>
                    <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                        <span style={{ color: "#FFD700" }}>
                            {currentCard?.name}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                        {currentFactions.map((factionId) => (
                            <div
                                key={factionId}
                                style={{
                                    background: "rgba(124, 58, 237, 0.2)",
                                    border: "1px solid #7C3AED",
                                    borderRadius: "6px",
                                    padding: "6px 10px",
                                    fontSize: "12px",
                                    color: "#A78BFA",
                                    fontWeight: "bold"
                                }}
                            >
                                Фракция {factionId}
                                {factionBonuses[factionId] && (
                                    <span style={{ marginLeft: "4px", color: "#10B981" }}>
                                        +{factionBonuses[factionId]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Target Selection */}
            {targetSelectionMode && (
                <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid #DC143C",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px"
                }}>
                    <div style={{ fontSize: "12px", color: "#DC143C", marginBottom: "8px", textAlign: "center" }}>
                        🎯 ВЫБОР ЦЕЛИ ДЛЯ АТАКИ
                    </div>
                    
                    {/* Available Targets */}
                    <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "11px", color: "#FFD700", marginBottom: "6px" }}>
                            Доступные цели:
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {availableTargets.map((targetId) => {
                                const isSelected = selectedTarget === targetId;
                                const isMe = targetId === myId;
                                return (
                                    <button
                                        key={targetId}
                                        onClick={() => onSelectTarget(targetId)}
                                        style={{
                                            background: isSelected ? "#DC143C" : "rgba(0, 0, 0, 0.4)",
                                            border: isSelected ? "2px solid #FFD700" : "1px solid #334155",
                                            borderRadius: "6px",
                                            padding: "8px 12px",
                                            color: "#fff",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            textAlign: "left",
                                            opacity: isMe ? 0.5 : 1
                                        }}
                                        disabled={isMe}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ color: isSelected ? "#FFD700" : "#fff" }}>
                                                {isSelected ? "🎯" : "👤"}
                                            </span>
                                            <span style={{ fontWeight: "bold" }}>
                                                {players[targetId]?.name || targetId}
                                            </span>
                                            {isMe && <span style={{ color: "#666" }}>(вы)</span>}
                                            {isSelected && <span style={{ color: "#FFD700" }}>• ВЫБРАНО</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Target Actions */}
                    {selectedTarget && (
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={onConfirmTarget}
                                style={{
                                    flex: 1,
                                    background: "#10B981",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                ✅ Подтвердить
                            </button>
                            <button
                                onClick={onCancelTarget}
                                style={{
                                    flex: 1,
                                    background: "#6B7280",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                ❌ Отмена
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Faction Effects */}
            {currentFactions.length > 0 && (
                <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px"
                }}>
                    <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "8px", textAlign: "center" }}>
                        ⚡ ЭФФЕКТЫ ФРАКЦИЙ
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.8, lineHeight: "1.4" }}>
                        {currentFactions.map((factionId) => {
                            const effects = factionEffects[factionId] || [];
                            return effects.length > 0 ? (
                                <div key={factionId} style={{ marginBottom: "6px" }}>
                                    <span style={{ color: "#A78BFA", fontWeight: "bold" }}>
                                        Фракция {factionId}:
                                    </span>
                                    <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                                        {effects.map((effect, index) => (
                                            <li key={index} style={{ marginBottom: "2px" }}>
                                                {effect}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null;
                        })}
                        {currentFactions.every(f => !factionEffects[f]?.length) && (
                            <div style={{ textAlign: "center", opacity: 0.6 }}>
                                Нет специальных эффектов
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Faction Bonuses Info */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "6px" }}>
                    📊 БОНУСЫ ФРАКЦИЙ
                </div>
                <div style={{ fontSize: "11px", opacity: 0.8, lineHeight: "1.4" }}>
                    {Object.entries(factionBonuses).length > 0 ? (
                        Object.entries(factionBonuses).map(([factionId, bonus]) => (
                            <div key={factionId} style={{ marginBottom: "4px" }}>
                                <span style={{ color: "#A78BFA" }}>Фракция {factionId}</span>
                                {" → "}
                                <span style={{ color: "#10B981" }}>+{bonus} к силе</span>
                            </div>
                        ))
                    ) : (
                        <div>Бонусы фракций не настроены</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FactionSystem;
