import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Card } from '../types';

interface DraggableCardProps {
    card: Card;
    index: number;
    isInHand?: boolean;
    isAttacking?: boolean;
    isDefending?: boolean;
    onClick?: () => void;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
    card,
    index,
    isInHand = false,
    isAttacking = false,
    isDefending = false,
    onClick
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `card-${card.id}-${index}`,
        data: {
            card,
            index,
            source: isInHand ? 'hand' : 'table'
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    // Скрываем оригинальную карту во время перетаскивания
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={{
                    height: 160,
                    width: 120,
                    borderRadius: 12,
                    border: isInHand 
                        ? "2px solid #8B0000" 
                        : isAttacking 
                            ? "2px solid #DC143C" 
                            : isDefending 
                                ? "2px solid #4169E1" 
                                : "2px solid #334155",
                    background: "rgba(0, 0, 0, 0.1)",
                    opacity: 0.3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                    transition: "all 0.2s ease",
                    position: "relative",
                }}
            >
                <div style={{ 
                    fontSize: "12px", 
                    fontWeight: "bold", 
                    textAlign: "center", 
                    marginBottom: "4px",
                    color: "#666"
                }}>
                    {card.name}
                </div>
                <div style={{ 
                    fontSize: "18px", 
                    color: "#666", 
                    fontWeight: "bold"
                }}>
                    {card.power}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            style={{
                height: 160,
                width: 120,
                borderRadius: 12,
                border: isInHand 
                    ? "2px solid #8B0000" 
                    : isAttacking 
                        ? "2px solid #DC143C" 
                        : isDefending 
                            ? "2px solid #4169E1" 
                            : "2px solid #334155",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                color: "#fff",
                cursor: "grab",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                transition: "all 0.2s ease",
                position: "relative",
                ...style,
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 0, 0, 0.3)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
            }}
        >
            <div style={{ 
                fontSize: "12px", 
                fontWeight: "bold", 
                textAlign: "center", 
                marginBottom: "4px",
                color: "#fff"
            }}>
                {card.name}
            </div>
            <div style={{ 
                fontSize: "18px", 
                color: "#8B0000", 
                fontWeight: "bold"
            }}>
                {card.power}
            </div>
        </div>
    );
};

export default DraggableCard;
