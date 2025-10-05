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
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onTouchStart?: () => void;
    onTouchEnd?: () => void;
    isHighlighted?: boolean; // Для подсветки карт атаки в режиме защиты
    isDefenseHighlighted?: boolean; // Для подсветки карт защиты в режиме атаки
    isDraggable?: boolean; // Можно ли перетаскивать карту
    disableMouseEvents?: boolean; // Отключить события мыши (для карт защиты в режиме атаки)
}

const DraggableCard: React.FC<DraggableCardProps> = ({
    card,
    index,
    isInHand = false,
    isAttacking = false,
    isDefending = false,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
    isHighlighted = false,
    isDefenseHighlighted = false,
    isDraggable = true,
    disableMouseEvents = false
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `card-${card.id}-${index}`,
        data: {
            card,
            index,
            source: isInHand ? 'hand' : 'table'
        },
        disabled: !isDraggable
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
                    flexShrink: 0,
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
            style={{
                position: "relative",
                padding: isAttacking ? "10px" : "0px", // Невидимая область вокруг карт атаки
                zIndex: isAttacking ? 200 : 10,
            }}
            data-card-index={index} // Для поиска карты по индексу
            // В режиме защиты hover обрабатывается через useDroppable, не через события мыши
            onMouseEnter={undefined}
            onMouseLeave={undefined}
        >
            <div
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                onClick={disableMouseEvents ? undefined : onClick}
                onMouseEnter={disableMouseEvents ? undefined : onMouseEnter}
                onMouseLeave={disableMouseEvents ? undefined : onMouseLeave}
                onTouchStart={disableMouseEvents ? undefined : onTouchStart}
                onTouchEnd={disableMouseEvents ? undefined : onTouchEnd}
            style={{
                height: isAttacking ? 180 : 160, // Карты атаки больше
                width: isAttacking ? 140 : 120,  // Карты атаки шире
                borderRadius: 12,
                border: isHighlighted 
                    ? "2px solid #8B5CF6" // Фиолетовая подсветка для карт атаки в режиме защиты
                    : isDefenseHighlighted 
                        ? "2px solid #32CD32" // Зеленая подсветка для карт защиты в режиме атаки
                        : isInHand 
                            ? "2px solid #8B0000" 
                            : isAttacking 
                                ? "2px solid #DC143C" 
                                : isDefending 
                                    ? "2px solid #4169E1" 
                                    : "2px solid #334155",
                background: isHighlighted 
                    ? "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)" // Фиолетовый градиент для подсветки
                    : isDefenseHighlighted 
                        ? "linear-gradient(135deg, #1F4E1F 0%, #32CD32 100%)" // Зеленый градиент для подсветки защиты
                        : "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                color: "#fff",
                cursor: "grab",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                transition: "all 0.2s ease",
                position: "relative",
                flexShrink: 0,
                boxShadow: isHighlighted 
                    ? "0 0 20px rgba(139, 92, 246, 0.6)" // Фиолетовое свечение
                    : isDefenseHighlighted 
                        ? "0 0 20px rgba(50, 205, 50, 0.6)" // Зеленое свечение
                        : "0 2px 8px rgba(0, 0, 0, 0.2)",
                zIndex: isHighlighted || isDefenseHighlighted ? 1000 : (isAttacking ? 200 : 10),
                pointerEvents: "all", // Гарантируем перехват событий мыши
                ...style,
            }}
            onMouseOver={disableMouseEvents ? undefined : (e) => {
                // Hover эффект только для карт в руке, не для карт атаки
                if (isInHand) {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 0, 0, 0.3)";
                }
                // Для карт атаки hover обрабатывается через useDroppable
            }}
            onMouseOut={disableMouseEvents ? undefined : (e) => {
                // Hover эффект только для карт в руке, не для карт атаки
                if (isInHand) {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
                }
                // Для карт атаки hover обрабатывается через useDroppable
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
        </div>
    );
};

export default DraggableCard;
