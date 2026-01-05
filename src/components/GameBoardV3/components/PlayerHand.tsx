import React from 'react';
import DropZone from '../../DropZone';
import type { Card } from '../../../types';

interface PlayerHandProps {
    cards: Card[];
    defenseCards: (Card | null)[];
    activeCard: { card: Card; index: number; source: string } | null;
    onMousePositionUpdate: (position: { x: number; y: number } | null) => void;
}

/**
 * Компонент руки игрока
 * Отображает карты в руке игрока
 */
export const PlayerHand: React.FC<PlayerHandProps> = ({
    cards,
    defenseCards,
    activeCard,
    onMousePositionUpdate,
}) => {
    return (
        <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
            <div style={{
                maxWidth: "100%",
                overflow: "hidden"
            }}>
                <DropZone
                    id="my-hand"
                    cards={cards}
                    maxVisibleCards={10}
                    defenseCards={defenseCards}
                    onMousePositionUpdate={onMousePositionUpdate}
                    activeCard={activeCard}
                />
            </div>
        </div>
    );
};

