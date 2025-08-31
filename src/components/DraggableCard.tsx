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
                background: isDragging 
                    ? "linear-gradient(135deg, #2a2a4e 0%, #1e1e3e 100%)"
                    : "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                color: "#fff",
                cursor: isDragging ? "grabbing" : "grab",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                transition: "all 0.2s ease",
                transform: isDragging ? "rotate(5deg) scale(1.05)" : "none",
                boxShadow: isDragging 
                    ? "0 8px 25px rgba(139, 0, 0, 0.4)" 
                    : "0 2px 8px rgba(0, 0, 0, 0.2)",
                zIndex: isDragging ? 1000 : 1,
                ...style,
            }}
            onMouseOver={(e) => {
                if (!isDragging) {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 0, 0, 0.3)";
                }
            }}
            onMouseOut={(e) => {
                if (!isDragging) {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
                }
            }}
        >
            <div style={{ 
                fontSize: "12px", 
                fontWeight: "bold", 
                textAlign: "center", 
                marginBottom: "4px",
                color: isDragging ? "#FFD700" : "#fff"
            }}>
                {card.name}
            </div>
            <div style={{ 
                fontSize: "18px", 
                color: "#8B0000", 
                fontWeight: "bold",
                textShadow: isDragging ? "1px 1px 2px rgba(0,0,0,0.8)" : "none"
            }}>
                {card.power}
            </div>
            {isDragging && (
                <div style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    background: "#8B0000",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold"
                }}>
                    {card.power}
                </div>
            )}
        </div>
    );
};

export default DraggableCard;
