import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Card } from '../types';
import DraggableCard from './DraggableCard';

interface DropZoneProps {
    id: string;
    cards: (Card | null)[];
    isAttacking?: boolean;
    isDefending?: boolean;
    maxVisibleCards?: number;
    minVisibleCards?: number;
    onCardClick?: (index: number) => void;
    onCardHover?: (index: number) => void;
    onCardLeave?: () => void;
    gameMode?: 'attack' | 'defense';
    highlightedCardIndex?: number | null;
    defenseCards?: (Card | null)[]; // Карты защиты для сенсора в режиме атаки
    onDefenseCardHover?: (index: number) => void; // Обработчик наведения на карты защиты
    onDefenseCardLeave?: () => void; // Обработчик ухода с карт защиты
    onMousePositionUpdate?: (position: { x: number; y: number }) => void; // Обновление позиции мыши
    activeCard?: { source: string; card: Card } | null; // Активная карта для активации сенсора
    onDropZoneActivate?: (zoneId: string) => void; // Обработчик активации drop zone
    onDropZoneDeactivate?: () => void; // Обработчик деактивации drop zone
    activeDropZone?: string | null; // Активный drop zone
}

const DropZone: React.FC<DropZoneProps> = ({
    id,
    cards,
    isAttacking = false,
    isDefending = false,
    maxVisibleCards,
    minVisibleCards,
    onCardClick,
    onCardHover,
    onCardLeave,
    gameMode,
    highlightedCardIndex,
    defenseCards = [],
    onDefenseCardHover,
    onDefenseCardLeave,
    onMousePositionUpdate,
    activeCard,
    onDropZoneActivate,
    onDropZoneDeactivate
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        // Всегда активен, но логика обработки разная для разных режимов
        disabled: false
    });

    // В режиме защиты/атаки, когда isOver = true, определяем ближайшую карту к курсору
    React.useEffect(() => {
        console.log(`🔍 DropZone сенсор: gameMode=${gameMode}, id=${id}, isOver=${isOver}, activeCard=${activeCard ? 'есть' : 'нет'}`);
        // В режиме атаки сенсор работает глобально, в режиме защиты только через DropZone
        if (gameMode === 'defense' && id === 'table') {
            console.log(`✅ Сенсор активирован для ${gameMode} режима`);
            // В режиме защиты активируем сенсор только при isOver
            if (isOver) {
                const handleMouseMove = (e: MouseEvent | TouchEvent) => {
                    // Получаем позицию курсора/пальца
                    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
                    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
                    // Радиус невидимого круга вокруг курсора
                    const sensorRadius = 80;
                    
                    // Обновляем позицию мыши для визуального сенсора
                    if (onMousePositionUpdate) {
                        onMousePositionUpdate({ x: clientX, y: clientY });
                    }
                    
                    if (gameMode === 'defense' && onCardHover) {
                        // В режиме защиты ищем карты атаки
                        const targetCards = cards.map((card, index) => {
                            if (card) {
                                // Находим DOM элемент карты
                                const cardElement = document.querySelector(`[data-card-index="${index}"]`);
                                if (cardElement) {
                                    const rect = cardElement.getBoundingClientRect();
                                    const cardCenterX = rect.left + rect.width / 2;
                                    const cardCenterY = rect.top + rect.height / 2;
                                    
                                    // Вычисляем расстояние от курсора до центра карты
                                    const distance = Math.sqrt(
                                        Math.pow(clientX - cardCenterX, 2) + 
                                        Math.pow(clientY - cardCenterY, 2)
                                    );
                                    
                                    return { index, distance, card };
                                }
                            }
                            return null;
                        }).filter(item => item !== null);

                        if (targetCards.length > 0) {
                            // Находим ближайшую карту в радиусе сенсора
                            const closestCard = targetCards
                                .filter(item => item!.distance <= sensorRadius)
                                .sort((a, b) => a!.distance - b!.distance)[0];

                            if (closestCard) {
                                console.log(`🎯 Ближайшая карта атаки:`, closestCard.index, 'расстояние:', closestCard.distance);
                                onCardHover(closestCard.index);
                            } else {
                                // Если нет карт в радиусе, подсвечиваем ближайшую
                                const nearestCard = targetCards.sort((a, b) => a!.distance - b!.distance)[0];
                                if (nearestCard) {
                                    console.log(`🎯 Ближайшая карта атаки (вне радиуса):`, nearestCard.index, 'расстояние:', nearestCard.distance);
                                    onCardHover(nearestCard.index);
                                }
                            }
                        }
                    }
                };

                // Добавляем обработчики для мыши и тач-событий
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('touchmove', handleMouseMove);

                return () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('touchmove', handleMouseMove);
                };
            } else if (!isOver) {
                // Убираем подсветку когда уходим со стола
                if (gameMode === 'defense' && onCardLeave) {
                    onCardLeave();
                }
            }
        }
    }, [isOver, gameMode, id, cards, defenseCards, onCardHover, onCardLeave, onDefenseCardHover, onDefenseCardLeave, onMousePositionUpdate, activeCard]);

    // Определяем, нужен ли горизонтальный скролл
    const needsScroll = maxVisibleCards && cards.length > maxVisibleCards;
    
    // Вычисляем ширину контейнера для карт
    const cardWidth = 120; // ширина карты
    const cardGap = 16; // отступ между картами
    const containerPadding = 40; // padding контейнера (20px с каждой стороны)
    
    // Вычисляем ширину контейнера
    let containerWidth: string | number;
    
    if (needsScroll) {
        // Для руки с скроллом: фиксированная ширина под maxVisibleCards карт
        containerWidth = (maxVisibleCards * cardWidth) + ((maxVisibleCards - 1) * cardGap) + containerPadding;
    } else if (minVisibleCards) {
        // Для стола: динамическая ширина по реальному количеству карт + 1 пустой слот
        const realCardCount = cards.filter(card => card !== null).length;
        const displayCardCount = Math.max(realCardCount + 1, minVisibleCards);
        containerWidth = (displayCardCount * cardWidth) + ((displayCardCount - 1) * cardGap) + containerPadding;
    } else {
        // Для руки без ограничений: автоматическая ширина
        containerWidth = 'auto';
    }

    return (
        <div
            ref={setNodeRef}
            onMouseEnter={() => {
                // Активируем drop zone через курсор (приоритет над сенсором)
                console.log(`🔍 КУРСОР ENTER: id=${id}, activeCard=${!!activeCard}, onDropZoneActivate=${!!onDropZoneActivate}`);
                if (onDropZoneActivate && activeCard) {
                    console.log(`🎯 КУРСОР: Активирует drop zone ${id}`);
                    onDropZoneActivate(id);
                }
            }}
            onMouseLeave={() => {
                // Деактивируем drop zone через курсор
                console.log(`🔍 КУРСОР LEAVE: id=${id}, onDropZoneDeactivate=${!!onDropZoneDeactivate}`);
                if (onDropZoneDeactivate) {
                    console.log(`🎯 КУРСОР: Деактивирует drop zone ${id}`);
                    onDropZoneDeactivate();
                }
            }}
            style={{
                display: "flex",
                flexWrap: needsScroll ? "nowrap" : (minVisibleCards ? "nowrap" : "wrap"),
                gap: cardGap,
                minHeight: 160,
                padding: "20px",
                borderRadius: 12,
                background: (isOver && gameMode === 'attack') 
                    ? "rgba(139, 0, 0, 0.1)" 
                    : "rgba(0, 0, 0, 0.1)",
                border: (isOver && gameMode === 'attack') 
                    ? "2px dashed #8B0000" 
                    : "2px dashed #334155",
                transition: "all 0.2s ease",
                justifyContent: needsScroll ? "flex-start" : (minVisibleCards ? "center" : "center"),
                width: containerWidth,
                overflow: needsScroll ? "auto" : "visible",
                scrollbarWidth: "thin",
                scrollbarColor: "#8B0000 #1f2937",
                                    position: "relative",
                    zIndex: minVisibleCards ? 100 : 10, // Более высокий z-index для стола
            }}
        >
            {(() => {
                if (minVisibleCards) {
                    // Для стола: показываем только заполненные слоты + 1 пустой
                    const filledSlots = cards.filter(card => card !== null);
                    const displayCards: (Card | null)[] = [...filledSlots];
                    
                    // Добавляем один пустой слот для возможности добавления новой карты
                    if (displayCards.length < minVisibleCards) {
                        displayCards.push(null);
                    }
                    
                    return displayCards.map((card, displayIndex) => {
                        if (card) {
                            // Находим реальный индекс карты в оригинальном массиве slots
                            const realIndex = cards.findIndex((originalCard) => 
                                originalCard && originalCard.id === card.id
                            );
                            
                            return (
                                <DraggableCard
                                    key={`${id}-card-${realIndex}`}
                                    card={card}
                                    index={realIndex}
                                    isInHand={id === 'my-hand'}
                                    isAttacking={isAttacking}
                                    isDefending={isDefending}
                                    onClick={() => onCardClick?.(realIndex)}
                                    onMouseEnter={() => onCardHover?.(realIndex)}
                                    onMouseLeave={onCardLeave}
                                    isHighlighted={highlightedCardIndex === realIndex}
                                    isDraggable={id === 'my-hand'} // Только карты в руке можно перетаскивать
                                />
                            );
                        } else {
                            return (
                                <div
                                    key={`${id}-empty-${displayIndex}`}
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
                            );
                        }
                    });
                } else {
                    // Для руки: показываем все карты как обычно
                    return cards.map((card, index) => (
                        card ? (
                            <DraggableCard
                                key={`${id}-card-${index}`}
                                card={card}
                                index={index}
                                isInHand={id === 'my-hand'}
                                isAttacking={isAttacking}
                                isDefending={isDefending}
                                onClick={() => onCardClick?.(index)}
                                isDraggable={id === 'my-hand'}
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
                    ));
                }
            })()}
        </div>
    );
};

export default DropZone;
