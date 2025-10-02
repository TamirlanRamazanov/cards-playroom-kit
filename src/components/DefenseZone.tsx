import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Card } from '../types';
import DraggableCard from './DraggableCard';

interface DefenseZoneProps {
    attackCards: (Card | null)[];
    defenseCards: (Card | null)[];
    onCardClick?: (attackIndex: number) => void;
    onCardHover?: (attackIndex: number) => void;
    onCardLeave?: () => void;
    highlightedCardIndex?: number | null;
    gameMode?: 'attack' | 'defense';
    invalidDefenseCard?: number | null; // Индекс невалидной карты защиты
}

const DefenseZone: React.FC<DefenseZoneProps> = ({
    attackCards,
    defenseCards,
    onCardClick,
    onCardHover,
    onCardLeave,
    highlightedCardIndex,
    gameMode,
    invalidDefenseCard
}) => {
    // Вычисляем ширину контейнера на основе количества карт атаки
    const attackCardsCount = attackCards.filter(card => card !== null).length;
    const cardWidth = 120; // Ширина одной карты
    const cardGap = 10; // Отступ между картами
    const containerPadding = 20; // Отступы контейнера
    
    const containerWidth = attackCardsCount > 0 
        ? attackCardsCount * cardWidth + (attackCardsCount - 1) * cardGap + containerPadding * 2
        : cardWidth + containerPadding * 2; // Минимальная ширина для одной карты

    return (
        <div
            style={{
                width: `${containerWidth}px`,
                minHeight: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: `${cardGap}px`,
                padding: `${containerPadding}px`,
                background: "rgba(65, 105, 225, 0.05)", // Легкий синий фон
                border: "2px dashed rgba(65, 105, 225, 0.3)",
                borderRadius: "12px",
                margin: "0 auto 20px auto",
                position: "relative"
            }}
        >
            {attackCards.map((attackCard, attackIndex) => {
                if (!attackCard) return null; // Показываем слот только если есть карта атаки
                
                const defenseCard = defenseCards[attackIndex];
                
                return (
                    <DefenseCardDropZone
                        key={`defense-slot-${attackIndex}`}
                        attackIndex={attackIndex}
                        cardWidth={cardWidth}
                        defenseCard={defenseCard}
                        highlightedCardIndex={highlightedCardIndex}
                        gameMode={gameMode}
                        onCardHover={onCardHover}
                        onCardLeave={onCardLeave}
                        onCardClick={onCardClick}
                        invalidDefenseCard={invalidDefenseCard}
                    />
                );
            })}
        </div>
    );
};

// Компонент для отдельной карты защиты с drop zone
const DefenseCardDropZone: React.FC<{
    attackIndex: number;
    cardWidth: number;
    defenseCard: Card | null;
    highlightedCardIndex?: number | null;
    gameMode?: 'attack' | 'defense';
    onCardHover?: (attackIndex: number) => void;
    onCardLeave?: () => void;
    onCardClick?: (attackIndex: number) => void;
    invalidDefenseCard?: number | null;
}> = ({
    attackIndex,
    cardWidth,
    defenseCard,
    highlightedCardIndex,
    gameMode,
    onCardHover,
    onCardLeave,
    onCardClick,
    invalidDefenseCard
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `defense-card-${attackIndex}`,
        data: {
            type: 'defense-card',
            attackIndex
        },
        disabled: gameMode === 'attack' && defenseCard === null // Отключаем drop zone для пустых слотов в режиме атаки
    });

    return (
        <div
            ref={setNodeRef}
            data-defense-card-index={attackIndex}
            style={{
                width: `${cardWidth}px`,
                height: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                border: isOver ? "2px solid #32CD32" : "none",
                borderRadius: "12px",
                // Добавляем визуальную обратную связь для невалидных карт
                backgroundColor: invalidDefenseCard === attackIndex ? "rgba(255, 0, 0, 0.1)" : "transparent",
                boxShadow: invalidDefenseCard === attackIndex ? "0 0 10px rgba(255, 0, 0, 0.5)" : "none"
            }}
        >
            <div
                onMouseEnter={() => {
                    // В режиме атаки не реагируем на слоты защиты
                    console.log(`🔍 DEFENSE ENTER: attackIndex=${attackIndex}, gameMode=${gameMode}, defenseCard=${!!defenseCard}`);
                    if (gameMode !== 'attack') {
                        console.log(`🎯 DEFENSE: Активируем ховер для слота ${attackIndex}`);
                        onCardHover?.(attackIndex);
                    } else {
                        console.log(`🚫 DEFENSE: Блокируем ховер в режиме атаки для слота ${attackIndex}`);
                    }
                }}
                onMouseLeave={() => {
                    // В режиме атаки не реагируем на слоты защиты
                    console.log(`🔍 DEFENSE LEAVE: attackIndex=${attackIndex}, gameMode=${gameMode}`);
                    if (gameMode !== 'attack') {
                        console.log(`🎯 DEFENSE: Деактивируем ховер для слота ${attackIndex}`);
                        onCardLeave?.();
                    } else {
                        console.log(`🚫 DEFENSE: Блокируем деактивацию в режиме атаки для слота ${attackIndex}`);
                    }
                }}
                style={{
                    cursor: gameMode === 'attack' ? 'not-allowed' : 'default', // В режиме атаки показываем not-allowed
                    opacity: gameMode === 'attack' ? 0.5 : 1 // Приглушаем все слоты в режиме атаки
                }}
            >
                {defenseCard ? (
                    <DraggableCard
                        card={defenseCard}
                        index={attackIndex}
                        isDefending={true}
                        onClick={() => onCardClick?.(attackIndex)}
                        onMouseEnter={() => onCardHover?.(attackIndex)}
                        onMouseLeave={onCardLeave}
                        isDraggable={false} // Карты защиты пока не перетаскиваем
                        isDefenseHighlighted={highlightedCardIndex === attackIndex}
                        disableMouseEvents={gameMode === 'attack'} // Отключаем события мыши в режиме атаки
                    />
                ) : (
                    <div
                        style={{
                            width: `${cardWidth}px`,
                            height: "160px",
                            border: highlightedCardIndex === attackIndex 
                                ? "2px solid #32CD32" // Зеленый для подсветки
                                : invalidDefenseCard === attackIndex
                                ? "2px solid #FF0000" // Красный для невалидных карт
                                : "2px dashed rgba(65, 105, 225, 0.3)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: highlightedCardIndex === attackIndex 
                                ? "#32CD32" // Зеленый для подсветки
                                : invalidDefenseCard === attackIndex
                                ? "#FF0000" // Красный для невалидных карт
                                : "rgba(65, 105, 225, 0.5)",
                            fontSize: "12px",
                            background: highlightedCardIndex === attackIndex 
                                ? "rgba(50, 205, 50, 0.1)" // Светло-зеленый фон для подсветки
                                : invalidDefenseCard === attackIndex
                                ? "rgba(255, 0, 0, 0.1)" // Светло-красный фон для невалидных карт
                                : "rgba(65, 105, 225, 0.05)"
                        }}
                    >
                        {invalidDefenseCard === attackIndex ? "❌ Слабая" : "Защита"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DefenseZone;
