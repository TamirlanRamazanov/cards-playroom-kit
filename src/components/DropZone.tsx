import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Card } from '../types';
import DraggableCard from './DraggableCard';

interface DropZoneProps {
    id: string;
    cards: (Card | null)[];
    isAttacking?: boolean;
    isDefending?: boolean;
    onCardClick?: (index: number) => void;
}

const DropZone: React.FC<DropZoneProps> = ({
    id,
    cards,
    isAttacking = false,
    isDefending = false,
    onCardClick
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                minHeight: 160,
                padding: "20px",
                borderRadius: 12,
                background: isOver 
                    ? "rgba(139, 0, 0, 0.1)" 
                    : "rgba(0, 0, 0, 0.1)",
                border: isOver 
                    ? "2px dashed #8B0000" 
                    : "2px dashed #334155",
                transition: "all 0.2s ease",
                justifyContent: "center",
            }}
        >
            {cards.map((card, index) => (
                card ? (
                    <DraggableCard
                        key={`${id}-card-${index}`}
                        card={card}
                        index={index}
                        isInHand={id === 'my-hand'}
                        isAttacking={isAttacking}
                        isDefending={isDefending}
                        onClick={() => onCardClick?.(index)}
                    />
                ) : (
                    <div
                        key={`${id}-empty-${index}`}
                        style={{
                            height: 160,
                            width: 120,
                            borderRadius: 12,
                            border: "2px dashed #334155",
                            background: "rgba(0, 0, 0, 0.05)",
                            color: "#fff",
                            cursor: "default",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "8px",
                            transition: "all 0.2s ease",
                            position: "relative",
                        }}
                    >
                        <span style={{ 
                            fontSize: "14px", 
                            opacity: 0.5,
                            color: "#666"
                        }}>
                            Пусто
                        </span>
                    </div>
                )
            ))}
        </div>
    );
};

export default DropZone;
