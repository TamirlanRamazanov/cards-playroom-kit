import React from 'react';
import DropZone from '../../DropZone';
import type { Card } from '../../../types';

interface GameTableProps {
    slots: (Card | null)[];
    gameMode: 'attack' | 'defense';
    hoveredAttackCard: number | null;
    activeCard: { card: Card; index: number; source: string } | null;
    mousePosition: { x: number; y: number } | null;
    activeDropZone: string | null;
    onCardClick: (index: number) => void;
    onCardHover: (index: number) => void;
    onCardLeave: () => void;
    onMousePositionUpdate: (position: { x: number; y: number } | null) => void;
    onDropZoneActivate: (zoneId: string) => void;
    onDropZoneDeactivate: () => void;
    dropZoneTimeout: number | null;
    defenseCardsCount?: number;
}

/**
 * Компонент игрового стола
 * Отображает слоты для карт атаки
 */
export const GameTable: React.FC<GameTableProps> = ({
    slots,
    gameMode,
    hoveredAttackCard,
    activeCard,
    activeDropZone,
    onCardClick,
    onCardHover,
    onCardLeave,
    onMousePositionUpdate,
    onDropZoneActivate,
    onDropZoneDeactivate,
    dropZoneTimeout,
    defenseCardsCount = 0,
}) => {
    return (
        <div style={{ 
            padding: "20px", 
            background: "#1f2937", 
            borderRadius: "12px",
            border: "2px solid #4B5563",
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        }}>
            <div style={{ fontSize: "16px", marginBottom: "16px", color: "#FFD700" }}>
                🎮 Слоты на столе:
            </div>
            <DropZone
                id="table"
                cards={slots}
                minVisibleCards={1}
                gameMode={gameMode}
                onCardClick={onCardClick}
                onCardHover={onCardHover}
                onCardLeave={onCardLeave}
                highlightedCardIndex={hoveredAttackCard}
                onMousePositionUpdate={onMousePositionUpdate}
                activeCard={activeCard}
                onDropZoneActivate={(zoneId) => {
                    if (dropZoneTimeout) {
                        clearTimeout(dropZoneTimeout);
                    }
                    onDropZoneActivate(zoneId);
                }}
                onDropZoneDeactivate={() => {
                    if (dropZoneTimeout) {
                        clearTimeout(dropZoneTimeout);
                    }
                    setTimeout(() => {
                        onDropZoneDeactivate();
                    }, 100);
                }}
                activeDropZone={activeDropZone}
            />
            
            {defenseCardsCount > 0 && (
                <div style={{ 
                    fontSize: "12px", 
                    color: "#93c5fd", 
                    marginTop: "8px",
                    textAlign: "center"
                }}>
                    🎯 Карты защиты: {defenseCardsCount} слотов
                </div>
            )}
        </div>
    );
};

