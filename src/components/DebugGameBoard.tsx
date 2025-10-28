import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { GameState, Card } from "../types";
import { CARDS_DATA, FACTIONS } from "../engine/cards";
import DropZone from "./DropZone";
import DefenseZone from "./DefenseZone";

// Простой генератор псевдослучайных чисел с seed (как в ML)
class SeededRandom {
    private seed: number;
    
    constructor(seed: number) {
        this.seed = seed;
    }
    
    // Генерация следующего случайного числа
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    // Перемешивание массива с использованием seed
    shuffle<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Базовая функция создания игрового состояния
const createBasicGameState = (seed: number = 42, playerCount: number = 4): GameState => {
    // Создаем генератор случайных чисел с seed
    const random = new SeededRandom(seed);
    
    // Создаем полную колоду из всех карт и перемешиваем её
    const shuffledDeck = random.shuffle([...CARDS_DATA]);
    
    // Создаем игроков и раздаем карты в зависимости от количества
    const players: Record<string, { name: string }> = {};
    const hands: Record<string, Card[]> = {};
    const turnOrder: string[] = [];
    
    for (let i = 1; i <= playerCount; i++) {
        const playerId = `player-${i}`;
        const playerCards = shuffledDeck.splice(0, 6);
        
        players[playerId] = { name: `Player ${i}` };
        hands[playerId] = playerCards;
        turnOrder.push(playerId);
    }
    
    // Оставшиеся карты остаются в колоде
    const remainingDeck = shuffledDeck;
    
    return {
    phase: "playing",
        hostId: "player-1",
        players,
        hands,
            slots: [null, null, null, null, null, null], // Пустой стол для атакующих карт
        defenseSlots: [null, null, null, null, null, null], // Пустые слоты для защиты
        playerCountAtStart: playerCount,
    winnerId: undefined,
    startedAt: Date.now(),
    
    // Turn system
        currentTurn: "player-1",
        turnOrder,
    currentTurnIndex: 0,
        turnPhase: "play",
    
    // Game mechanics
    attackingCard: null,
    defendingCard: null,
    attackTarget: undefined,
    canPass: true,
    canTakeCards: true,
    
    // Card draw system
        deck: remainingDeck,
    discardPile: [],
    maxHandSize: 6,
    cardsDrawnThisTurn: {},
    canDrawCards: true,
    
    // Faction system
        availableTargets: turnOrder.slice(1), // Все игроки кроме первого
        factionBonuses: {},
    targetSelectionMode: false,
    selectedTarget: undefined,
        factionEffects: {},
        activeFactions: [],
    
            // Card power system
        minCardPower: 50,
        maxCardPower: 100,
        canDefendWithEqualPower: true,
    
    // Role system defaults
    playerRoles: Object.fromEntries(turnOrder.map(pid => [pid, 'observer'] as const)),
    attackPriority: 'attacker',
    mainAttackerHasPlayed: false,
    attackerPassed: false,
    coAttackerPassed: false,
    attackerBitoPressed: false,
    coAttackerBitoPressed: false,
    attackerPasPressed: false,
    coAttackerPasPressed: false,
    
    // Draw queue
    drawQueue: [],
    
        // Game initialization
        gameInitialized: false,
        
        // Faction management (added for type compatibility)
        factionCounter: {},
        activeFirstAttackFactions: [],
        usedDefenseCardFactions: {},
        displayActiveFactions: [],
        defenseFactionsBuffer: {},
    
    // Turn control system
    turnActions: {
        canEndTurn: true,
        canPass: true,
        canTakeCards: true,
        canAttack: true,
        canDefend: false,
    },
    turnHistory: [
        {
                playerId: "player-1",
                action: "Игра началась",
                timestamp: Date.now(),
            }
        ],
    };
};

interface DebugGameBoardProps {
    onBack?: () => void;
}

const DebugGameBoard: React.FC<DebugGameBoardProps> = ({ onBack }) => {
    const [seed, setSeed] = useState<number>(42);
    const [playerCount, setPlayerCount] = useState<number>(4);
    const [gameState, setGameState] = useState<GameState>(createBasicGameState(seed, playerCount));
    const [currentPlayerId, setCurrentPlayerId] = useState<string>("player-1");
    const [activeCard, setActiveCard] = useState<{ card: Card; index: number; source: string } | null>(null);
    const [gameMode, setGameMode] = useState<'attack' | 'defense'>('attack');
    const [gameInitialized, setGameInitialized] = useState<boolean>(false);
    const [showFirstPlayerModal, setShowFirstPlayerModal] = useState<boolean>(false);
    const [firstPlayerInfo, setFirstPlayerInfo] = useState<{playerId: string, playerName: string, cardName: string, power: number} | null>(null);
    const [playerRoles, setPlayerRoles] = useState<Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'>>({});
    
    // Система приоритета атаки
    const [attackPriority, setAttackPriority] = useState<'attacker' | 'co-attacker'>('attacker'); // Кто имеет приоритет атаки
    const [mainAttackerHasPlayed, setMainAttackerHasPlayed] = useState<boolean>(false); // Подкинул ли главный атакующий хотя бы одну карту
    const [attackerPassed, setAttackerPassed] = useState<boolean>(false); // Отказался ли главный атакующий от подкидывания
    const [coAttackerPassed, setCoAttackerPassed] = useState<boolean>(false); // Отказался ли со-атакующий от подкидывания
    
    // Состояния блокировки кнопок
    const [attackerBitoPressed, setAttackerBitoPressed] = useState<boolean>(false); // Нажал ли главный атакующий Бито
    const [coAttackerBitoPressed, setCoAttackerBitoPressed] = useState<boolean>(false); // Нажал ли со-атакующий Бито
    const [attackerPasPressed, setAttackerPasPressed] = useState<boolean>(false); // Нажал ли главный атакующий Пас
    const [coAttackerPasPressed, setCoAttackerPasPressed] = useState<boolean>(false); // Нажал ли со-атакующий Пас
    
    // Состояние для очереди добора карт
    const [drawQueue, setDrawQueue] = useState<string[]>([]);
    
    // Простая проверка, что консоль работает
    console.log('🚀 DebugGameBoardV2 загружен!', { gameMode });
    const [defenseCards, setDefenseCards] = useState<(Card | null)[]>([]); // Карты защиты, синхронизированные с картами атаки
    const [hoveredAttackCard, setHoveredAttackCard] = useState<number | null>(null); // Индекс наведенной карты атаки
    const [hoveredDefenseCard, setHoveredDefenseCard] = useState<number | null>(null); // Индекс наведенной карты защиты
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null); // Позиция мыши
    const [showSensorCircle, setShowSensorCircle] = useState<boolean>(false); // Показать невидимый круг для отладки
    const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
    const [dropZoneTimeout, setDropZoneTimeout] = useState<number | null>(null); // Таймаут для задержки деактивации drop zone
    const [invalidDefenseCard, setInvalidDefenseCard] = useState<number | null>(null); // Индекс невалидной карты защиты
    const [canTakeCards, setCanTakeCards] = useState<boolean>(false); // Можно ли взять карты
    
    // Счётчик фракций: {factionId: count}
    const [factionCounter, setFactionCounter] = useState<Record<number, number>>({}); // Активные фракции (названия)
    
    // Буфер для фракций от карт защиты (чтобы не терять их при операциях пересечения)
    const [defenseFactionsBuffer, setDefenseFactionsBuffer] = useState<Record<number, number>>({});
    
    // Активные фракции первой карты атаки (те, что остались после пересечений)
    const [activeFirstAttackFactions, setActiveFirstAttackFactions] = useState<number[]>([]);
    
    // Использованные фракции для каждой карты защиты: {cardId: [factionIds]}
    const [usedDefenseCardFactions, setUsedDefenseCardFactions] = useState<Record<string, number[]>>({});

    // Глобальный обработчик мыши для отладочного сенсора
    React.useEffect(() => {
        if (showSensorCircle) {
            const handleGlobalMouseMove = (e: MouseEvent) => {
                setMousePosition({ x: e.clientX, y: e.clientY });
            };

            document.addEventListener('mousemove', handleGlobalMouseMove);

            return () => {
                document.removeEventListener('mousemove', handleGlobalMouseMove);
            };
        }
    }, [showSensorCircle]);

    // Глобальный сенсор для всех режимов
    React.useEffect(() => {
        if (activeCard && activeCard.source === 'hand') {
            console.log('🎯 Глобальный сенсор активирован для карты:', activeCard.card.name);
            
            const handleGlobalMouseMove = (e: MouseEvent) => {
                const clientX = e.clientX;
                const clientY = e.clientY;
                const sensorRadius = 80;

                // Обновляем позицию мыши для визуального сенсора
                setMousePosition({ x: clientX, y: clientY });

                // Ищем карты атаки
                const attackCardElements = document.querySelectorAll('[data-card-index]');
                let closestAttackCard: Element | null = null;
                let closestAttackDistance = Infinity;

                attackCardElements.forEach((element) => {
                    const rect = element.getBoundingClientRect();
                    const cardCenterX = rect.left + rect.width / 2;
                    const cardCenterY = rect.top + rect.height / 2;
                    
                    const distance = Math.sqrt(
                        Math.pow(clientX - cardCenterX, 2) + 
                        Math.pow(clientY - cardCenterY, 2)
                    );

                    if (distance < closestAttackDistance) {
                        closestAttackDistance = distance;
                        closestAttackCard = element;
                    }
                });

                // Ищем карты защиты
                const defenseCardElements = document.querySelectorAll('[data-defense-card-index]');
                console.log('🔍 Найдено элементов защиты:', defenseCardElements.length);
                let closestDefenseCard: Element | null = null;
                let closestDefenseDistance = Infinity;

                defenseCardElements.forEach((element, idx) => {
                    const rect = element.getBoundingClientRect();
                    const cardCenterX = rect.left + rect.width / 2;
                    const cardCenterY = rect.top + rect.height / 2;
                    
                    const distance = Math.sqrt(
                        Math.pow(clientX - cardCenterX, 2) + 
                        Math.pow(clientY - cardCenterY, 2)
                    );

                    // Получаем индекс слота защиты
                    const defenseIndex = parseInt((element as Element).getAttribute('data-defense-card-index') || '0');
                    
                    // В режиме атаки пропускаем пустые слоты
                    if (gameMode === 'attack' && defenseCards[defenseIndex] === null) {
                        console.log(`🔍 Карта защиты ${idx}: слот пустой, пропускаем`);
                        return;
                    }

                    console.log(`🔍 Карта защиты ${idx}: расстояние ${distance.toFixed(2)}px`);

                    if (distance < closestDefenseDistance) {
                        closestDefenseDistance = distance;
                        closestDefenseCard = element;
                    }
                });

                // Активируем ховер в зависимости от режима
                console.log(`🔍 ОТЛАДКА: gameMode=${gameMode}, activeDropZone=${activeDropZone}, closestAttackCard=${!!closestAttackCard}, closestDefenseCard=${!!closestDefenseCard}`);
                
                if (gameMode === 'defense') {
                    // В режиме защиты: приоритет картам атаки
                    if (closestAttackCard && closestAttackDistance <= sensorRadius) {
                        const attackIndex = parseInt((closestAttackCard as Element).getAttribute('data-card-index') || '0');
                        console.log(`🎯 СЕНСОР: Карта атаки ${attackIndex} в радиусе (режим защиты)`);
                        
                        // Проверяем валидность карты защиты для этой карты атаки
                        if (activeCard && activeCard.source === 'hand') {
                            const isValid = checkDefenseCardValidity(activeCard.card, attackIndex);
                            if (!isValid) {
                                console.log(`❌ ВАЛИДАЦИЯ: Карта "${activeCard.card.name}" (${activeCard.card.power}) не может защитить от карты атаки ${attackIndex}`);
                                setInvalidDefenseCard(attackIndex);
                            } else {
                                setInvalidDefenseCard(null);
                            }
                        }
                        
                        setHoveredAttackCard(attackIndex);
                        setHoveredDefenseCard(null);
                        setActiveDropZone('attack-card');
                    } else {
                        setHoveredAttackCard(null);
                        setHoveredDefenseCard(null);
                        setActiveDropZone(null);
                        setInvalidDefenseCard(null);
                    }
                } else if (gameMode === 'attack') {
                    // В режиме атаки: проверяем, активен ли drop zone через курсор
                    console.log(`🔍 ОТЛАДКА АТАКИ: activeDropZone=${activeDropZone}, closestDefenseCard=${!!closestDefenseCard}, closestDefenseDistance=${closestDefenseDistance}, sensorRadius=${sensorRadius}`);
                    
                    if (activeDropZone) {
                        // Если активен drop zone через курсор, блокируем сенсор
                        console.log(`🎯 СЕНСОР: Drop zone ${activeDropZone} активен через курсор, блокируем сенсор`);
                        setHoveredAttackCard(null);
                        setHoveredDefenseCard(null);
                    } else if (closestDefenseCard && closestDefenseDistance <= sensorRadius) {
                        // Только если нет активного drop zone, разрешаем взаимодействие с картами защиты через сенсор
                        const defenseIndex = parseInt((closestDefenseCard as Element).getAttribute('data-defense-card-index') || '0');
                        
                        console.log(`🎯 СЕНСОР: Карта защиты ${defenseIndex} в радиусе (режим атаки)`);
                        setHoveredDefenseCard(defenseIndex);
                        setHoveredAttackCard(null);
                        setActiveDropZone('defense-card');
                    } else {
                        console.log(`🎯 СЕНСОР: Нет активных элементов, сбрасываем все`);
                        setHoveredAttackCard(null);
                        setHoveredDefenseCard(null);
                        setActiveDropZone(null);
                    }
                }
            };

            document.addEventListener('mousemove', handleGlobalMouseMove);

            return () => {
                document.removeEventListener('mousemove', handleGlobalMouseMove);
            };
        }
    }, [gameMode, activeCard]);

    // Очистка таймаута при размонтировании
    React.useEffect(() => {
        return () => {
            if (dropZoneTimeout) {
                clearTimeout(dropZoneTimeout);
            }
        };
    }, [dropZoneTimeout]);

    // Функция валидации карты защиты
    const validateDefenseCard = (defenseCard: Card, attackCard: Card): boolean => {
        // Карта защиты должна иметь силу больше или равную карте атаки
        return defenseCard.power >= attackCard.power;
    };

    // Функция проверки валидности карты защиты при наведении
    const checkDefenseCardValidity = (defenseCard: Card, attackCardIndex: number): boolean => {
        const attackCard = gameState.slots?.[attackCardIndex];
        if (!attackCard) return false;
        return validateDefenseCard(defenseCard, attackCard);
    };

    // Функция проверки, можно ли взять карты
    const checkCanTakeCards = (): boolean => {
        // Можно взять карты только в режиме защиты
        if (gameMode !== 'defense') return false;
        
        // Проверяем, есть ли неотбитые карты атаки
        const attackCards = gameState.slots || [];
        const hasUnbeatenCards = attackCards.some((attackCard, index) => {
            if (!attackCard) return false;
            const defenseCard = defenseCards[index];
            return defenseCard === null; // Карта атаки не отбита, если нет карты защиты
        });
        
        return hasUnbeatenCards;
    };

    // Функция для получения названий фракций по ID
    const getFactionNames = (factionIds: number[]): string[] => {
        return factionIds.map(id => FACTIONS[id] || `Unknown Faction ${id}`);
    };

    // Функция для проверки, является ли карта первой в атаке
    const isFirstAttackCard = (): boolean => {
        const attackCards = gameState.slots || [];
        return attackCards.filter(card => card !== null).length === 0;
    };

    // Функция для установки активных фракций из карты
    const setActiveFactionsFromCard = (card: Card) => {
        setActiveFirstAttackFactions(card.factions); // Устанавливаем активные фракции первой карты
        console.log(`🎯 Установлены активные фракции первой карты:`, card.factions);
    };

    // Функция для проверки пересечения фракций
    const hasCommonFactions = (cardFactions: number[], activeFactionIds: number[]): boolean => {
        return cardFactions.some(factionId => activeFactionIds.includes(factionId));
    };

    // Функция для проверки, может ли карта защиты использовать фракцию
    const canDefenseCardUseFaction = (defenseCard: Card, factionId: number): boolean => {
        const usedFactions = usedDefenseCardFactions[defenseCard.id] || [];
        return !usedFactions.includes(factionId);
    };

    // Функция для получения пересечения фракций
    const getFactionIntersection = (cardFactions: number[], activeFactionIds: number[]): number[] => {
        return cardFactions.filter(factionId => activeFactionIds.includes(factionId));
    };

    // Функция для получения фракций первой карты атаки
    const getFirstAttackCardFactions = (): number[] => {
        const attackCards = gameState.slots?.filter(card => card !== null) || [];
        if (attackCards.length === 0) return [];
        
        // Возвращаем фракции первой карты атаки
        return attackCards[0].factions;
    };

    // Функция для валидации карты атаки (только для обычного дива атаки)
    const validateAttackCard = (card: Card): { isValid: boolean; reason?: string } => {
        // Если это первая карта - разрешаем любую
        if (isFirstAttackCard()) {
            return { isValid: true };
        }

        // Проверяем пересечение с АКТИВНЫМИ фракциями первой карты атаки
        if (activeFirstAttackFactions.length === 0) {
            return { isValid: false, reason: "Нет активных фракций первой карты атаки" };
        }

        // Проверяем пересечение ТОЛЬКО с активными фракциями первой карты атаки
        if (!hasCommonFactions(card.factions, activeFirstAttackFactions)) {
            const cardFactionNames = getFactionNames(card.factions);
            const activeFirstAttackFactionNames = getFactionNames(activeFirstAttackFactions);
            return { 
                isValid: false, 
                reason: `Карта должна иметь хотя бы одну общую фракцию с активными фракциями первой карты атаки: ${activeFirstAttackFactionNames.join(', ')}. У карты: ${cardFactionNames.join(', ')}` 
            };
        }

        return { isValid: true };
    };

    // Функция для обновления счётчика фракций
    const updateFactionCounter = (factionIds: number[], increment: number = 1) => {
        setFactionCounter(prev => {
            const newCounter = { ...prev };
            factionIds.forEach(factionId => {
                newCounter[factionId] = (newCounter[factionId] || 0) + increment;
                if (newCounter[factionId] <= 0) {
                    delete newCounter[factionId];
                }
            });
            return newCounter;
        });
    };

    // Функция для сохранения фракций от карт защиты в буфер
    const saveDefenseFactionsToBuffer = (currentFactionCounter: Record<number, number>) => {
        const newBuffer: Record<number, number> = {};
        // Сохраняем все фракции, которые НЕ являются фракциями первой карты атаки
        const firstAttackFactions = getFirstAttackCardFactions();
        const firstAttackSet = new Set(firstAttackFactions);
        
        Object.keys(currentFactionCounter).forEach(factionIdStr => {
            const factionId = parseInt(factionIdStr);
            if (!firstAttackSet.has(factionId) && currentFactionCounter[factionId] > 0) {
                newBuffer[factionId] = currentFactionCounter[factionId];
            }
        });
        
        setDefenseFactionsBuffer(newBuffer);
        console.log(`🎯 Сохранены фракции защиты в буфер:`, Object.keys(newBuffer).map(id => `${FACTIONS[parseInt(id)]}(${newBuffer[parseInt(id)]})`));
        return newBuffer;
    };

    // Функция для восстановления фракций от карт защиты из буфера
    const restoreDefenseFactionsFromBuffer = (buffer: Record<number, number>) => {
        setFactionCounter(prev => {
            const newCounter = { ...prev };
            // Восстанавливаем фракции из буфера
            Object.keys(buffer).forEach(factionIdStr => {
                const factionId = parseInt(factionIdStr);
                newCounter[factionId] = buffer[factionId];
            });
            
            console.log(`🎯 Восстановлены фракции защиты из буфера:`, Object.keys(buffer).map(id => `${FACTIONS[parseInt(id)]}(${buffer[parseInt(id)]})`));
            
            // Обновляем активные фракции на основе нового счётчика
            return newCounter;
        });
    };



    // Функция для обновления активных фракций после добавления карты атаки
    const updateActiveFactionsFromAttackCard = (card: Card) => {
        // Проверяем, заполнен ли див атаки (6 карт)
        const attackCardsCount = gameState.slots?.filter(slot => slot !== null).length || 0;
        if (attackCardsCount >= 6) {
            console.log(`🚫 Див атаки заполнен (${attackCardsCount}/6), блокируем изменение фракций`);
            return;
        }

        if (isFirstAttackCard()) {
            // Первая карта - устанавливаем все её фракции как единицу
            setActiveFactionsFromCard(card);
            // Обновляем счётчик - фракции первой карты как единица
            updateFactionCounter(card.factions, 1);
            console.log(`🎯 Первая карта атаки - фракции установлены как единица:`, getFactionNames(card.factions));
            return;
        }

        // Для последующих карт - сохраняем фракции защиты в буфер
        const defenseBuffer = saveDefenseFactionsToBuffer(factionCounter);

        // Пересечение с фракциями первой карты атаки
        const firstAttackFactions = getFirstAttackCardFactions();
        const intersection = getFactionIntersection(card.factions, firstAttackFactions);
        
        // Обновляем активные фракции первой карты - только пересекающиеся
        setActiveFirstAttackFactions(intersection);
        
        // Обновляем счётчик только для ПЕРЕСЕКАЮЩИХСЯ фракций первой карты атаки
        setFactionCounter(prev => {
            const newCounter: Record<number, number> = {};
            // Сохраняем только фракции из пересечения (не все фракции первой карты!)
            intersection.forEach(factionId => {
                if (prev[factionId] && prev[factionId] > 0) {
                    newCounter[factionId] = prev[factionId];
                }
            });
            return newCounter;
        });
        
        // Восстанавливаем фракции защиты из буфера
        restoreDefenseFactionsFromBuffer(defenseBuffer);
        
        console.log(`🎯 Карта атаки добавлена через див атаки - восстановлены фракции защиты`);
    };

    // Функция для обновления активных фракций после добавления карты защиты
    const updateActiveFactionsFromDefenseCard = (card: Card) => {
        // Проверяем, заполнен ли див атаки (6 карт)
        const attackCardsCount = gameState.slots?.filter(slot => slot !== null).length || 0;
        if (attackCardsCount >= 6) {
            console.log(`🚫 Див атаки заполнен (${attackCardsCount}/6), блокируем изменение фракций через карты защиты`);
            return;
        }

        // Все фракции карты защиты становятся активными
        const factionNames = getFactionNames(card.factions);
        
        // Обновляем счётчик
        updateFactionCounter(card.factions, 1);
        console.log(`🎯 Добавлены фракции защиты:`, factionNames);
    };

    // Функция для прикрепления атакующей карты через защитную
    const attachAttackCardThroughDefense = (attackCard: Card, defenseCard: Card): boolean => {
        // Проверяем, заполнен ли див атаки (6 карт)
        const attackCardsCount = gameState.slots?.filter(slot => slot !== null).length || 0;
        if (attackCardsCount >= 6) {
            console.log(`🚫 Див атаки заполнен (${attackCardsCount}/6), блокируем прикрепление через защитную карту`);
            return false;
        }

        // Получаем доступные фракции карты защиты (не использованные)
        const availableDefenseFactions = defenseCard.factions.filter(factionId => 
            canDefenseCardUseFaction(defenseCard, factionId)
        );
        
        // Проверяем пересечение фракций с доступными фракциями карты защиты
        const intersection = getFactionIntersection(attackCard.factions, availableDefenseFactions);
        
        if (intersection.length === 0) {
            const attackFactionNames = getFactionNames(attackCard.factions);
            const availableDefenseFactionNames = getFactionNames(availableDefenseFactions);
            const usedDefenseFactionNames = getFactionNames(defenseCard.factions.filter(factionId => 
                !canDefenseCardUseFaction(defenseCard, factionId)
            ));
            
            if (usedDefenseFactionNames.length > 0) {
                alert(`❌ Фракции: ${usedDefenseFactionNames.join(', ')} уже не активны для карты защиты ${defenseCard.name}. Доступные фракции: ${availableDefenseFactionNames.join(', ')}. Атакующая карта: ${attackFactionNames.join(', ')}`);
            } else {
                alert(`❌ Нет общих фракций! Атакующая карта: ${attackFactionNames.join(', ')}, Защитная карта: ${availableDefenseFactionNames.join(', ')}`);
            }
            return false;
        }

        // Сохраняем фракции защиты в буфер (кроме фракций первой карты атаки)
        const defenseBuffer = saveDefenseFactionsToBuffer(factionCounter);

        // Обновляем активные фракции
        // Сохраняем фракции первой карты атаки (они всегда остаются)
        const firstAttackFactions = getFirstAttackCardFactions();
        const firstAttackFactionNames = getFactionNames(firstAttackFactions);
        
        // Добавляем фракции из пересечения с защитной картой
        const intersectionNames = getFactionNames(intersection);
        
        // Обновляем счётчик: оставляем только фракции первой карты атаки + пересечение
        const keepFactions = [...firstAttackFactions, ...intersection];
        setFactionCounter(prev => {
            const newCounter: Record<number, number> = {};
            keepFactions.forEach(factionId => {
                if (prev[factionId] && prev[factionId] > 0) {
                    newCounter[factionId] = prev[factionId];
                }
            });
            return newCounter;
        });
        
        // Сначала отнимаем от счётчика все фракции текущей карты защиты
        setFactionCounter(prev => {
            const newCounter = { ...prev };
            
            // Отнимаем все фракции текущей карты защиты
            defenseCard.factions.forEach(factionId => {
                if (newCounter[factionId] && newCounter[factionId] > 0) {
                    newCounter[factionId] = newCounter[factionId] - 1;
                    console.log(`🎯 Отнимаем 1 от ${FACTIONS[factionId]}, осталось: ${newCounter[factionId]}`);
                    
                    // Если счётчик стал 0 или меньше - убираем фракцию
                    if (newCounter[factionId] <= 0) {
                        delete newCounter[factionId];
                        console.log(`🎯 Убираем ${FACTIONS[factionId]} (счётчик стал 0)`);
                    }
                }
            });
            
            return newCounter;
        });
        
        // Отмечаем использованные фракции для текущей карты защиты
        const defenseCardNonIntersectingFactions = defenseCard.factions.filter(factionId => !intersection.includes(factionId));
        setUsedDefenseCardFactions(prev => ({
            ...prev,
            [defenseCard.id]: [...(prev[defenseCard.id] || []), ...defenseCardNonIntersectingFactions]
        }));
        
        console.log(`🎯 Карта защиты ${defenseCard.name} использовала фракции:`, defenseCardNonIntersectingFactions.map(id => FACTIONS[id]));
        
        // Теперь восстанавливаем фракции из буфера (кроме фракций первой карты атаки)
        const filteredDefenseBuffer: Record<number, number> = {};
        
        Object.keys(defenseBuffer).forEach(factionIdStr => {
            const factionId = parseInt(factionIdStr);
            const bufferCount = defenseBuffer[factionId];
            
            // Не восстанавливаем фракции первой карты атаки (они уже в счётчике)
            if (!firstAttackFactions.includes(factionId)) {
                // Восстанавливаем фракции, которые либо пересекаются, либо принадлежат другим картам защиты
                if (intersection.includes(factionId)) {
                    // Это фракция текущей карты защиты, которая пересекается - восстанавливаем
                    filteredDefenseBuffer[factionId] = bufferCount;
                    console.log(`🎯 Восстанавливаем ${FACTIONS[factionId]} из буфера (пересекается): ${bufferCount}`);
                } else if (!defenseCard.factions.includes(factionId)) {
                    // Это фракция от другой карты защиты - восстанавливаем
                    filteredDefenseBuffer[factionId] = bufferCount;
                    console.log(`🎯 Восстанавливаем ${FACTIONS[factionId]} из буфера (от другой карты защиты): ${bufferCount}`);
                } else {
                    // Это фракция текущей карты защиты, которая НЕ пересекается
                    // Проверяем, есть ли эта фракция у других карт защиты
                    const hasOtherDefenseCards = defenseCards.some(card => 
                        card && card.id !== defenseCard.id && card.factions.includes(factionId)
                    );
                    
                    if (hasOtherDefenseCards) {
                        // Есть другие карты защиты с этой фракцией - восстанавливаем
                        // Карта защиты "использовалась", но другие карты могут использовать эту фракцию
                        filteredDefenseBuffer[factionId] = bufferCount;
                        console.log(`🎯 Восстанавливаем ${FACTIONS[factionId]} из буфера (есть у других карт защиты, текущая карта "использовалась"): ${bufferCount}`);
                    } else {
                        // Нет других карт защиты с этой фракцией - НЕ восстанавливаем
                        console.log(`🎯 НЕ восстанавливаем ${FACTIONS[factionId]} из буфера (нет у других карт защиты)`);
                    }
                }
            }
        });
        
        // Восстанавливаем фракции защиты из буфера
        setFactionCounter(prev => {
            const newCounter = { ...prev };
            // Восстанавливаем фракции из отфильтрованного буфера
            Object.keys(filteredDefenseBuffer).forEach(factionIdStr => {
                const factionId = parseInt(factionIdStr);
                newCounter[factionId] = filteredDefenseBuffer[factionId];
            });
            
            console.log(`🎯 Восстановлены фракции защиты из буфера:`, Object.keys(filteredDefenseBuffer).map(id => `${FACTIONS[parseInt(id)]}(${filteredDefenseBuffer[parseInt(id)]})`));
            
            // Обновляем активные фракции на основе ПОЛНОГО счётчика (фракции первой карты + пересечение + фракции защиты)
            const allActiveFactions = Object.keys(newCounter)
                .map(id => parseInt(id))
                .filter(id => newCounter[id] > 0)
                .map(id => {
                    const factionEntry = Object.entries(FACTIONS).find(([_, name]) => name === FACTIONS[id]);
                    return factionEntry ? FACTIONS[id] : `Unknown ${id}`;
                });
            
            console.log(`🎯 Атакующая карта прикреплена через защитную. Пересечение:`, intersectionNames);
            console.log(`🎯 Фракции первой карты атаки:`, firstAttackFactionNames);
            console.log(`🎯 Итоговые активные фракции:`, allActiveFactions);
            
            return newCounter;
        });
        
        return true;
    };

    // Функция для обновления активных фракций после добавления карты (универсальная)
    const updateActiveFactions = (card: Card) => {
        if (isFirstAttackCard()) {
            updateActiveFactionsFromAttackCard(card);
        } else {
            updateActiveFactionsFromAttackCard(card);
        }
    };

    const myId = currentPlayerId;
    const myHand = gameState.hands[myId] || [];

    // useEffect для синхронизации размера div защиты с div атаки
    useEffect(() => {
        syncDefenseZoneSize();
    }, [gameState.slots]);

    // useEffect для обновления состояния кнопки "Взять карты"
    useEffect(() => {
        const canTake = checkCanTakeCards();
        setCanTakeCards(canTake);
        console.log(`🔍 Проверка кнопки "Взять карты": gameMode=${gameMode}, canTake=${canTake}`);
    }, [gameMode, gameState.slots, defenseCards]);

    // useEffect для отслеживания движения мыши
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (gameMode === 'defense' && activeCard && activeCard.source === 'hand') {
                setMousePosition({ x: e.clientX, y: e.clientY });
            }
        };

        if (gameMode === 'defense' && activeCard && activeCard.source === 'hand') {
            document.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [gameMode, activeCard]);
    


    // Функция для обновления игрового состояния (будет использоваться позже)
    // const updateGame = (updater: (prev: GameState) => GameState) => {
    //     setGameState(updater);
    // };

    // Функция для переключения на другого игрока
    const switchToPlayer = (playerId: string) => {
        // Если игра инициализирована, проверяем роль игрока
        if (gameInitialized) {
            const playerRole = playerRoles[playerId];
            if (playerRole === 'observer') {
                console.log('❌ Наблюдающие игроки не могут быть активными');
                return;
            }
            
            // Автоматически переключаем режим в зависимости от роли
            if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                setGameMode('attack');
            } else if (playerRole === 'defender') {
                setGameMode('defense');
            }
        }
        
        setCurrentPlayerId(playerId);
    };
    
    // Функция для завершения игры и возврата в исходное состояние
    const endGame = () => {
        setGameInitialized(false);
        setPlayerRoles({});
        setCurrentPlayerId('player-1');
        setGameMode('attack');
        setShowFirstPlayerModal(false);
        setFirstPlayerInfo(null);
        // Сбрасываем состояния приоритета атаки
        setAttackPriority('attacker');
        setMainAttackerHasPlayed(false);
        setAttackerPassed(false);
        setCoAttackerPassed(false);
        
        // Сбрасываем состояния блокировки кнопок
        setAttackerBitoPressed(false);
        setCoAttackerBitoPressed(false);
        setAttackerPasPressed(false);
        setCoAttackerPasPressed(false);
    };
    
    // Функции для работы с приоритетом атаки
    const getCurrentPlayerRole = (): 'attacker' | 'co-attacker' | 'defender' | 'observer' | null => {
        return playerRoles[currentPlayerId] || null;
    };
    
    const canPlayerAttack = (): boolean => {
        const role = getCurrentPlayerRole();
        if (!role || role === 'observer' || role === 'defender') return false;
        
        // Если главный атакующий еще не подкинул карты, только он может атаковать
        if (!mainAttackerHasPlayed) {
            return role === 'attacker';
        }
        
        // После того как главный атакующий подкинул карты, приоритет определяется текущим состоянием
        return role === attackPriority;
    };
    
    // Функция для проверки, есть ли неотбитые карты на столе
    const hasUnbeatenCards = (): boolean => {
        const attackCards = gameState.slots || [];
        const hasUnbeaten = attackCards.some((attackCard, index) => {
            if (!attackCard) return false;
            const defenseCard = defenseCards[index];
            return defenseCard === null; // Карта атаки не отбита, если нет карты защиты
        });
        
        console.log('🔍 Проверка неотбитых карт:', {
            attackCards: attackCards.filter(card => card !== null).length,
            defenseCards: defenseCards.filter(card => card !== null).length,
            hasUnbeaten,
            attackCardsDetails: attackCards.map((card, index) => ({
                index,
                attackCard: card?.name || 'null',
                defenseCard: defenseCards[index]?.name || 'null'
            }))
        });
        
        return hasUnbeaten;
    };
    
    // Функция для проверки, нужно ли показывать кнопку Бито
    const shouldShowBitoButton = (): boolean => {
        // Не показываем Бито если один игрок уже нажал Пас
        if (attackerPassed || coAttackerPassed) {
            return false;
        }
        // Не показываем Бито для 2 игроков (только Пас)
        if (playerCount === 2) {
            return false;
        }
        return true;
    };
    
    const handleBito = () => {
        const role = getCurrentPlayerRole();
        if (!role || (role !== 'attacker' && role !== 'co-attacker')) {
            console.log('❌ Только атакующие игроки могут нажимать Бито');
            return;
        }
        
        if (!mainAttackerHasPlayed) {
            console.log('❌ Главный атакующий должен сначала подкинуть хотя бы одну карту');
            return;
        }
        
        // Проверяем, есть ли неотбитые карты на столе
        const hasUnbeaten = hasUnbeatenCards();
        console.log('🎯 Проверка Бито - есть ли неотбитые карты:', hasUnbeaten);
        if (hasUnbeaten) {
            console.log('❌ Нельзя нажимать Бито пока есть неотбитые карты на столе');
            alert('❌ Нельзя нажимать Бито пока есть неотбитые карты на столе');
            return;
        }
        
        // Проверяем, не заблокирована ли кнопка
        if (role === 'attacker' && attackerBitoPressed) {
            console.log('❌ Кнопка Бито уже нажата главным атакующим');
            return;
        }
        if (role === 'co-attacker' && coAttackerBitoPressed) {
            console.log('❌ Кнопка Бито уже нажата со-атакующим');
            return;
        }
        
        
        // Обычная логика передачи приоритета
        const newPriority = attackPriority === 'attacker' ? 'co-attacker' : 'attacker';
        setAttackPriority(newPriority);
        
        // Блокируем кнопку Бито для текущего игрока и разблокируем для другого
        if (role === 'attacker') {
            setAttackerBitoPressed(true);
            setCoAttackerBitoPressed(false); // Разблокируем кнопку Бито со-атакующего
        } else if (role === 'co-attacker') {
            setCoAttackerBitoPressed(true);
            setAttackerBitoPressed(false); // Разблокируем кнопку Бито главного атакующего
        }
        
        console.log(`🎯 Приоритет атаки передан от ${role} к ${newPriority}`);
    };
    
    const handlePas = () => {
        const role = getCurrentPlayerRole();
        if (!role || (role !== 'attacker' && role !== 'co-attacker')) {
            console.log('❌ Только атакующие игроки могут нажимать Пас');
            return;
        }
        
        if (!mainAttackerHasPlayed) {
            console.log('❌ Главный атакующий должен сначала подкинуть хотя бы одну карту');
            return;
        }
        
        // Проверяем, есть ли неотбитые карты на столе
        const hasUnbeaten = hasUnbeatenCards();
        console.log('🎯 Проверка Пас - есть ли неотбитые карты:', hasUnbeaten);
        if (hasUnbeaten) {
            console.log('❌ Нельзя нажимать Пас пока есть неотбитые карты на столе');
            alert('❌ Нельзя нажимать Пас пока есть неотбитые карты на столе');
            return;
        }
        
        // Проверяем, не заблокирована ли кнопка
        if (role === 'attacker' && attackerPasPressed) {
            console.log('❌ Кнопка Пас уже нажата главным атакующим');
            return;
        }
        if (role === 'co-attacker' && coAttackerPasPressed) {
            console.log('❌ Кнопка Пас уже нажата со-атакующим');
            return;
        }
        
        if (role === 'attacker') {
            console.log('🎯 Главный атакующий нажал Пас');
            setAttackerPassed(true);
            setAttackerPasPressed(true); // Блокируем кнопку Пас навсегда
            
            // Для 2 игроков сразу завершаем ход
            if (playerCount === 2) {
                console.log('🎯 2 игрока: атакующий отказался - завершаем ход');
                endTurn();
                return;
            }
            
            setAttackPriority('co-attacker'); // Передаем приоритет со-атакующему
            console.log('🎯 Главный атакующий отказался от подкидывания, приоритет передан со-атакующему');
            
            // Проверяем завершение хода с обновленным состоянием
            setTimeout(() => {
                checkTurnEnd(true, coAttackerPassed);
            }, 0);
        } else if (role === 'co-attacker') {
            console.log('🎯 Со-атакующий нажал Пас');
            setCoAttackerPassed(true);
            setCoAttackerPasPressed(true); // Блокируем кнопку Пас навсегда
            setAttackPriority('attacker'); // Передаем приоритет главному атакующему
            console.log('🎯 Со-атакующий отказался от подкидывания, приоритет передан главному атакующему');
            
            // Проверяем завершение хода с обновленным состоянием
            setTimeout(() => {
                checkTurnEnd(attackerPassed, true);
            }, 0);
        }
    };
    
    const checkTurnEnd = (forceAttackerPassed?: boolean, forceCoAttackerPassed?: boolean) => {
        const currentAttackerPassed = forceAttackerPassed !== undefined ? forceAttackerPassed : attackerPassed;
        const currentCoAttackerPassed = forceCoAttackerPassed !== undefined ? forceCoAttackerPassed : coAttackerPassed;
        
        console.log('🔍 Проверка завершения хода:', {
            attackerPassed: currentAttackerPassed,
            coAttackerPassed: currentCoAttackerPassed,
            bothPassed: currentAttackerPassed && currentCoAttackerPassed,
            playerCount,
            forceValues: forceAttackerPassed !== undefined || forceCoAttackerPassed !== undefined
        });
        
        // Если оба игрока отказались от подкидывания, завершаем ход
        if (currentAttackerPassed && currentCoAttackerPassed) {
            console.log('🎯 Оба атакующих игрока отказались от подкидывания, завершаем ход');
            endTurn();
        }
    };
    
    const endTurn = () => {
        console.log('🎯 endTurn() вызвана!');
        
        // Перемещаем все карты со стола в стопку сброса
        const attackCards = gameState.slots?.filter(card => card !== null) || [];
        const defenseCardsOnTable = defenseCards.filter(card => card !== null);
        const allCardsToDiscard = [...attackCards, ...defenseCardsOnTable];
        
        console.log('🎯 Карты для сброса:', {
            attackCards: attackCards.length,
            defenseCards: defenseCardsOnTable.length,
            total: allCardsToDiscard.length,
            attackCardNames: attackCards.map(card => card.name),
            defenseCardNames: defenseCardsOnTable.map(card => card.name)
        });
        
        setGameState(prev => ({
            ...prev,
            slots: [null, null, null, null, null, null],
            discardPile: [...prev.discardPile, ...allCardsToDiscard]
        }));
        
        // Очищаем карты защиты
        setDefenseCards([null, null, null, null, null, null]);
        
        // Сбрасываем состояния приоритета атаки
        setAttackPriority('attacker');
        setMainAttackerHasPlayed(false);
        setAttackerPassed(false);
        setCoAttackerPassed(false);
        
        // Сбрасываем состояния блокировки кнопок
        setAttackerBitoPressed(false);
        setCoAttackerBitoPressed(false);
        setAttackerPasPressed(false);
        setCoAttackerPasPressed(false);
        
        console.log(`🎯 Ход завершен, ${allCardsToDiscard.length} карт перемещено в стопку сброса`);
        
        // Меняем роли после успешной защиты (сброс карт)
        rotateRolesAfterSuccessfulDefense();
        
        // Обрабатываем очередь добора карт
        setTimeout(() => {
            processDrawQueue();
        }, 100);
        
        // Проверяем окончание игры ПОСЛЕ действия конца хода (сброс карт)
        setTimeout(() => {
            const gameEnded = checkGameEnd();
            if (gameEnded) {
                console.log('🎮 Игра окончена после сброса карт');
            }
        }, 200);
    };

    // Функция для изменения seed и пересоздания игры
    const changeSeed = (newSeed: number) => {
        setSeed(newSeed);
        setGameState(createBasicGameState(newSeed, playerCount));
        setCurrentPlayerId("player-1");
    };

    // Функция для изменения количества игроков и пересоздания игры
    const changePlayerCount = (newPlayerCount: number) => {
        setPlayerCount(newPlayerCount);
        setGameState(createBasicGameState(seed, newPlayerCount));
        setCurrentPlayerId("player-1");
        setGameInitialized(false); // Сбрасываем инициализацию при изменении количества игроков
        setPlayerRoles({});
    };

    // Функция для определения первого игрока по самой слабой карте
    const determineFirstPlayer = (): {playerId: string, playerName: string, cardName: string, power: number} => {
        const players = gameState.players;
        const hands = gameState.hands;
        
        let weakestPlayer = {playerId: "", playerName: "", cardName: "", power: 999};
        
        // Проходим по всем игрокам и находим самую слабую карту
        Object.keys(players).forEach(playerId => {
            const playerHand = hands[playerId] || [];
            if (playerHand.length === 0) return;
            
            // Находим самую слабую карту у игрока
            const weakestCard = playerHand.reduce((weakest, card) => 
                card.power < weakest.power ? card : weakest, playerHand[0]);
            
            // Если эта карта слабее текущей самой слабой
            if (weakestCard.power < weakestPlayer.power) {
                weakestPlayer = {
                    playerId,
                    playerName: players[playerId]?.name || playerId,
                    cardName: weakestCard.name,
                    power: weakestCard.power
                };
            }
        });
        
        return weakestPlayer;
    };

    // Функция для назначения ролей игрокам
    const assignPlayerRoles = (firstPlayerId: string) => {
        const turnOrder = gameState.turnOrder || [];
        const roles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
        
        const firstPlayerIndex = turnOrder.indexOf(firstPlayerId);
        
        // Назначаем роли по кругу от первого игрока
        turnOrder.forEach((playerId, index) => {
            const relativeIndex = (index - firstPlayerIndex + turnOrder.length) % turnOrder.length;
            
            if (relativeIndex === 0) {
                roles[playerId] = 'attacker'; // Главный атакующий
            } else if (relativeIndex === 1) {
                roles[playerId] = 'defender'; // Защищающийся
            } else if (relativeIndex === 2 && playerCount >= 3) {
                roles[playerId] = 'co-attacker'; // Со-атакующий
            } else {
                roles[playerId] = 'observer'; // Наблюдающий
            }
        });
        
        setPlayerRoles(roles);
    };

    // Функция для инициализации игры
    const initializeGame = () => {
        const firstPlayer = determineFirstPlayer();
        
        // Обновляем текущего игрока
        setCurrentPlayerId(firstPlayer.playerId);
        
        // Назначаем роли
        assignPlayerRoles(firstPlayer.playerId);
        
        // Автоматически включаем режимы в зависимости от ролей
        const firstPlayerRole = playerRoles[firstPlayer.playerId];
        if (firstPlayerRole === 'attacker' || firstPlayerRole === 'co-attacker') {
            setGameMode('attack');
        } else if (firstPlayerRole === 'defender') {
            setGameMode('defense');
        }
        
        // Показываем модальное окно с информацией о первом игроке
        setFirstPlayerInfo(firstPlayer);
        setShowFirstPlayerModal(true);
        
        // Автоматически закрываем модальное окно через 6 секунд
        setTimeout(() => {
            setShowFirstPlayerModal(false);
        }, 6000);
        
        // Отмечаем игру как инициализированную
        setGameInitialized(true);
        
        console.log(`🎯 Первый игрок определен: ${firstPlayer.playerName} (${firstPlayer.cardName}, сила: ${firstPlayer.power})`);
    };

    // Функция для получения эмодзи роли
    const getRoleEmoji = (role: 'attacker' | 'co-attacker' | 'defender' | 'observer'): string => {
        switch (role) {
            case 'attacker': return '⚔️⚔️'; // Два меча - главный атакующий
            case 'co-attacker': return '⚔️'; // Один меч - со-атакующий
            case 'defender': return '🛡️'; // Щит - защитник
            case 'observer': return '👁️'; // Глаз - наблюдающий
            default: return '';
        }
    };

    // Drag & Drop функции
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        
        // Проверяем роль текущего игрока - наблюдающие не могут взаимодействовать со столом
        if (gameInitialized && playerRoles[currentPlayerId] === 'observer') {
            console.log('❌ Наблюдающие игроки не могут перетаскивать карты');
            return;
        }
        
        const cardData = active.data.current as { card: Card; index: number; source: string };
        console.log('🎯 handleDragStart:', { activeId: active.id, cardData, gameMode });
        if (cardData) {
            setActiveCard(cardData);
            console.log('✅ activeCard установлен:', cardData);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        console.log('🎯 handleDragEnd ВЫЗВАН!', { activeId: active.id, overId: over?.id, gameMode });
        console.log('🔍 ТЕКУЩИЕ СОСТОЯНИЯ:', { hoveredAttackCard, activeCard: !!activeCard });
        
        // Проверяем роль текущего игрока - наблюдающие не могут взаимодействовать со столом
        if (gameInitialized && playerRoles[currentPlayerId] === 'observer') {
            console.log('❌ Наблюдающие игроки не могут взаимодействовать со столом');
            setActiveCard(null);
            setMousePosition(null);
            setHoveredAttackCard(null);
            setHoveredDefenseCard(null);
            setActiveDropZone(null);
            setInvalidDefenseCard(null);
            return;
        }
        
        // Проверяем приоритет атаки для атакующих игроков
        if (gameInitialized && gameMode === 'attack' && !canPlayerAttack()) {
            console.log('❌ Приоритет атаки не у вас');
            alert('Приоритет атаки не у вас');
            setActiveCard(null);
            setMousePosition(null);
            setHoveredAttackCard(null);
            setHoveredDefenseCard(null);
            setActiveDropZone(null);
            setInvalidDefenseCard(null);
            return;
        }
        
        // Сбрасываем все ховеры при завершении перетаскивания
        setHoveredAttackCard(null);
        setHoveredDefenseCard(null);
        setActiveDropZone(null);
        setInvalidDefenseCard(null);
        
        if (!over) {
            console.log('❌ Нет цели для drop, сбрасываем activeCard');
            setActiveCard(null);
            setMousePosition(null);
            // Ховеры уже сброшены выше
            return;
        }

        const cardData = active.data.current as { card: Card; index: number; source: string };
        if (!cardData) {
            console.log('❌ Нет данных карты, сбрасываем activeCard');
            setActiveCard(null);
            setMousePosition(null);
            return;
        }

        const { card, index, source } = cardData;
        const targetZone = over.id;
        console.log('🎯 Перетаскивание:', { source, targetZone, cardName: card.name });
        console.log('🔍 Отладочная информация:', { 
            gameMode, 
            hoveredAttackCard,
            hoveredDefenseCard,
            activeCard: activeCard ? activeCard.card.name : null
        });

        // Специальная обработка для карт защиты в режиме атаки
        const targetZoneString = String(targetZone);
        console.log('🔍 ПРОВЕРКА УСЛОВИЙ:', { 
            source, 
            gameMode, 
            hoveredDefenseCard, 
            targetZone: targetZoneString,
            condition: source === 'hand' && gameMode === 'attack' && (hoveredDefenseCard !== null || targetZoneString.startsWith('defense-card-'))
        });
        
        if (source === 'hand' && gameMode === 'attack' && (hoveredDefenseCard !== null || targetZoneString.startsWith('defense-card-'))) {
            console.log('🎯 Карта отпущена над картой защиты, добавляем в див атаки');
            
            // Определяем карту защиты
            let defenseCard: Card | null = null;
            if (hoveredDefenseCard !== null && defenseCards[hoveredDefenseCard]) {
                defenseCard = defenseCards[hoveredDefenseCard];
            } else if (targetZoneString.startsWith('defense-card-')) {
                const defenseIndex = parseInt(targetZoneString.replace('defense-card-', ''));
                defenseCard = defenseCards[defenseIndex];
            }
            
            if (!defenseCard) {
                console.log('❌ Карта защиты не найдена');
                return;
            }
            
            // Используем специальную механику прикрепления через защитную карту
            const success = attachAttackCardThroughDefense(card, defenseCard);
            if (!success) {
                setActiveCard(null);
                setMousePosition(null);
                return;
            }
            
            // Находим свободный слот
            let slots = gameState.slots || [];
            
            // Если слотов нет, создаем массив из 6 пустых слотов
            if (slots.length === 0) {
                slots = new Array(6).fill(null);
                console.log('🔧 Создаем новые слоты:', slots.length);
            }
            
            const freeSlotIndex = slots.findIndex(slot => slot === null);
            console.log('🔍 Свободный слот:', freeSlotIndex, 'из', slots.length, 'слотов');
            
            if (freeSlotIndex >= 0) {
                console.log('🎯 ДОБАВЛЯЕМ КАРТУ в слот', freeSlotIndex);
                
                setGameState((prev) => {
                const myCards = [...(prev.hands[myId] || [])];
                myCards.splice(index, 1);
                
                const slots = [...prev.slots];
                    slots[freeSlotIndex] = card;
                
                return {
                    ...prev,
                    hands: { ...prev.hands, [myId]: myCards },
                    slots,
                };
            });
            
            // Отмечаем, что главный атакующий подкинул карту
            if (getCurrentPlayerRole() === 'attacker') {
                setMainAttackerHasPlayed(true);
                console.log('🎯 Главный атакующий подкинул карту, теперь со-атакующий может играть');
            }
            
            // Добавляем игрока в очередь добора (атакующие игроки)
            addToDrawQueue(myId, false);
                
                console.log('✅ КАРТА УСПЕШНО ДОБАВЛЕНА!');
            } else {
                console.log('❌ НЕТ СВОБОДНЫХ СЛОТОВ');
                alert('🃏 Стол полон! Максимум 6 карт.');
            }
            
            // Сбрасываем все состояния
            setActiveCard(null);
            setMousePosition(null);
            setHoveredDefenseCard(null);
            console.log('🔄 СОСТОЯНИЯ СБРОШЕНЫ');
            return;
        }

        // Перемещение карты из руки на стол
        if (source === 'hand' && targetZone === 'table') {
            // Проверяем режим: в режиме защиты нельзя добавлять карты на стол атаки
            if (gameMode === 'defense') {
                // В режиме защиты пытаемся отбить карту
                // Находим ближайшую карту атаки для отбивания
                const attackCards = gameState.slots?.map((slot, idx) => ({ slot, index: idx })).filter(({ slot }) => slot !== null) || [];
                
                if (attackCards.length > 0) {
                    // Используем hoveredAttackCard если он есть, иначе первую карту
                    const targetIndex = hoveredAttackCard !== null ? hoveredAttackCard : attackCards[0].index;
                    console.log('🎯 Выбранный индекс для защиты:', targetIndex, 'hoveredAttackCard:', hoveredAttackCard);
                    
                    // Добавляем карту защиты над выбранной картой атаки
                    const defenseAdded = addDefenseCard(targetIndex, card);
                    
                    // Убираем карту из руки только если карта защиты была успешно добавлена
                    if (defenseAdded) {
                        setGameState((prev) => {
                            const myCards = [...(prev.hands[myId] || [])];
                            // Дополнительная проверка - убеждаемся, что карта по индексу существует
                            if (index >= 0 && index < myCards.length && myCards[index]?.id === card.id) {
                                myCards.splice(index, 1);
                                console.log(`✅ Карта "${card.name}" убрана из руки. Осталось карт: ${myCards.length}`);
                            } else {
                                console.log(`⚠️ Карта "${card.name}" не найдена в руке по индексу ${index}. Карты в руке:`, myCards.map(c => c.name));
                            }
                return {
                    ...prev,
                    hands: { ...prev.hands, [myId]: myCards },
                };
            });
                        
                        // Добавляем игрока в очередь добора (защитник)
                        addToDrawQueue(myId, true);
                    } else {
                        console.log('⚠️ Карта защиты не была добавлена, карта остается в руке');
        }

                    // Карта защиты добавлена
                } else {
                    alert('🛡️ Нет карт атаки для отбивания!');
                }
        setActiveCard(null);
                setMousePosition(null);
                return;
            }
            
            // В режиме атаки добавляем карту на стол (обычное перетаскивание)
            // Сначала валидируем карту
            const validation = validateAttackCard(card);
            if (!validation.isValid) {
                alert(`❌ ${validation.reason}`);
                setActiveCard(null);
                setMousePosition(null);
                return;
            }
            
            // Всегда добавляем в первый свободный слот (до 6 максимум)
            let slots = gameState.slots || [];
            
            // Если слотов нет, создаем массив из 6 пустых слотов
            if (slots.length === 0) {
                slots = new Array(6).fill(null);
                console.log('🔧 Создаем новые слоты (обычное):', slots.length);
            }
            
            const freeSlotIndex = slots.findIndex(slot => slot === null);
            console.log('🔍 Свободный слот (обычное):', freeSlotIndex, 'из', slots.length, 'слотов');
            
            if (freeSlotIndex >= 0) {
                console.log('🎯 Добавляем карту атаки в свободный слот', freeSlotIndex, 'обычное перетаскивание');
                
                // Обновляем активные фракции
                updateActiveFactions(card);
                
                setGameState((prev) => {
                    const myCards = [...(prev.hands[myId] || [])];
                    myCards.splice(index, 1);
                    
                    const slots = [...prev.slots];
                    slots[freeSlotIndex] = card;
            
            return {
                ...prev,
                        hands: { ...prev.hands, [myId]: myCards },
                        slots,
            };
        });
        
        // Отмечаем, что главный атакующий подкинул карту
        if (getCurrentPlayerRole() === 'attacker') {
            setMainAttackerHasPlayed(true);
            console.log('🎯 Главный атакующий подкинул карту, теперь со-атакующий может играть');
        }
            } else {
                alert('🃏 Стол полон! Максимум 6 карт.');
            }
        }
        
        // Взятие карты со стола - отключено для предотвращения конфликтов
        if (source === 'table' && targetZone === 'my-hand') {
            console.log('🛡️ Вытаскивание карт со стола отключено для предотвращения конфликтов');
            setActiveCard(null);
            setMousePosition(null);
            return;
        }

        console.log('🔄 Сбрасываем activeCard в конце handleDragEnd');
        setActiveCard(null);
        setMousePosition(null);
        
        // Очищаем ховер эффекты во всех режимах
        setHoveredAttackCard(null);
        setHoveredDefenseCard(null);
        setActiveDropZone(null);
        setInvalidDefenseCard(null);
    };

    // Функция для сброса игры с текущим seed
    const resetGame = () => {
        setGameState(createBasicGameState(seed, playerCount));
        setCurrentPlayerId("player-1");
        resetTableStates(); // Используем централизованную функцию сброса состояний
    };

    // Функции для управления очередью добора карт
    const addToDrawQueue = (playerId: string, isDefender: boolean = false) => {
        console.log(`🎯 Добавляем игрока ${playerId} в очередь добора (защитник: ${isDefender})`);
        console.log(`🎯 Текущая очередь до добавления:`, drawQueue);
        
        setDrawQueue(prev => {
            const newQueue = isDefender ? [...prev, playerId] : [playerId, ...prev];
            console.log(`🎯 Новая очередь после добавления:`, newQueue);
            return newQueue;
        });
    };
    
    const processDrawQueue = () => {
        console.log('🎯 Обрабатываем очередь добора карт:', drawQueue);
        console.log('🎯 Текущее состояние игры:', {
            deckLength: gameState.deck.length,
            hands: Object.keys(gameState.hands).map(id => ({ id, cards: gameState.hands[id]?.length || 0 }))
        });
        
        if (drawQueue.length === 0) {
            console.log('🎯 Очередь добора пуста');
            return;
        }
        
        // Создаем копию очереди для обработки
        const queueToProcess = [...drawQueue];
        
        // Обрабатываем каждого игрока в очереди
        queueToProcess.forEach(playerId => {
            const playerHand = gameState.hands[playerId] || [];
            const cardsNeeded = Math.min(6 - playerHand.length, gameState.deck.length);
            
            console.log(`🎯 Игрок ${playerId}: карт в руке ${playerHand.length}, нужно добрать ${cardsNeeded}`);
            
            if (cardsNeeded > 0 && gameState.deck.length > 0) {
                const drawnCards = gameState.deck.slice(0, cardsNeeded);
                const remainingDeck = gameState.deck.slice(cardsNeeded);
                
                console.log(`🎯 Добераем ${cardsNeeded} карт игроку ${playerId}:`, drawnCards.map(card => card.name));
                
                setGameState(prev => ({
                ...prev,
                    hands: {
                        ...prev.hands,
                        [playerId]: [...playerHand, ...drawnCards]
                    },
                    deck: remainingDeck
                }));
            } else {
                console.log(`🎯 Игрок ${playerId} пропущен: карт достаточно или колода пуста`);
            }
        });
        
        // Очищаем очередь после обработки
        setDrawQueue([]);
        console.log('🎯 Очередь добора обработана и очищена');
    };
    
    const clearDrawQueue = () => {
        console.log('🎯 Очищаем очередь добора карт');
        setDrawQueue([]);
    };

    // Функция для добора карт из колоды (ручной режим)
    const handleDrawCards = () => {
        console.log('🎯 Добор карт из колоды');
        
        if (gameState.deck.length === 0) {
            console.log('❌ Колода пуста, нельзя добрать карты');
            alert('❌ Колода пуста!');
            return;
        }
        
        // Добераем карты до 6 в руке
        const myHand = gameState.hands[myId] || [];
        const cardsToDraw = Math.min(6 - myHand.length, gameState.deck.length);
        
        if (cardsToDraw <= 0) {
            console.log('❌ В руке уже 6 карт, добор не нужен');
            alert('❌ В руке уже максимальное количество карт!');
            return;
        }
        
        const drawnCards = gameState.deck.slice(0, cardsToDraw);
        const remainingDeck = gameState.deck.slice(cardsToDraw);
        
        console.log(`🎯 Добераем ${cardsToDraw} карт из колоды`);
        console.log('🃏 Добранные карты:', drawnCards.map(card => card.name));
        
        setGameState(prev => ({
            ...prev,
            hands: {
                ...prev.hands,
                [myId]: [...myHand, ...drawnCards]
            },
            deck: remainingDeck
        }));
        
        // Проверяем окончание игры после добора (только если колода стала пустой)
        if (remainingDeck.length === 0) {
            setTimeout(() => {
                const gameEnded = checkGameEnd();
                if (gameEnded) {
                    console.log('🎮 Игра окончена после добора карт (колода опустошена)');
                }
            }, 100); // Небольшая задержка для обновления состояния
        }
        
        alert(`✅ Добрано ${cardsToDraw} карт из колоды!`);
    };

    // Функция для взятия карт
    // Функция для проверки окончания игры
    const checkGameEnd = () => {
        console.log('🔍 Проверка окончания игры');
        console.log('🎯 Колода пуста:', gameState.deck.length === 0);
        
        // Получаем количество карт у каждого игрока
        const playerCardCounts = Object.keys(gameState.hands).map(playerId => ({
            playerId,
            cardCount: gameState.hands[playerId]?.length || 0
        }));
        
        // Проверяем, есть ли игроки с 0 карт в руке
        const playersWithZeroCards = playerCardCounts.filter(p => p.cardCount === 0);
        const playersWithCards = playerCardCounts.filter(p => p.cardCount > 0);
        
        console.log('🎯 Игроки с 0 карт:', playersWithZeroCards);
        console.log('🎯 Игроки с картами:', playersWithCards);
        
        // Игра заканчивается только если:
        // 1. Колода пуста И
        // 2. У всех игроков кроме одного 0 карт (т.е. остался только один игрок с картами)
        if (gameState.deck.length === 0 && playersWithCards.length === 1) {
            const loser = playersWithCards[0];
            const winnerNames = playersWithZeroCards.map(p => `Игрок ${p.playerId.replace('player-', '')}`).join(', ');
            
            console.log('🎯 Проигравший (последний с картами):', loser);
            console.log('🎯 Победители (без карт):', playersWithZeroCards);
            
            alert(`🎮 ИГРА ОКОНЧЕНА! 🎮\n\n🏆 Победители: ${winnerNames}\n💀 Проиграл: Игрок ${loser.playerId.replace('player-', '')} (${loser.cardCount} карт)\n\nПоздравляем победителей!`);
            
            return true; // Игра окончена
        }
        
        // Если колода пуста, но еще есть несколько игроков с картами - игра продолжается
        if (gameState.deck.length === 0 && playersWithCards.length > 1) {
            console.log('🎯 Колода пуста, но игра продолжается - еще есть игроки с картами');
        }
        
        return false; // Игра продолжается
    };

    // Функция для смены ролей после успешного сброса карт (оба атакующих пасуют)
    const rotateRolesAfterSuccessfulDefense = () => {
        console.log('🔄 Смена ролей после успешной защиты (сброс карт)');
        console.log('🎯 Текущие роли:', playerRoles);
        console.log('🎯 Количество игроков:', playerCount);
        
        const newRoles = { ...playerRoles };
        
        if (playerCount === 2) {
            // Для 2 игроков: защитник → главный атакующий, атакующий → защитник
            const currentAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'attacker');
            const currentDefender = Object.keys(playerRoles).find(id => playerRoles[id] === 'defender');
            
            if (currentAttacker && currentDefender) {
                newRoles[currentDefender] = 'attacker';     // защитник → главный атакующий
                newRoles[currentAttacker] = 'defender';     // атакующий → защитник
                console.log('🎯 2 игрока: роли поменялись местами');
            }
        } else if (playerCount === 3) {
            // Для 3 игроков: защитник → главный атакующий, главный атакующий → защитник, со-атакующий → со-атакующий
            const currentAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'attacker');
            const currentCoAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'co-attacker');
            const currentDefender = Object.keys(playerRoles).find(id => playerRoles[id] === 'defender');
            
            if (currentAttacker && currentCoAttacker && currentDefender) {
                newRoles[currentDefender] = 'attacker';     // защитник → главный атакующий
                newRoles[currentAttacker] = 'defender';     // главный атакующий → защитник
                newRoles[currentCoAttacker] = 'co-attacker'; // со-атакующий остается со-атакующим
                console.log('🎯 3 игрока: роли сдвинуты на 1 вперед');
            }
        } else {
            // Для 4+ игроков: защитник → главный атакующий, со-атакующий → защитник, следующий от со-атакующего → со-атакующий
            const currentAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'attacker');
            const currentCoAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'co-attacker');
            const currentDefender = Object.keys(playerRoles).find(id => playerRoles[id] === 'defender');
            
            if (currentAttacker && currentCoAttacker && currentDefender) {
                // Находим следующих игроков по кругу
                const allPlayerIds = Object.keys(playerRoles);
                const coAttackerIndex = allPlayerIds.indexOf(currentCoAttacker);
                
                // Следующий от со-атакующего становится новым со-атакующим
                const nextAfterCoAttacker = allPlayerIds[(coAttackerIndex + 1) % allPlayerIds.length];
                
                newRoles[currentDefender] = 'attacker';           // защитник → главный атакующий
                newRoles[currentCoAttacker] = 'defender';         // со-атакующий → защитник
                newRoles[nextAfterCoAttacker] = 'co-attacker';    // следующий от со-атакующего → со-атакующий
                
                // Остальные становятся наблюдателями
                allPlayerIds.forEach(id => {
                    if (![currentDefender, currentCoAttacker, nextAfterCoAttacker].includes(id)) {
                        newRoles[id] = 'observer';
                    }
                });
                
                console.log('🎯 4+ игроков: роли сдвинуты на 1 вперед');
            }
        }
        
        setPlayerRoles(newRoles);
        console.log('🎯 Новые роли после успешной защиты:', newRoles);
    };

    // Функция для смены ролей после взятия карт защитником
    const rotateRolesAfterTakeCards = () => {
        console.log('🔄 Смена ролей после взятия карт защитником');
        console.log('🎯 Текущие роли:', playerRoles);
        console.log('🎯 Количество игроков:', playerCount);
        
        const newRoles = { ...playerRoles };
        
        if (playerCount === 2) {
            // Для 2 игроков роли не меняются
            console.log('🎯 2 игрока: роли не меняются');
        } else if (playerCount === 3) {
            // Для 3 игроков: со-атакующий → главный атакующий, главный → защитник, защитник → со-атакующий
            const currentAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'attacker');
            const currentCoAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'co-attacker');
            const currentDefender = Object.keys(playerRoles).find(id => playerRoles[id] === 'defender');
            
            if (currentAttacker && currentCoAttacker && currentDefender) {
                newRoles[currentCoAttacker] = 'attacker';      // со-атакующий → главный атакующий
                newRoles[currentAttacker] = 'defender';        // главный атакующий → защитник
                newRoles[currentDefender] = 'co-attacker';     // защитник → со-атакующий
                console.log('🎯 3 игрока: роли сдвинуты на 1 назад');
            }
        } else {
            // Для 4+ игроков: со-атакующий → главный атакующий, следующий → защитник, следующий → со-атакующий
            const currentAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'attacker');
            const currentCoAttacker = Object.keys(playerRoles).find(id => playerRoles[id] === 'co-attacker');
            const currentDefender = Object.keys(playerRoles).find(id => playerRoles[id] === 'defender');
            
            if (currentAttacker && currentCoAttacker && currentDefender) {
                // Находим следующих игроков по кругу
                const allPlayerIds = Object.keys(playerRoles);
                const coAttackerIndex = allPlayerIds.indexOf(currentCoAttacker);
                
                // Следующий от со-атакующего становится защитником
                const nextAfterCoAttacker = allPlayerIds[(coAttackerIndex + 1) % allPlayerIds.length];
                // Следующий от нового защитника становится со-атакующим
                const nextAfterNewDefender = allPlayerIds[(allPlayerIds.indexOf(nextAfterCoAttacker) + 1) % allPlayerIds.length];
                
                newRoles[currentCoAttacker] = 'attacker';           // со-атакующий → главный атакующий
                newRoles[nextAfterCoAttacker] = 'defender';         // следующий от со-атакующего → защитник
                newRoles[nextAfterNewDefender] = 'co-attacker';     // следующий от нового защитника → со-атакующий
                
                // Остальные становятся наблюдателями
                allPlayerIds.forEach(id => {
                    if (![currentCoAttacker, nextAfterCoAttacker, nextAfterNewDefender].includes(id)) {
                        newRoles[id] = 'observer';
                    }
                });
                
                console.log('🎯 4+ игроков: роли сдвинуты на 2 вперед');
            }
        }
        
        setPlayerRoles(newRoles);
        console.log('🎯 Новые роли:', newRoles);
    };

    const handleTakeCards = () => {
        if (!canTakeCards) {
            console.log('❌ Нельзя взять карты: условия не выполнены');
            return;
        }
        
        console.log('🎯 Взятие карт: переносим все карты со стола в руку');
        
        // Собираем все карты со стола (атаки и защиты)
        const attackCards = gameState.slots?.filter(card => card !== null) || [];
        const defenseCardsFromTable = defenseCards.filter(card => card !== null);
        const allTableCards = [...attackCards, ...defenseCardsFromTable];
        
        console.log(`📦 Карты для взятия: ${allTableCards.length} карт`);
        console.log('🃏 Карты атаки:', attackCards.map(card => card.name));
        console.log('🛡️ Карты защиты:', defenseCardsFromTable.map(card => card.name));
        
        if (allTableCards.length === 0) {
            console.log('⚠️ На столе нет карт для взятия');
            alert('⚠️ На столе нет карт для взятия');
            return;
        }
        
        // Обновляем состояние игры
        setGameState((prev) => {
            const myCards = [...(prev.hands[myId] || [])];
            const newHand = [...myCards, ...allTableCards];
            
            console.log(`✅ Карты добавлены в руку. Было: ${myCards.length}, стало: ${newHand.length}`);
            
            return {
                ...prev,
                hands: {
                    ...prev.hands,
                    [myId]: newHand
                },
                slots: new Array(6).fill(null) // Очищаем стол от карт атаки, но оставляем слоты
            };
        });
        
        // Очищаем карты защиты
        setDefenseCards([]);
        
        // Сбрасываем все состояния стола для нового хода
        resetTableStates();
        
        // Меняем роли после взятия карт
        rotateRolesAfterTakeCards();
        
        // Обрабатываем очередь добора карт
        setTimeout(() => {
            processDrawQueue();
        }, 100);
        
        console.log('✅ Все карты со стола перенесены в руку, стол очищен');
        alert(`✅ Взято ${allTableCards.length} карт со стола!`);
        
        // Проверяем окончание игры ПОСЛЕ действия конца хода
        setTimeout(() => {
            const gameEnded = checkGameEnd();
            if (gameEnded) {
                console.log('🎮 Игра окончена после взятия карт');
            }
        }, 200);
    };


    // Функция для полного сброса состояний (для будущей системы ходов)
    const resetTableStates = () => {
        console.log('🔄 Сброс состояний стола для нового хода');
        
        // Сбрасываем все состояния, связанные со столом
        setHoveredAttackCard(null);
        setHoveredDefenseCard(null);
        setActiveCard(null);
        setMousePosition(null);
        setActiveDropZone(null);
        setInvalidDefenseCard(null);
        setCanTakeCards(false);
        setFactionCounter({}); // Сбрасываем счётчик фракций
        setDefenseFactionsBuffer({}); // Сбрасываем буфер фракций защиты
        setActiveFirstAttackFactions([]); // Сбрасываем активные фракции первой карты
        setUsedDefenseCardFactions({}); // Сбрасываем использованные фракции карт защиты
        console.log('🎯 Буфер фракций защиты сброшен:', defenseFactionsBuffer);
        
        // Сбрасываем состояния приоритета атаки
        setAttackPriority('attacker');
        setMainAttackerHasPlayed(false);
        setAttackerPassed(false);
        setCoAttackerPassed(false);
        setAttackerBitoPressed(false);
        setCoAttackerBitoPressed(false);
        setAttackerPasPressed(false);
        setCoAttackerPasPressed(false);
        
        // Очищаем очередь добора карт
        clearDrawQueue();
        
        // Очищаем карты защиты (стол уже очищен в handleTakeCards)
        setDefenseCards([]);
        
        console.log('✅ Состояния стола сброшены');
    };

    // Функции ховера теперь не нужны - все обрабатывается глобальным сенсором
    const handleAttackCardHover = (_index: number) => {
        // Пустая функция - ховер обрабатывается глобальным сенсором
    };

    const handleAttackCardLeave = () => {
        // Пустая функция - ховер обрабатывается глобальным сенсором
    };

    const handleDefenseCardHover = (_index: number) => {
        // Пустая функция - ховер обрабатывается глобальным сенсором
    };

    const handleDefenseCardLeave = () => {
        // Пустая функция - ховер обрабатывается глобальным сенсором
    };



    
    // Функция добавления карты защиты над конкретной картой атаки
    const addDefenseCard = (attackCardIndex: number, defenseCard: Card): boolean => {
        console.log(`🛡️ Пытаемся добавить карту защиты "${defenseCard.name}" в слот ${attackCardIndex}`);
        
        // Получаем карту атаки для валидации
        const attackCard = gameState.slots?.[attackCardIndex];
        if (!attackCard) {
            console.log(`❌ Карта атаки в слоте ${attackCardIndex} не найдена`);
            return false;
        }
        
        // Валидация: проверяем, что карта защиты имеет достаточную силу
        if (!validateDefenseCard(defenseCard, attackCard)) {
            console.log(`❌ ВАЛИДАЦИЯ: Карта защиты "${defenseCard.name}" (сила: ${defenseCard.power}) не может защитить от карты атаки "${attackCard.name}" (сила: ${attackCard.power}). Требуется сила >= ${attackCard.power}`);
            alert(`❌ Недостаточная сила! Карта "${defenseCard.name}" (${defenseCard.power}) не может защитить от "${attackCard.name}" (${attackCard.power}). Требуется сила >= ${attackCard.power}`);
            return false;
        }
        
        // Сначала проверяем текущее состояние
        const currentDefenseCards = [...defenseCards];
        // Убеждаемся, что массив достаточно длинный
        while (currentDefenseCards.length <= attackCardIndex) {
            currentDefenseCards.push(null);
        }
        
        // Проверяем, не занят ли уже слот
        if (currentDefenseCards[attackCardIndex] !== null) {
            console.log(`❌ Слот ${attackCardIndex} уже занят картой "${currentDefenseCards[attackCardIndex]?.name}". Нельзя добавить "${defenseCard.name}"`);
            return false;
        }
        
        // Если слот свободен, добавляем карту
        currentDefenseCards[attackCardIndex] = defenseCard;
        setDefenseCards(currentDefenseCards);
        console.log(`✅ Карта защиты добавлена в слот ${attackCardIndex}. Массив:`, currentDefenseCards.map((card, idx) => card ? `${idx}:${card.name}` : `${idx}:null`));
        
        // Обновляем активные фракции и счётчик для карты защиты
        updateActiveFactionsFromDefenseCard(defenseCard);
        
        return true;
    };

    
    // Функция синхронизации размера div защиты с div атаки
    const syncDefenseZoneSize = () => {
        const attackCardsCount = gameState.slots?.filter(slot => slot !== null).length || 0;
        if (attackCardsCount > defenseCards.length) {
            setDefenseCards(prev => {
                const newDefenseCards = [...prev];
                while (newDefenseCards.length < attackCardsCount) {
                    newDefenseCards.push(null);
                }
                return newDefenseCards;
            });
        }
    };



    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ 
                minHeight: "100vh", 
                width: "100vw",
                margin: 0,
                padding: 0,
                display: "flex", 
                flexDirection: "column", 
                background: "#0b1020", 
                color: "#fff",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: "hidden"
            }}>
                {/* Debug Header */}
                <div style={{ 
                    padding: "12px 20px", 
                    background: "#1a1a2e", 
                    borderBottom: "2px solid #8B0000",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: "#FFD700" }}>🎮 Debug Game Board V1 (New Turn System)</h2>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            Карт в руке: {myHand.length} | Слотов на столе: {gameState.slots?.filter(s => s !== null).length || 0} | Колода: {gameState.deck.length} | Сброс: {gameState.discardPile?.length || 0} | Очередь добора: {drawQueue.length}
                        </div>
                        </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {!gameInitialized ? (
                            <button 
                                onClick={initializeGame}
                                style={{
                                    padding: "8px 16px",
                                    background: "#10b981",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                🚀 Начать игру
                            </button>
                        ) : (
                            <button 
                                onClick={endGame}
                                style={{
                                    padding: "8px 16px",
                                    background: "#dc2626",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}
                            >
                                🏁 Завершить игру
                            </button>
                        )}
                        
                        {/* Выбор количества игроков - скрыт после инициализации */}
                        {!gameInitialized && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Игроки:</span>
                                <select
                                    value={playerCount}
                                    onChange={(e) => changePlayerCount(parseInt(e.target.value))}
                                    style={{
                                        padding: "4px 8px",
                                        background: "#374151",
                                        border: "1px solid #4B5563",
                                        borderRadius: "4px",
                                        color: "#fff",
                                        fontSize: "12px"
                                    }}
                                >
                                    <option value={2}>2 игрока</option>
                                    <option value={3}>3 игрока</option>
                                    <option value={4}>4 игрока</option>
                                    <option value={5}>5 игроков</option>
                                    <option value={6}>6 игроков</option>
                                </select>
                        </div>
                        )}
                        
                        {/* Ключ колоды - скрыт после инициализации */}
                        {!gameInitialized && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Seed:</span>
                                <input
                                    type="number"
                                    value={seed}
                                    onChange={(e) => changeSeed(parseInt(e.target.value) || 42)}
                                    style={{
                                        width: "80px",
                                        padding: "4px 8px",
                                        background: "#374151",
                                        border: "1px solid #4B5563",
                                        borderRadius: "4px",
                                        color: "#fff",
                                        fontSize: "12px"
                                    }}
                                />
                    </div>
                        )}
                        
                        {/* Переключатель режимов атака/защита - отключен после инициализации */}
                        {!gameInitialized && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button 
                                    onClick={() => setGameMode('attack')}
                                    style={{
                                        padding: "6px 12px",
                                        background: gameMode === 'attack' ? "#dc2626" : "#374151",
                                        border: "none",
                                        borderRadius: "4px",
                                        color: "#fff",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        fontWeight: gameMode === 'attack' ? "bold" : "normal"
                                    }}
                                >
                                    ⚔️ Атака
                                </button>
                                <button
                                    onClick={() => setGameMode('defense')}
                                    style={{
                                        padding: "6px 12px",
                                        background: gameMode === 'defense' ? "#1d4ed8" : "#374151",
                                        border: "none",
                                        borderRadius: "4px",
                                        color: "#fff",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        fontWeight: gameMode === 'defense' ? "bold" : "normal"
                                    }}
                                >
                                    🛡️ Защита
                                </button>
                            </div>
                        )}
                        
                        {/* Кнопки действий - разные для разных ролей */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {/* Кнопка "Добрать карты" - для всех игроков */}
                            {gameInitialized && (
                                <button 
                                    onClick={handleDrawCards}
                                    disabled={gameState.deck.length === 0 || (gameState.hands[myId]?.length || 0) >= 6}
                            style={{
                                padding: "8px 12px",
                                        background: (gameState.deck.length === 0 || (gameState.hands[myId]?.length || 0) >= 6) ? "#6b7280" : "#10b981",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                        cursor: (gameState.deck.length === 0 || (gameState.hands[myId]?.length || 0) >= 6) ? "not-allowed" : "pointer",
                                        fontSize: "12px",
                                        opacity: (gameState.deck.length === 0 || (gameState.hands[myId]?.length || 0) >= 6) ? 0.5 : 1
                            }}
                        >
                                    📚 Добрать карты
                        </button>
                            )}
                            
                            {/* Кнопка "Взять карты" - только для защитника */}
                            {gameInitialized && getCurrentPlayerRole() === 'defender' && (
                        <button 
                                    onClick={handleTakeCards}
                                    disabled={!canTakeCards}
                            style={{
                                padding: "8px 12px",
                                        background: canTakeCards ? "#f59e0b" : "#6b7280",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                        cursor: canTakeCards ? "pointer" : "not-allowed",
                                        fontSize: "12px",
                                        opacity: canTakeCards ? 1 : 0.5
                            }}
                        >
                                    🃏 Взять карты
                        </button>
                            )}
                            
                            {/* Кнопки Бито и Пас - только для атакующих игроков после начала игры */}
                            {gameInitialized && (getCurrentPlayerRole() === 'attacker' || getCurrentPlayerRole() === 'co-attacker') && (
                                <>
                                    {/* Кнопка Бито - только у игрока с приоритетом атаки */}
                                    {shouldShowBitoButton() && canPlayerAttack() && (
                                        <button 
                                            onClick={handleBito}
                                            disabled={!mainAttackerHasPlayed || 
                                                hasUnbeatenCards() ||
                                                (getCurrentPlayerRole() === 'attacker' && attackerBitoPressed) ||
                                                (getCurrentPlayerRole() === 'co-attacker' && coAttackerBitoPressed)}
                                            style={{
                                                padding: "8px 12px",
                                                background: (!mainAttackerHasPlayed || 
                                                    hasUnbeatenCards() ||
                                                    (getCurrentPlayerRole() === 'attacker' && attackerBitoPressed) ||
                                                    (getCurrentPlayerRole() === 'co-attacker' && coAttackerBitoPressed)) ? "#6b7280" : "#8b5cf6",
                                                border: "none",
                                                borderRadius: "6px",
                                                color: "#fff",
                                                cursor: (!mainAttackerHasPlayed || 
                                                    hasUnbeatenCards() ||
                                                    (getCurrentPlayerRole() === 'attacker' && attackerBitoPressed) ||
                                                    (getCurrentPlayerRole() === 'co-attacker' && coAttackerBitoPressed)) ? "not-allowed" : "pointer",
                                                fontSize: "12px",
                                                opacity: (!mainAttackerHasPlayed || 
                                                    hasUnbeatenCards() ||
                                                    (getCurrentPlayerRole() === 'attacker' && attackerBitoPressed) ||
                                                    (getCurrentPlayerRole() === 'co-attacker' && coAttackerBitoPressed)) ? 0.5 : 1
                                            }}
                                        >
                                            🚫 Бито
                                        </button>
                                    )}
                                    
                                    {/* Кнопка Пас - у всех атакующих игроков */}
                                    <button 
                                        onClick={handlePas}
                                        disabled={!mainAttackerHasPlayed || 
                                            hasUnbeatenCards() ||
                                            (getCurrentPlayerRole() === 'attacker' && attackerPasPressed) ||
                                            (getCurrentPlayerRole() === 'co-attacker' && coAttackerPasPressed)}
                                        style={{
                                            padding: "8px 12px",
                                            background: (!mainAttackerHasPlayed || 
                                                hasUnbeatenCards() ||
                                                (getCurrentPlayerRole() === 'attacker' && attackerPasPressed) ||
                                                (getCurrentPlayerRole() === 'co-attacker' && coAttackerPasPressed)) ? "#6b7280" : "#ef4444",
                                            border: "none",
                                            borderRadius: "6px",
                                            color: "#fff",
                                            cursor: (!mainAttackerHasPlayed || 
                                                hasUnbeatenCards() ||
                                                (getCurrentPlayerRole() === 'attacker' && attackerPasPressed) ||
                                                (getCurrentPlayerRole() === 'co-attacker' && coAttackerPasPressed)) ? "not-allowed" : "pointer",
                                            fontSize: "12px",
                                            opacity: (!mainAttackerHasPlayed || 
                                                hasUnbeatenCards() ||
                                                (getCurrentPlayerRole() === 'attacker' && attackerPasPressed) ||
                                                (getCurrentPlayerRole() === 'co-attacker' && coAttackerPasPressed)) ? 0.5 : 1
                                        }}
                                    >
                                        🛑 Пас
                                    </button>
                                </>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => {
                                // Берем карту из колоды (если она не пустая)
                                if (gameState.deck.length > 0) {
                                    const cardFromDeck = gameState.deck[0]; // Берем первую карту
                                    setGameState((prev) => ({
                                        ...prev,
                                        hands: {
                                            ...prev.hands,
                                            [myId]: [...(prev.hands[myId] || []), cardFromDeck]
                                        },
                                        deck: prev.deck.slice(1) // Убираем карту из колоды
                                    }));
                                } else {
                                    alert("Колода пуста! Нет карт для добавления.");
                                }
                            }}
                            style={{
                                padding: "8px 12px",
                                background: "#10B981",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: "pointer"
                            }}
                        >
                            + Карта из колоды ({gameState.deck.length})
                        </button>
                        <button 
                            onClick={resetGame}
                            style={{
                                padding: "8px 12px",
                                background: "#dc2626",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: "pointer"
                            }}
                        >
                            Сброс
                        </button>
                        <button 
                            onClick={() => setShowSensorCircle(!showSensorCircle)}
                            style={{
                                padding: "8px 12px",
                                background: showSensorCircle ? "#059669" : "#6b7280",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: "pointer"
                            }}
                        >
                            {showSensorCircle ? "Скрыть сенсор" : "Показать сенсор"}
                        </button>
                        {onBack && (
                            <button 
                                onClick={onBack}
                                style={{
                                    padding: "8px 12px",
                                    background: "#374151",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer"
                                }}
                            >
                                ← Назад
                            </button>
                        )}
                    </div>
                </div>

                {/* Players Info */}
                <div style={{ padding: 12, background: "#101826" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {Object.keys(gameState.players).map((pid) => (
                            <div key={pid} style={{ 
                                padding: "6px 10px", 
                                borderRadius: "6px", 
                                background: pid === myId ? "#065f46" : "#1f2937",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <span>
                                {gameState.players[pid]?.name || pid}
                                {pid === myId ? " • вы" : ""}
                                {pid === gameState.hostId ? " 👑" : ""}
                                    {pid === gameState.currentTurn ? " ⏳" : ""}
                                </span>
                                {gameInitialized && playerRoles[pid] && (
                                    <span style={{ fontSize: "14px" }}>
                                        {getRoleEmoji(playerRoles[pid])}
                                    </span>
                                )}
                                <span style={{ opacity: 0.7 }}>
                                    ({gameState.hands[pid]?.length || 0} карт)
                                </span>
                                {/* Кнопка переключения игрока - скрыта для наблюдателей после инициализации */}
                                {(!gameInitialized || playerRoles[pid] !== 'observer') && (
                                    <button
                                        onClick={() => switchToPlayer(pid)}
                                        disabled={gameInitialized && playerRoles[pid] === 'observer'}
                                        style={{
                                            padding: "2px 6px",
                                            background: pid === myId ? "#047857" : "#374151",
                                            border: "none",
                                            borderRadius: "4px",
                                            color: "#fff",
                                            cursor: gameInitialized && playerRoles[pid] === 'observer' ? "not-allowed" : "pointer",
                                            fontSize: "10px",
                                            opacity: gameInitialized && playerRoles[pid] === 'observer' ? 0.5 : 1
                                        }}
                                    >
                                        {pid === myId ? "Активен" : "Выбрать"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Информация о приоритете атаки */}
                    {gameInitialized && (
                        <div style={{ 
                            marginTop: "8px", 
                            padding: "8px 12px", 
                            background: "#1f2937", 
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "#9CA3AF"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>🎯 Приоритет атаки:</span>
                                <span style={{ 
                                    color: attackPriority === 'attacker' ? "#10b981" : "#3b82f6",
                                    fontWeight: "bold"
                                }}>
                                    {attackPriority === 'attacker' ? '⚔️⚔️ Главный атакующий' : '⚔️ Со-атакующий'}
                                </span>
                                {!mainAttackerHasPlayed && (
                                    <span style={{ color: "#f59e0b", fontSize: "10px" }}>
                                        (ждем первую карту от главного атакующего)
                                    </span>
                                )}
                            </div>
                            {(attackerPassed || coAttackerPassed) && (
                                <div style={{ marginTop: "4px", fontSize: "10px" }}>
                                    {attackerPassed && <span style={{ color: "#ef4444" }}>🚫 Главный атакующий отказался</span>}
                                    {attackerPassed && coAttackerPassed && <span> • </span>}
                                    {coAttackerPassed && <span style={{ color: "#ef4444" }}>🚫 Со-атакующий отказался</span>}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Game Board */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                    <div style={{ textAlign: "center", width: "100%" }}>
                        <h3 style={{ color: "#10B981", marginBottom: "20px" }}>
                            🎯 Игровой стол
                        </h3>
                        
                        {/* Контейнер для дива защиты с абсолютно позиционированными фракциями */}
                        <div style={{ position: "relative", marginBottom: "20px", width: "100%", display: "flex", justifyContent: "center" }}>
                            {/* Активные фракции - абсолютно позиционированы слева */}
                            {(() => {
                                // Собираем доступные фракции со всех защитных карт
                                const allAvailableDefenseFactions: number[] = [];
                                defenseCards.forEach(defenseCard => {
                                    if (defenseCard) {
                                        const availableDefenseFactions = defenseCard.factions.filter(factionId => 
                                            canDefenseCardUseFaction(defenseCard, factionId)
                                        );
                                        allAvailableDefenseFactions.push(...availableDefenseFactions);
                                    }
                                });

                                // Объединяем активные фракции с доступными фракциями защиты
                                const allActiveFactionIds = [...new Set([
                                    ...activeFirstAttackFactions,
                                    ...allAvailableDefenseFactions
                                ])];

                                // Создаем счетчик для отображения
                                const displayCounter: Record<number, number> = {};
                                
                                // Добавляем счетчики от карт атаки (фракции первой карты)
                                activeFirstAttackFactions.forEach(factionId => {
                                    displayCounter[factionId] = (displayCounter[factionId] || 0) + (factionCounter[factionId] || 0);
                                });

                                // Добавляем счетчики от карт защиты (доступные фракции)
                                allAvailableDefenseFactions.forEach(factionId => {
                                    displayCounter[factionId] = (displayCounter[factionId] || 0) + 1;
                                });

                                // Фильтруем только фракции с счетчиком > 0
                                const activeFactionIdsWithCount = allActiveFactionIds.filter(factionId => 
                                    displayCounter[factionId] > 0
                                );

                                // Конвертируем в названия только активные фракции
                                const allActiveFactionNames = getFactionNames(activeFactionIdsWithCount);

                                return allActiveFactionNames.length > 0 && (
                                <div style={{ 
                                    position: "absolute",
                                    left: "0",
                                    top: "0",
                                    width: "200px", 
                                    minHeight: "160px",
                                    background: "#1f2937", 
                                    borderRadius: "8px",
                                    border: "2px solid #4B5563",
                                    padding: "8px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    zIndex: 10
                                }}>
                                    <h4 style={{ color: "#F59E0B", marginBottom: "8px", fontSize: "12px" }}>
                                        🎯 Активные фракции
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                                            {allActiveFactionNames.map((faction, index) => {
                                                // Находим ID фракции для получения счётчика
                                                const factionEntry = Object.entries(FACTIONS).find(([_, name]) => name === faction);
                                                const factionId = factionEntry ? parseInt(factionEntry[0]) : -1;
                                                const count = displayCounter[factionId] || 0;
                                            
                                            return (
                                                <div 
                                                        key={index}
                                                    style={{ 
                                                        color: "#E5E7EB", 
                                                        fontSize: "10px",
                                                        padding: "4px 8px",
                                                        background: "rgba(245, 158, 11, 0.1)",
                                                        borderRadius: "4px",
                                                        border: "1px solid rgba(245, 158, 11, 0.3)",
                                                        whiteSpace: "nowrap",
                                                        textAlign: "center",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}
                                                >
                                                        <span>{faction}</span>
                                                    <span style={{ 
                                                        background: "rgba(245, 158, 11, 0.3)", 
                                                        borderRadius: "50%", 
                                                        width: "16px", 
                                                        height: "16px", 
                                                        display: "flex", 
                                                        alignItems: "center", 
                                                        justifyContent: "center",
                                                        fontSize: "8px",
                                                        fontWeight: "bold"
                                                    }}>
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                );
                            })()}
                            
                            {/* Див защиты - по центру, как и див атаки */}
                            <DefenseZone
                                attackCards={gameState.slots || []}
                                defenseCards={defenseCards}
                                onCardClick={(attackIndex) => {
                                    console.log('Clicked defense card for attack index:', attackIndex);
                                }}
                                onCardHover={handleDefenseCardHover}
                                onCardLeave={handleDefenseCardLeave}
                                highlightedCardIndex={hoveredDefenseCard}
                                gameMode={gameMode}
                                invalidDefenseCard={invalidDefenseCard}
                            />
                        </div>
                        
                        {/* Игровой стол */}
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
                        cards={gameState.slots || []}
                                minVisibleCards={1}
                                gameMode={gameMode}
                        onCardClick={(index) => {
                                    console.log('Clicked table card:', index);
                                }}
                                onCardHover={handleAttackCardHover}
                                onCardLeave={handleAttackCardLeave}
                                highlightedCardIndex={hoveredAttackCard}
                                onMousePositionUpdate={setMousePosition}
                                activeCard={activeCard}
                                onDropZoneActivate={(zoneId) => {
                                    console.log(`🎯 КУРСОР: Активирует drop zone ${zoneId}`);
                                    // Очищаем предыдущий таймаут
                                    if (dropZoneTimeout) {
                                        clearTimeout(dropZoneTimeout);
                                        setDropZoneTimeout(null);
                                    }
                                    setActiveDropZone(zoneId);
                                }}
                                onDropZoneDeactivate={() => {
                                    console.log(`🎯 КУРСОР: Деактивирует drop zone (с задержкой)`);
                                    // Устанавливаем задержку перед деактивацией
                                    const timeout = setTimeout(() => {
                                        console.log(`🎯 КУРСОР: Деактивация drop zone выполнена`);
                                        setActiveDropZone(null);
                                        setDropZoneTimeout(null);
                                    }, 100); // 100ms задержка
                                    setDropZoneTimeout(timeout);
                                }}
                                activeDropZone={activeDropZone}
                            />
                            
                            {/* Отладочная информация о синхронизации */}
                            {defenseCards.filter(card => card !== null).length > 0 && (
                                <div style={{ 
                                    fontSize: "12px", 
                                    color: "#93c5fd", 
                                    marginTop: "8px",
                                    textAlign: "center"
                                }}>
                                    🎯 Карты защиты: {defenseCards.filter(card => card !== null).length} из {defenseCards.length} слотов
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* My hand - внизу экрана */}
                <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                    <div style={{
                        maxWidth: "100%",
                        overflow: "hidden"
                    }}>
                    <DropZone
                        id="my-hand"
                        cards={myHand}
                            maxVisibleCards={10}
                            defenseCards={defenseCards}
                            onMousePositionUpdate={setMousePosition}
                            activeCard={activeCard}
                        onCardClick={(index) => {
                            console.log('Clicked hand card:', index);
                                
                            const card = myHand[index];
                                
                                if (gameMode === 'defense') {
                                    // В режиме защиты пытаемся отбить карту
                                    const attackCards = gameState.slots?.map((slot, idx) => ({ slot, index: idx })).filter(({ slot }) => slot !== null) || [];
                                    
                                    if (attackCards.length > 0) {
                                        // Используем hoveredAttackCard если он есть, иначе первую карту
                                        const targetIndex = hoveredAttackCard !== null ? hoveredAttackCard : attackCards[0].index;
                                        console.log('🎯 Выбранный индекс для защиты (клик):', targetIndex, 'hoveredAttackCard:', hoveredAttackCard);
                                        
                                        // Добавляем карту защиты над выбранной картой атаки
                                        const defenseAdded = addDefenseCard(targetIndex, card);
                                        
                                        // Убираем карту из руки только если карта защиты была успешно добавлена
                                        if (defenseAdded) {
                                            setGameState((prev) => {
                                    const myCards = [...(prev.hands[myId] || [])];
                                                // Дополнительная проверка - убеждаемся, что карта по индексу существует
                                                if (index >= 0 && index < myCards.length && myCards[index]?.id === card.id) {
                                    myCards.splice(index, 1);
                                                    console.log(`✅ Карта "${card.name}" убрана из руки (клик). Осталось карт: ${myCards.length}`);
                                                } else {
                                                    console.log(`⚠️ Карта "${card.name}" не найдена в руке по индексу ${index} (клик). Карты в руке:`, myCards.map(c => c.name));
                                                }
                                                return {
                                                    ...prev,
                                                    hands: { ...prev.hands, [myId]: myCards },
                                                };
                                            });
                                        } else {
                                            console.log('⚠️ Карта защиты не была добавлена (клик), карта остается в руке');
                                        }
                                    } else {
                                        alert('🛡️ Нет карт атаки для отбивания!');
                                    }
                                    return;
                                }
                                
                                // В режиме атаки добавляем карту на стол
                                // Сначала валидируем карту
                                const validation = validateAttackCard(card);
                                if (!validation.isValid) {
                                    alert(`❌ ${validation.reason}`);
                                    return;
                                }
                                
                                // Всегда добавляем в первый свободный слот (до 6 максимум)
                                let slots = gameState.slots || [];
                                
                                // Если слотов нет, создаем массив из 6 пустых слотов
                                if (slots.length === 0) {
                                    slots = new Array(6).fill(null);
                                    console.log('🔧 Создаем новые слоты (клик):', slots.length);
                                }
                                
                                const freeSlotIndex = slots.findIndex(slot => slot === null);
                                console.log('🔍 Свободный слот (клик):', freeSlotIndex, 'из', slots.length, 'слотов');
                                
                                if (freeSlotIndex >= 0) {
                                    console.log('🎯 Добавляем карту атаки в свободный слот', freeSlotIndex, '(клик)');
                                    
                                    // Обновляем активные фракции
                                    updateActiveFactions(card);
                                    
                                    setGameState((prev) => {
                                        const myCards = [...(prev.hands[myId] || [])];
                                        myCards.splice(index, 1);
                                        
                                        const slots = [...prev.slots];
                                        slots[freeSlotIndex] = card;
                                    
                                    return {
                                        ...prev,
                                        hands: { ...prev.hands, [myId]: myCards },
                                        slots,
                                    };
                                });
                                } else {
                                    alert('🃏 Стол полон! Максимум 6 карт.');
                            }
                        }}
                    />
                    </div>
                </div>

                {/* Debug Info */}
                <div style={{ 
                    padding: "12px 20px", 
                    background: "#1a1a2e", 
                    borderTop: "2px solid #8B0000",
                    fontSize: "12px",
                    opacity: 0.8
                }}>
                    <div>🔄 Debug V1 (New Turn System) активен | 👥 {playerCount} игроков | 🎲 Seed: {seed} | {gameMode === 'attack' ? '⚔️ Режим атаки' : '🛡️ Режим защиты'} | 🃏 {myHand.length}/6 карт | 📚 Колода: {gameState.deck.length} карт | 🖱️ Drag & Drop активен</div>
                                    <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.6 }}>
                    🎯 Отладка: activeCard={activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Наведение атаки={hoveredAttackCard !== null ? `карта ${hoveredAttackCard}` : 'нет'} | Наведение защиты={hoveredDefenseCard !== null ? `карта ${hoveredDefenseCard}` : 'нет'} | Мышь={mousePosition ? `${mousePosition.x},${mousePosition.y}` : 'нет'} | Защита={defenseCards.filter(card => card !== null).length} карт | Атака={gameState.slots?.filter(s => s !== null).length || 0} карт
                </div>
                <div style={{ marginTop: "2px", fontSize: "9px", opacity: 0.5 }}>
                    🛡️ Слоты защиты: {defenseCards.map((card, idx) => card ? `${idx}:${card.name}` : `${idx}:пусто`).join(' | ')}
                </div>
                <div style={{ marginTop: "2px", fontSize: "9px", opacity: 0.5 }}>
                    🃏 Карты в руке: {myHand.map((card, idx) => `${idx}:${card.name}`).join(' | ')}
                </div>
                <div style={{ marginTop: "2px", fontSize: "9px", opacity: 0.5 }}>
                    🖱️ Сенсор: {gameMode === 'attack' ? 'ищет карты (защита > атака)' : 'ищет карты атаки'} | Радиус: 80px | Курсор: {mousePosition ? `${mousePosition.x}, ${mousePosition.y}` : 'нет'} | Активная карта: {activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Отладка: {showSensorCircle ? 'включена' : 'выключена'}
                </div>
                </div>

                {/* Визуальный индикатор сенсора - в режиме атаки при зажатой карте или при включенной кнопке отладки */}
                {(activeCard || showSensorCircle) && mousePosition && (
                    <div
                        style={{
                            position: 'fixed',
                            left: mousePosition.x - 80,
                            top: mousePosition.y - 80,
                            width: '160px',
                            height: '160px',
                            border: '2px dashed rgba(255, 255, 0, 0.5)',
                            borderRadius: '50%',
                            pointerEvents: 'none',
                            zIndex: 9999,
                            background: 'rgba(255, 255, 0, 0.1)'
                        }}
                    />
                )}

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeCard ? (
                        <div style={{
                            height: 160,
                            width: 120,
                            borderRadius: 12,
                            border: activeCard.source === 'hand' 
                                ? "2px solid #8B0000" 
                                : "2px solid #334155",
                            background: "linear-gradient(135deg, #2a2a4e 0%, #1e1e3e 100%)",
                            color: "#fff",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "8px",
                            transform: "rotate(5deg) scale(1.05)",
                            boxShadow: "0 8px 25px rgba(139, 0, 0, 0.4)",
                            zIndex: 1000,
                        }}>
                            <div style={{ 
                                fontSize: "12px", 
                                fontWeight: "bold", 
                                textAlign: "center", 
                                marginBottom: "4px",
                                color: "#FFD700"
                            }}>
                                {activeCard.card.name}
                            </div>
                            <div style={{ 
                                fontSize: "18px", 
                                color: "#8B0000", 
                                fontWeight: "bold",
                                textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
                            }}>
                                {activeCard.card.power}
                            </div>
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
                                {activeCard.card.power}
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Визуализация невидимого круга сенсора */}
                {showSensorCircle && mousePosition && (
                    <div style={{
                        position: "fixed",
                        left: mousePosition.x - 80,
                        top: mousePosition.y - 80,
                        width: 160,
                        height: 160,
                        borderRadius: "50%",
                        border: "2px dashed #8B5CF6",
                        background: "rgba(139, 92, 246, 0.1)",
                        pointerEvents: "none",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "#8B5CF6",
                        fontWeight: "bold"
                    }}>
                        Сенсор (80px)
                    </div>
                )}

                {/* Модальное окно первого игрока */}
                {showFirstPlayerModal && firstPlayerInfo && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000
                    }}>
                        <div style={{
                            background: "#1f2937",
                            border: "3px solid #10b981",
                            borderRadius: "16px",
                            padding: "32px",
                            textAlign: "center",
                            color: "#fff",
                            maxWidth: "400px",
                            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)"
                        }}>
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                                🎯
                            </div>
                            <h2 style={{ 
                                color: "#10b981", 
                                marginBottom: "16px", 
                                fontSize: "24px",
                                fontWeight: "bold"
                            }}>
                                Первый игрок определен!
                            </h2>
                            <div style={{ fontSize: "18px", marginBottom: "8px" }}>
                                <strong>{firstPlayerInfo.playerName}</strong>
                            </div>
                            <div style={{ fontSize: "16px", marginBottom: "8px", opacity: 0.8 }}>
                                Карта: <strong>{firstPlayerInfo.cardName}</strong>
                            </div>
                            <div style={{ fontSize: "16px", marginBottom: "24px", opacity: 0.8 }}>
                                Сила: <strong>{firstPlayerInfo.power}</strong>
                            </div>
                            <div style={{ fontSize: "14px", marginBottom: "24px", opacity: 0.6 }}>
                                Роли назначены по кругу от первого игрока
                            </div>
                            <button
                                onClick={() => setShowFirstPlayerModal(false)}
                                style={{
                                    padding: "12px 24px",
                                    background: "#10b981",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "bold"
                                }}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DndContext>
    );
};

export default DebugGameBoard;
