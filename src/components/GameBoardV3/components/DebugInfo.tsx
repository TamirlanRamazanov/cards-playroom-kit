import React from 'react';
import type { Card } from '../../../types';

interface DebugInfoProps {
    effectiveGameMode: 'attack' | 'defense';
    myHandLength: number;
    deckLength: number;
    activeCard: { card: Card; index: number; source: string } | null;
    hoveredAttackCard: number | null;
    hoveredDefenseCard: number | null;
    mousePosition: { x: number; y: number } | null;
    defenseCardsCount: number;
    slotsCount: number;
    showSensorCircle: boolean;
}

/**
 * Компонент отладочной информации
 * Отображает информацию о состоянии игры для отладки
 */
export const DebugInfo: React.FC<DebugInfoProps> = ({
    effectiveGameMode,
    myHandLength,
    deckLength,
    activeCard,
    hoveredAttackCard,
    hoveredDefenseCard,
    mousePosition,
    defenseCardsCount,
    slotsCount,
    showSensorCircle,
}) => {
    return (
        <div style={{ 
            padding: "12px 20px", 
            background: "#1a1a2e", 
            borderTop: "2px solid #8B0000",
            fontSize: "12px",
            opacity: 0.8
        }}>
            <div>🔄 Play V3 активен | {effectiveGameMode === 'attack' ? '⚔️ Режим атаки' : '🛡️ Режим защиты'} | 🃏 {myHandLength}/6 карт | 📚 Колода: {deckLength} карт | 🖱️ Drag & Drop активен</div>
            <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.6 }}>
                🎯 Отладка: activeCard={activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Наведение атаки={hoveredAttackCard !== null ? `карта ${hoveredAttackCard}` : 'нет'} | Наведение защиты={hoveredDefenseCard !== null ? `карта ${hoveredDefenseCard}` : 'нет'} | Мышь={mousePosition ? `${mousePosition.x},${mousePosition.y}` : 'нет'} | Защита={defenseCardsCount} карт | Атака={slotsCount} карт
            </div>
            <div style={{ marginTop: "2px", fontSize: "9px", opacity: 0.5, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                🖱️ Сенсор: {effectiveGameMode === 'attack' ? 'ищет карты (защита > атака)' : 'ищет карты атаки'} | Радиус: 80px | Курсор: {mousePosition ? `${mousePosition.x}, ${mousePosition.y}` : 'нет'} | Активная карта: {activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Отладка: {showSensorCircle ? 'включена' : 'выключена'}
            </div>
        </div>
    );
};

