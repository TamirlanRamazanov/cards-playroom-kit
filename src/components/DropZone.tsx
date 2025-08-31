import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import type { Card } from '../types';

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
    return (
        <Droppable droppableId={id} direction="horizontal">
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 16,
                        minHeight: 160,
                        padding: "20px",
                        borderRadius: 12,
                        background: snapshot.isDraggingOver 
                            ? "rgba(139, 0, 0, 0.1)" 
                            : "rgba(0, 0, 0, 0.1)",
                        border: snapshot.isDraggingOver 
                            ? "2px dashed #8B0000" 
                            : "2px dashed #334155",
                        transition: "all 0.2s ease",
                        justifyContent: "center",
                    }}
                >
                    {cards.map((card, index) => (
                        <Draggable 
                            key={`${id}-card-${index}`} 
                            draggableId={`${id}-card-${index}`} 
                            index={index}
                        >
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => onCardClick?.(index)}
                                    style={{
                                        height: 160,
                                        width: 120,
                                        borderRadius: 12,
                                        border: card 
                                            ? (isAttacking 
                                                ? "2px solid #DC143C" 
                                                : isDefending 
                                                    ? "2px solid #4169E1" 
                                                    : "2px solid #334155")
                                            : "2px dashed #334155",
                                        background: card 
                                            ? (isAttacking 
                                                ? "rgba(220, 20, 60, 0.1)" 
                                                : isDefending 
                                                    ? "rgba(65, 105, 225, 0.1)" 
                                                    : "rgba(51, 65, 85, 0.1)")
                                            : "rgba(0, 0, 0, 0.05)",
                                        color: "#fff",
                                        cursor: card ? "pointer" : "default",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "8px",
                                        transition: "all 0.2s ease",
                                        position: "relative",
                                        transform: snapshot.isDragging ? "rotate(5deg)" : "none",
                                        ...provided.draggableProps.style,
                                    }}
                                >
                                    {card ? (
                                        <>
                                            <div style={{ 
                                                fontSize: "12px", 
                                                fontWeight: "bold", 
                                                textAlign: "center", 
                                                marginBottom: "4px" 
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
                                        </>
                                    ) : (
                                        <span style={{ 
                                            fontSize: "14px", 
                                            opacity: 0.5,
                                            color: "#666"
                                        }}>
                                            Пусто
                                        </span>
                                    )}
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default DropZone;
