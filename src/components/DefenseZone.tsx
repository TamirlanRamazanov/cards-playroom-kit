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
    onDefenseCardHover?: (attackIndex: number) => void;
    onDefenseCardLeave?: () => void;
    playerRole?: 'attacker' | 'co-attacker' | 'defender' | 'observer' | null;
    highlightedDefenseCardIndex?: number | null; // Индекс подсвеченной карты защиты для атакующих
}

const DefenseZone: React.FC<DefenseZoneProps> = ({
    attackCards,
    defenseCards,
    onCardClick,
    onCardHover,
    onCardLeave,
    highlightedCardIndex,
    gameMode,
    invalidDefenseCard,
    onDefenseCardHover,
    onDefenseCardLeave,
    playerRole,
    highlightedDefenseCardIndex
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
                        onDefenseCardHover={onDefenseCardHover}
                        onDefenseCardLeave={onDefenseCardLeave}
                        playerRole={playerRole}
                        highlightedDefenseCardIndex={highlightedDefenseCardIndex}
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
    onDefenseCardHover?: (attackIndex: number) => void;
    onDefenseCardLeave?: () => void;
    playerRole?: 'attacker' | 'co-attacker' | 'defender' | 'observer' | null;
    highlightedDefenseCardIndex?: number | null;
}> = ({
    attackIndex,
    cardWidth,
    defenseCard,
    highlightedCardIndex,
    gameMode,
    onCardHover,
    onCardLeave,
    onCardClick,
    invalidDefenseCard,
    onDefenseCardHover,
    onDefenseCardLeave,
    playerRole,
    highlightedDefenseCardIndex
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `defense-card-${attackIndex}`,
        data: {
            type: 'defense-card',
            attackIndex
        },
        disabled: playerRole === 'defender' // Отключаем drop zone для защитника, активируем для атакующих
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
                    console.log(`🔍 DEFENSE ENTER: attackIndex=${attackIndex}, gameMode=${gameMode}, playerRole=${playerRole}, defenseCard=${!!defenseCard}`);
                    if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                        // Для атакующих игроков активируем ховер для карт защиты (для drop на них)
                        console.log(`🎯 DEFENSE: Активируем ховер для слота защиты ${attackIndex} для атакующего игрока`);
                        onDefenseCardHover?.(attackIndex);
                    } else if (playerRole === 'defender') {
                        // Для защитника активируем обычный ховер (для отбивания)
                        console.log(`🎯 DEFENSE: Активируем ховер для слота ${attackIndex} для защитника`);
                        onCardHover?.(attackIndex);
                    }
                }}
                onMouseLeave={() => {
                    console.log(`🔍 DEFENSE LEAVE: attackIndex=${attackIndex}, gameMode=${gameMode}, playerRole=${playerRole}`);
                    if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                        // Для атакующих игроков деактивируем ховер для карт защиты
                        console.log(`🎯 DEFENSE: Деактивируем ховер для слота защиты ${attackIndex} для атакующего игрока`);
                        onDefenseCardLeave?.();
                    } else if (playerRole === 'defender') {
                        // Для защитника деактивируем обычный ховер
                        console.log(`🎯 DEFENSE: Деактивируем ховер для слота ${attackIndex} для защитника`);
                        onCardLeave?.();
                    }
                }}
                style={{
                    cursor: (playerRole === 'attacker' || playerRole === 'co-attacker') ? 'pointer' : 'default', // Для атакующих показываем pointer
                    opacity: 1 // Убираем приглушение, чтобы карты защиты были видны
                }}
            >
                {defenseCard ? (
                    <DraggableCard
                        card={defenseCard}
                        index={attackIndex}
                        isDefending={true}
                        onClick={() => onCardClick?.(attackIndex)}
                        onMouseEnter={() => {
                            if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                                onDefenseCardHover?.(attackIndex);
                            } else if (playerRole === 'defender') {
                                onCardHover?.(attackIndex);
                            }
                        }}
                        onMouseLeave={() => {
                            if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                                onDefenseCardLeave?.();
                            } else if (playerRole === 'defender') {
                                onCardLeave?.();
                            }
                        }}
                        onTouchStart={() => {
                            if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                                onDefenseCardHover?.(attackIndex);
                            } else if (playerRole === 'defender') {
                                onCardHover?.(attackIndex);
                            }
                        }}
                        onTouchEnd={() => {
                            if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                                onDefenseCardLeave?.();
                            } else if (playerRole === 'defender') {
                                onCardLeave?.();
                            }
                        }}
                        isDraggable={false} // Карты защиты пока не перетаскиваем
                        isDefenseHighlighted={
                            (playerRole === 'attacker' || playerRole === 'co-attacker') 
                                ? highlightedDefenseCardIndex === attackIndex
                                : highlightedCardIndex === attackIndex
                        }
                        disableMouseEvents={false} // Включаем события мыши для всех ролей
                    />
                ) : (
                    <div
                        onTouchStart={() => {
                            if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                                onDefenseCardHover?.(attackIndex);
                            } else if (playerRole === 'defender') {
                                onCardHover?.(attackIndex);
                            }
                        }}
                        onTouchEnd={() => {
                            if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                                onDefenseCardLeave?.();
                            } else if (playerRole === 'defender') {
                                onCardLeave?.();
                            }
                        }}
                        style={{
                            width: `${cardWidth}px`,
                            height: "160px",
                            border: (() => {
                                if (invalidDefenseCard === attackIndex) return "2px solid #FF0000"; // Красный для невалидных карт
                                if ((playerRole === 'attacker' || playerRole === 'co-attacker') && highlightedDefenseCardIndex === attackIndex) {
                                    return "2px solid #32CD32"; // Зеленый для подсветки атакующими
                                }
                                if (playerRole === 'defender' && highlightedCardIndex === attackIndex) {
                                    return "2px solid #32CD32"; // Зеленый для подсветки защитником
                                }
                                return "2px dashed rgba(65, 105, 225, 0.3)";
                            })(),
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: (() => {
                                if (invalidDefenseCard === attackIndex) return "#FF0000"; // Красный для невалидных карт
                                if ((playerRole === 'attacker' || playerRole === 'co-attacker') && highlightedDefenseCardIndex === attackIndex) {
                                    return "#32CD32"; // Зеленый для подсветки атакующими
                                }
                                if (playerRole === 'defender' && highlightedCardIndex === attackIndex) {
                                    return "#32CD32"; // Зеленый для подсветки защитником
                                }
                                return "rgba(65, 105, 225, 0.5)";
                            })(),
                            fontSize: "12px",
                            background: (() => {
                                if (invalidDefenseCard === attackIndex) return "rgba(255, 0, 0, 0.1)"; // Светло-красный фон для невалидных карт
                                if ((playerRole === 'attacker' || playerRole === 'co-attacker') && highlightedDefenseCardIndex === attackIndex) {
                                    return "rgba(50, 205, 50, 0.1)"; // Светло-зеленый фон для подсветки атакующими
                                }
                                if (playerRole === 'defender' && highlightedCardIndex === attackIndex) {
                                    return "rgba(50, 205, 50, 0.1)"; // Светло-зеленый фон для подсветки защитником
                                }
                                return "rgba(65, 105, 225, 0.05)";
                            })()
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
