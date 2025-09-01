import React from 'react';
import type { GameState } from '../types';

interface CardDrawSystemProps {
    myId: string;
    game: GameState;
    onDrawCard: () => void;
    onShuffleDeck: () => void;
}

const CardDrawSystem: React.FC<CardDrawSystemProps> = ({
    myId,
    game,
    onDrawCard,
    onShuffleDeck
}) => {
    const { 
        deck, 
        discardPile, 
        maxHandSize, 
        cardsDrawnThisTurn, 
        canDrawCards,
        currentTurn 
    } = game;
    
    const myHand = game.hands[myId] || [];
    const isMyTurn = currentTurn === myId;
    const cardsDrawnByMe = cardsDrawnThisTurn[myId] || 0;
    const canDraw = isMyTurn && canDrawCards && deck.length > 0;
    const handSize = myHand.length;
    const isHandFull = handSize >= maxHandSize;

    // Показываем систему добора только если она актуальна
    if (!isMyTurn && deck.length === 0 && discardPile.length === 0) {
        return null;
    }

    return (
        <div style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid #065f46",
            borderRadius: "12px",
            padding: "16px",
            color: "#fff",
            zIndex: 300,
            minWidth: "280px",
            maxWidth: "350px"
        }}>
            {/* Card Draw Header */}
            <div style={{
                textAlign: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "2px solid #065f46"
            }}>
                <h3 style={{ margin: 0, color: "#10B981", fontSize: "18px" }}>
                    📚 СИСТЕМА ДОБОРА КАРТ
                </h3>
                <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
                    Колода: {deck.length} | Сброс: {discardPile.length}
                </div>
            </div>

            {/* Deck Status */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "12px", color: "#10B981", marginBottom: "6px" }}>
                    📖 СТАТУС КОЛОДЫ
                </div>
                <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                    <span style={{ color: "#10B981" }}>
                        🃏 Карт в колоде: {deck.length}
                    </span>
                </div>
                <div style={{ fontSize: "14px" }}>
                    <span style={{ color: "#6B7280" }}>
                        🗑️ Карт в сбросе: {discardPile.length}
                    </span>
                </div>
            </div>

            {/* Hand Status */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: handSize >= maxHandSize ? "1px solid #DC143C" : "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "6px" }}>
                    🃏 ВАША РУКА
                </div>
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                    <span style={{ 
                        color: handSize >= maxHandSize ? "#DC143C" : "#10B981" 
                    }}>
                        Карт в руке: {handSize}
                    </span>
                    {" / "}
                    <span style={{ color: "#FFD700" }}>
                        {maxHandSize}
                    </span>
                </div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>
                    Добрано за ход: {cardsDrawnByMe}
                </div>
                {isHandFull && (
                    <div style={{ 
                        fontSize: "12px", 
                        color: "#DC143C", 
                        marginTop: "4px",
                        fontWeight: "bold"
                    }}>
                        ⚠️ Рука полная!
                    </div>
                )}
            </div>

            {/* Draw Actions */}
            {canDraw && (
                <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid #10B981",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "12px", color: "#10B981", marginBottom: "6px" }}>
                        🎯 ДОСТУПНЫЕ ДЕЙСТВИЯ
                    </div>
                    <button
                        onClick={onDrawCard}
                        disabled={isHandFull}
                        style={{
                            background: isHandFull ? "#6B7280" : "#10B981",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 16px",
                            color: "#fff",
                            cursor: isHandFull ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            fontWeight: "bold",
                            width: "100%",
                            marginBottom: "8px",
                            opacity: isHandFull ? 0.5 : 1
                        }}
                    >
                        🃏 Взять карту
                    </button>
                    <div style={{ fontSize: "12px", opacity: 0.7 }}>
                        {isHandFull 
                            ? "Рука полная, нельзя брать карты" 
                            : "Нажмите, чтобы взять карту из колоды"}
                    </div>
                </div>
            )}

            {/* Deck Management */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "6px" }}>
                    ⚙️ УПРАВЛЕНИЕ КОЛОДОЙ
                </div>
                <button
                    onClick={onShuffleDeck}
                    disabled={deck.length === 0 && discardPile.length === 0}
                    style={{
                        background: (deck.length === 0 && discardPile.length === 0) ? "#6B7280" : "#7C3AED",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        color: "#fff",
                        cursor: (deck.length === 0 && discardPile.length === 0) ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                        width: "100%",
                        opacity: (deck.length === 0 && discardPile.length === 0) ? 0.5 : 1
                    }}
                >
                    🔀 Перемешать колоду
                </button>
                <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "6px" }}>
                    {deck.length === 0 && discardPile.length === 0 
                        ? "Нет карт для перемешивания" 
                        : "Перемешивает сброс в колоду"}
                </div>
            </div>

            {/* Draw Rules Info */}
            <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "12px",
                marginTop: "16px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "12px", color: "#FFD700", marginBottom: "6px" }}>
                    📋 ПРАВИЛА ДОБОРА
                </div>
                <div style={{ fontSize: "11px", opacity: 0.8, lineHeight: "1.4" }}>
                    • Максимум карт в руке: {maxHandSize}
                    <br />
                    • Добор доступен только в свой ход
                    <br />
                    • При полной руке добор невозможен
                    <br />
                    • Колода пуста? Перемешайте сброс!
                </div>
            </div>
        </div>
    );
};

export default CardDrawSystem;
