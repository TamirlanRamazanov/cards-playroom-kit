import React, { useState, useEffect, useRef } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMultiplayerState } from 'playroomkit';
import type { GameState, Card } from "../types";
import { CARDS_DATA, FACTIONS } from "../engine/cards";
import DropZone from "./DropZone";
import DefenseZone from "./DefenseZone";

// Простой генератор псевдослучайных чисел с seed
class SeededRandom {
    private seed: number;
    
    constructor(seed: number) {
        this.seed = seed;
    }
    
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    shuffle<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Убрал константу - используем объект напрямую в useMultiplayerState как в старом коммите

interface GameBoardV2Props {
    myId: string;
    onBack?: () => void;
}

// Начальное состояние игры - вынесено за пределы компонента для стабильности
const INITIAL_GAME_STATE: GameState = {
    phase: "lobby",
    hostId: undefined,
    players: {},
    hands: {},
    slots: [null, null, null, null, null, null],
    defenseSlots: [null, null, null, null, null, null],
    playerCountAtStart: undefined,
    winnerId: undefined,
    startedAt: undefined,
    deck: [],
    discardPile: [],
    maxHandSize: 6,
    cardsDrawnThisTurn: {},
    canDrawCards: true,
    availableTargets: [],
    factionBonuses: {},
    targetSelectionMode: false,
    selectedTarget: undefined,
    factionEffects: {},
    activeFactions: [],
    factionCounter: {},
    activeFirstAttackFactions: [],
    usedDefenseCardFactions: {},
    displayActiveFactions: [],
    defenseFactionsBuffer: {},
    minCardPower: 50,
    maxCardPower: 100,
    canDefendWithEqualPower: true,
    turnActions: {
        canEndTurn: false,
        canPass: false,
        canTakeCards: false,
        canAttack: false,
        canDefend: false,
    },
    turnHistory: [],
    playerRoles: {},
    attackPriority: 'attacker',
    mainAttackerHasPlayed: false,
    attackerPassed: false,
    coAttackerPassed: false,
    attackerBitoPressed: false,
    coAttackerBitoPressed: false,
    attackerPasPressed: false,
    coAttackerPasPressed: false,
    drawQueue: [],
    gameInitialized: false,
};

const GameBoardV2: React.FC<GameBoardV2Props> = ({ myId, onBack }) => {
    // ВСЕГДА вызываем ВСЕ хуки на верхнем уровне БЕЗ УСЛОВИЙ - это критично для React
    // PlayroomKit для синхронизации - используем константу для стабильности
    const [playroomGame, setPlayroomGame] = useMultiplayerState<GameState>("gameV2", INITIAL_GAME_STATE);
    
    // Локальные UI состояния (как в DebugGameBoardV2) - ВСЕГДА вызываем
    const [activeCard, setActiveCard] = useState<{ card: Card; index: number; source: string } | null>(null);
    const [gameMode, setGameMode] = useState<'attack' | 'defense'>('attack');
    const [defenseCards, setDefenseCards] = useState<(Card | null)[]>([]); // Карты защиты, синхронизированные с картами атаки
    const [hoveredAttackCard, setHoveredAttackCard] = useState<number | null>(null); // Индекс наведенной карты атаки
    const [hoveredDefenseCard, setHoveredDefenseCard] = useState<number | null>(null); // Индекс наведенной карты защиты
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null); // Позиция мыши
    const [showSensorCircle, setShowSensorCircle] = useState<boolean>(false); // Показать невидимый круг для отладки
    const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
    const [dropZoneTimeout, setDropZoneTimeout] = useState<number | null>(null); // Таймаут для задержки деактивации drop zone
    const [invalidDefenseCard, setInvalidDefenseCard] = useState<number | null>(null); // Индекс невалидной карты защиты
    const [canTakeCards, setCanTakeCards] = useState<boolean>(false); // Можно ли взять карты
    
    // Используем PlayroomKit game как источник истины с fallback (используем константу)
    const gameState = playroomGame || INITIAL_GAME_STATE;
    
    // Используем фракции из глобального состояния для синхронизации между игроками
    const factionCounter = gameState.factionCounter || {};
    const activeFirstAttackFactions = gameState.activeFirstAttackFactions || [];
    const usedDefenseCardFactions = gameState.usedDefenseCardFactions || {};
    const defenseFactionsBuffer = gameState.defenseFactionsBuffer || {};
    
    // Регистрируем игрока при подключении (как в App.tsx) - ВСЕГДА ДО условного return
    useEffect(() => {
        if (!myId) return;
        if (!gameState) return;
        
        // Проверяем, зарегистрирован ли игрок
        const players = gameState.players || {};
        if (players[myId]) {
            // Игрок уже зарегистрирован
            return;
        }
        
        // Регистрируем игрока в gameState
        const newPlayers = { ...players };
        newPlayers[myId] = { name: `Player ${myId.slice(-4)}` };
        console.log(`✅ Игрок ${myId} зарегистрирован в GameBoardV2`);
        
        const next: GameState = { 
            ...gameState, 
            players: newPlayers,
            // Назначаем хоста, если его еще нет
            hostId: gameState.hostId || myId,
        };
        
        if (!gameState.hostId) {
            console.log(`👑 Игрок ${myId} назначен хостом`);
        }
        
        setPlayroomGame(next);
    }, [myId, gameState, setPlayroomGame]);

    // Ref для отслеживания того, что мы сами обновляем defenseCards
    const isUpdatingDefenseCardsRef = useRef(false);
    
    // Синхронизация defenseCards с gameState.defenseSlots
    // Но только если мы не обновляем их сами (чтобы избежать race condition)
    useEffect(() => {
        if (isUpdatingDefenseCardsRef.current) {
            // Мы сами обновляем, пропускаем синхронизацию
            isUpdatingDefenseCardsRef.current = false;
            return;
        }
        
        const globalDefense = gameState.defenseSlots || [];
        // Синхронизируем только если есть реальные изменения
        setDefenseCards(prev => {
            if (JSON.stringify(prev) === JSON.stringify(globalDefense)) {
                return prev; // Нет изменений, не обновляем
            }
            return globalDefense;
        });
    }, [gameState.defenseSlots]);

    // Глобальный сенсор для всех режимов
    useEffect(() => {
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
                let closestDefenseCard: Element | null = null;
                let closestDefenseDistance = Infinity;

                defenseCardElements.forEach((element) => {
                    const rect = element.getBoundingClientRect();
                    const cardCenterX = rect.left + rect.width / 2;
                    const cardCenterY = rect.top + rect.height / 2;
                    
                    const distance = Math.sqrt(
                        Math.pow(clientX - cardCenterX, 2) + 
                        Math.pow(clientY - cardCenterY, 2)
                    );

                    const defenseIndex = parseInt((element as Element).getAttribute('data-defense-card-index') || '0');
                    
                    // В режиме атаки пропускаем пустые слоты
                    if (gameMode === 'attack' && defenseCards[defenseIndex] === null) {
                        return;
                    }

                    if (distance < closestDefenseDistance) {
                        closestDefenseDistance = distance;
                        closestDefenseCard = element;
                    }
                });

                // Активируем ховер в зависимости от режима
                if (gameMode === 'defense') {
                    // В режиме защиты: приоритет картам атаки
                    if (closestAttackCard && closestAttackDistance <= sensorRadius) {
                        const attackIndex = parseInt((closestAttackCard as Element).getAttribute('data-card-index') || '0');
                        
                        // Проверяем валидность карты защиты для этой карты атаки
                        if (activeCard && activeCard.source === 'hand') {
                            const isValid = checkDefenseCardValidity(activeCard.card, attackIndex);
                            if (!isValid) {
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
                    if (activeDropZone) {
                        // Если активен drop zone через курсор, блокируем сенсор
                        setHoveredAttackCard(null);
                        setHoveredDefenseCard(null);
                    } else if (closestDefenseCard && closestDefenseDistance <= sensorRadius) {
                        const defenseIndex = parseInt((closestDefenseCard as Element).getAttribute('data-defense-card-index') || '0');
                        setHoveredDefenseCard(defenseIndex);
                        setHoveredAttackCard(null);
                        setActiveDropZone('defense-card');
                    } else {
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
    }, [gameMode, activeCard, defenseCards, gameState.slots]);

    // Очистка таймаута при размонтировании
    useEffect(() => {
        return () => {
            if (dropZoneTimeout) {
                clearTimeout(dropZoneTimeout);
            }
        };
    }, [dropZoneTimeout]);

    // Функция валидации карты защиты
    const validateDefenseCard = (defenseCard: Card, attackCard: Card): boolean => {
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
        if (gameMode !== 'defense') return false;
        const attackCards = gameState.slots || [];
        const hasUnbeatenCards = attackCards.some((attackCard, index) => {
            if (!attackCard) return false;
            const defenseCard = defenseCards[index];
            return defenseCard === null;
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
        return attackCards[0].factions;
    };

    // Функция для валидации карты атаки
    const validateAttackCard = (card: Card): { isValid: boolean; reason?: string } => {
        if (isFirstAttackCard()) {
            return { isValid: true };
        }
        if (activeFirstAttackFactions.length === 0) {
            return { isValid: false, reason: "Нет активных фракций первой карты атаки" };
        }
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

    // Функция для обновления счётчика фракций (обновляет gameState)
    const updateFactionCounter = (factionIds: number[], increment: number = 1) => {
        const newCounter = { ...factionCounter };
        factionIds.forEach(factionId => {
            newCounter[factionId] = (newCounter[factionId] || 0) + increment;
            if (newCounter[factionId] <= 0) {
                delete newCounter[factionId];
            }
        });
        setPlayroomGame({
            ...gameState,
            factionCounter: newCounter,
        });
    };




    // Функция для обновления активных фракций после добавления карты защиты
    const updateActiveFactionsFromDefenseCard = (card: Card) => {
        const attackCardsCount = gameState.slots?.filter(slot => slot !== null).length || 0;
        if (attackCardsCount >= 6) {
            return;
        }
        updateFactionCounter(card.factions, 1);
    };

    // Функция для прикрепления атакующей карты через защитную (обновляет gameState)
    const attachAttackCardThroughDefense = (attackCard: Card, defenseCard: Card): boolean => {
        const attackCardsCount = gameState.slots?.filter(slot => slot !== null).length || 0;
        if (attackCardsCount >= 6) {
            return false;
        }

        const availableDefenseFactions = defenseCard.factions.filter(factionId => 
            canDefenseCardUseFaction(defenseCard, factionId)
        );
        
        const intersection = getFactionIntersection(attackCard.factions, availableDefenseFactions);
        
        if (intersection.length === 0) {
            const attackFactionNames = getFactionNames(attackCard.factions);
            const availableDefenseFactionNames = getFactionNames(availableDefenseFactions);
            alert(`❌ Нет общих фракций! Атакующая карта: ${attackFactionNames.join(', ')}, Защитная карта: ${availableDefenseFactionNames.join(', ')}`);
            return false;
        }

        // Сохраняем фракции защиты в буфер (локально, без обновления gameState)
        const firstAttackFactions = getFirstAttackCardFactions();
        const firstAttackSet = new Set(firstAttackFactions);
        const defenseBuffer: Record<number, number> = {};
        Object.keys(factionCounter).forEach(factionIdStr => {
            const factionId = parseInt(factionIdStr);
            if (!firstAttackSet.has(factionId) && factionCounter[factionId] > 0) {
                defenseBuffer[factionId] = factionCounter[factionId];
            }
        });
        
        const keepFactions = [...firstAttackFactions, ...intersection];
        
        // Обновляем счётчик: оставляем только фракции первой карты атаки + пересечение
        let newCounter: Record<number, number> = {};
        keepFactions.forEach(factionId => {
            if (factionCounter[factionId] && factionCounter[factionId] > 0) {
                newCounter[factionId] = factionCounter[factionId];
            }
        });
        
        // Отнимаем все фракции текущей карты защиты
        defenseCard.factions.forEach(factionId => {
            if (newCounter[factionId] && newCounter[factionId] > 0) {
                newCounter[factionId] = newCounter[factionId] - 1;
                if (newCounter[factionId] <= 0) {
                    delete newCounter[factionId];
                }
            }
        });
        
        // Отмечаем использованные фракции для текущей карты защиты
        const defenseCardNonIntersectingFactions = defenseCard.factions.filter(factionId => !intersection.includes(factionId));
        const newUsedDefenseCardFactions = {
            ...usedDefenseCardFactions,
            [defenseCard.id]: [...(usedDefenseCardFactions[defenseCard.id] || []), ...defenseCardNonIntersectingFactions]
        };
        
        // Фильтруем буфер защиты
        const filteredDefenseBuffer: Record<number, number> = {};
        Object.keys(defenseBuffer).forEach(factionIdStr => {
            const factionId = parseInt(factionIdStr);
            const bufferCount = defenseBuffer[factionId];
            if (!firstAttackFactions.includes(factionId)) {
                if (intersection.includes(factionId) || !defenseCard.factions.includes(factionId)) {
                    filteredDefenseBuffer[factionId] = bufferCount;
                } else {
                    const hasOtherDefenseCards = defenseCards.some(card => 
                        card && card.id !== defenseCard.id && card.factions.includes(factionId)
                    );
                    if (hasOtherDefenseCards) {
                        filteredDefenseBuffer[factionId] = bufferCount;
                    }
                }
            }
        });
        
        // Восстанавливаем фракции защиты из буфера
        Object.keys(filteredDefenseBuffer).forEach(factionIdStr => {
            const factionId = parseInt(factionIdStr);
            newCounter[factionId] = filteredDefenseBuffer[factionId];
        });
        
        // Атомарно обновляем все фракции в gameState
        setPlayroomGame({
            ...gameState,
            factionCounter: newCounter,
            usedDefenseCardFactions: newUsedDefenseCardFactions,
            defenseFactionsBuffer: filteredDefenseBuffer,
        });
        
        return true;
    };


    // Функция добавления карты защиты над конкретной картой атаки
    const addDefenseCard = (attackCardIndex: number, defenseCard: Card, currentGameState: GameState): { success: boolean; newDefenseSlots: (Card | null)[] } => {
        const attackCard = currentGameState.slots?.[attackCardIndex];
        if (!attackCard) {
            return { success: false, newDefenseSlots: currentGameState.defenseSlots || [] };
        }
        
        if (!validateDefenseCard(defenseCard, attackCard)) {
            alert(`❌ Недостаточная сила! Карта "${defenseCard.name}" (${defenseCard.power}) не может защитить от "${attackCard.name}" (${attackCard.power}). Требуется сила >= ${attackCard.power}`);
            return { success: false, newDefenseSlots: currentGameState.defenseSlots || [] };
        }
        
        const currentDefenseCards = [...(currentGameState.defenseSlots || [])];
        while (currentDefenseCards.length <= attackCardIndex) {
            currentDefenseCards.push(null);
        }
        
        if (currentDefenseCards[attackCardIndex] !== null) {
            return { success: false, newDefenseSlots: currentDefenseCards };
        }
        
        currentDefenseCards[attackCardIndex] = defenseCard;
        
        updateActiveFactionsFromDefenseCard(defenseCard);
        
        return { success: true, newDefenseSlots: currentDefenseCards };
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

    // useEffect для синхронизации размера div защиты с div атаки
    useEffect(() => {
        syncDefenseZoneSize();
    }, [gameState.slots]);

    // useEffect для обновления состояния кнопки "Взять карты"
    useEffect(() => {
        const canTake = checkCanTakeCards();
        setCanTakeCards(canTake);
    }, [gameMode, gameState.slots, defenseCards]);

    // Функции ховера (пустые - ховер обрабатывается глобальным сенсором)
    const handleAttackCardHover = (_index: number) => {};
    const handleAttackCardLeave = () => {};
    const handleDefenseCardHover = (_index: number) => {};
    const handleDefenseCardLeave = () => {};

    // Функция для полного сброса состояний
    const resetTableStates = () => {
        setHoveredAttackCard(null);
        setHoveredDefenseCard(null);
        setActiveCard(null);
        setMousePosition(null);
        setActiveDropZone(null);
        setInvalidDefenseCard(null);
        setCanTakeCards(false);
        // Сбрасываем фракции в глобальном состоянии
        setPlayroomGame({
            ...gameState,
            factionCounter: {},
            defenseFactionsBuffer: {},
            activeFirstAttackFactions: [],
            usedDefenseCardFactions: {},
        });
        setDefenseCards([]);
    };

    // Функция для взятия карт
    const handleTakeCards = () => {
        if (!canTakeCards) {
            return;
        }
        
        const attackCards = gameState.slots?.filter(card => card !== null) || [];
        const defenseCardsFromTable = defenseCards.filter(card => card !== null);
        const allTableCards = [...attackCards, ...defenseCardsFromTable];
        
        if (allTableCards.length === 0) {
            alert('⚠️ На столе нет карт для взятия');
            return;
        }
        
        const myCards = [...(gameState.hands[currentPlayerId] || [])];
        const newHand = [...myCards, ...allTableCards];
        
        setPlayroomGame({
            ...gameState,
            hands: {
                ...gameState.hands,
                [currentPlayerId]: newHand
            },
            slots: new Array(6).fill(null),
            defenseSlots: new Array(6).fill(null),
        });
        
        setDefenseCards([]);
        resetTableStates();
        alert(`✅ Взято ${allTableCards.length} карт со стола!`);
    };

    // Функция для "Бито"
    const handleBito = () => {
        console.log('🎯 Бито - функционал будет реализован позже');
        alert('🎯 Бито - функционал будет реализован позже');
    };
    
    // Если myId пустой, показываем loading ПОСЛЕ всех хуков
    if (!myId) {
        return (
            <div style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0b1020",
                color: "#fff",
            }}>
                <div>Подключение к комнате...</div>
            </div>
        );
    }
    
    const currentPlayerId = myId;

    // Функция создания игры (как в DebugGameBoardV2)
    const createGame = () => {
        if (!gameState) return;
        
        const playerIds = Object.keys(gameState.players || {});
        if (playerIds.length === 0) {
            alert('❌ Нет игроков для создания игры!');
            return;
        }

        const random = new SeededRandom(Date.now());
        const shuffledDeck = random.shuffle([...CARDS_DATA]);
        
        const hands: GameState["hands"] = {};
        const turnOrder: string[] = [];
        
        // Раздаем карты всем игрокам
        for (let i = 0; i < playerIds.length; i++) {
            const playerId = playerIds[i];
            const playerCards = shuffledDeck.splice(0, 6);
            hands[playerId] = playerCards;
            turnOrder.push(playerId);
        }

        // Определяем первого игрока (самая слабая карта)
        let weakestPlayer = { playerId: playerIds[0], power: 999 };
        playerIds.forEach(playerId => {
            const playerHand = hands[playerId] || [];
            if (playerHand.length > 0) {
                const weakestCard = playerHand.reduce((weakest, card) => 
                    card.power < weakest.power ? card : weakest, playerHand[0]);
                if (weakestCard.power < weakestPlayer.power) {
                    weakestPlayer = { playerId, power: weakestCard.power };
                }
            }
        });

        const newGameState: GameState = {
            ...gameState,
            phase: "playing",
            hands,
            slots: [null, null, null, null, null, null],
            defenseSlots: [null, null, null, null, null, null],
            deck: shuffledDeck,
            discardPile: [],
            playerCountAtStart: playerIds.length,
            startedAt: Date.now(),
            currentTurn: weakestPlayer.playerId,
            turnOrder,
            currentTurnIndex: turnOrder.indexOf(weakestPlayer.playerId),
            turnPhase: "play",
            gameInitialized: true,
            playerRoles: Object.fromEntries(playerIds.map(id => [id, 'observer' as const])),
        };
        
        setPlayroomGame(newGameState);
    };

    // Функция рестарта игры
    const restartGame = () => {
        if (!gameState) return;
        setPlayroomGame({
            phase: "lobby",
            hostId: undefined,
            players: {},
            hands: {},
            slots: [null, null, null, null, null, null],
            defenseSlots: [null, null, null, null, null, null],
            playerCountAtStart: undefined,
            winnerId: undefined,
            startedAt: undefined,
            deck: [],
            discardPile: [],
            maxHandSize: 6,
            cardsDrawnThisTurn: {},
            canDrawCards: true,
            availableTargets: [],
            factionBonuses: {},
            targetSelectionMode: false,
            selectedTarget: undefined,
            factionEffects: {},
            activeFactions: [],
            factionCounter: {},
            activeFirstAttackFactions: [],
            usedDefenseCardFactions: {},
            displayActiveFactions: [],
            defenseFactionsBuffer: {},
            minCardPower: 50,
            maxCardPower: 100,
            canDefendWithEqualPower: true,
            turnActions: {
                canEndTurn: false,
                canPass: false,
                canTakeCards: false,
                canAttack: false,
                canDefend: false,
            },
            turnHistory: [],
            playerRoles: {},
            attackPriority: 'attacker',
            mainAttackerHasPlayed: false,
            attackerPassed: false,
            coAttackerPassed: false,
            attackerBitoPressed: false,
            coAttackerBitoPressed: false,
            attackerPasPressed: false,
            coAttackerPasPressed: false,
            drawQueue: [],
            gameInitialized: false,
        });
    };

    // Обработчики drag & drop
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const cardData = active.data.current as { card: Card; index: number; source: string };
        if (cardData) {
            setActiveCard(cardData);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        // Сбрасываем все ховеры при завершении перетаскивания
        setHoveredAttackCard(null);
        setHoveredDefenseCard(null);
        setActiveDropZone(null);
        setInvalidDefenseCard(null);
        
        if (!over) {
            setActiveCard(null);
            setMousePosition(null);
            return;
        }

        const cardData = active.data.current as { card: Card; index: number; source: string };
        if (!cardData) {
            setActiveCard(null);
            setMousePosition(null);
            return;
        }

        const { card, index, source } = cardData;
        const targetZone = over.id;
        const targetZoneString = String(targetZone);
        
        // Специальная обработка для карт защиты в режиме атаки
        if (source === 'hand' && gameMode === 'attack' && (hoveredDefenseCard !== null || targetZoneString.startsWith('defense-card-'))) {
            let defenseCard: Card | null = null;
            if (hoveredDefenseCard !== null && defenseCards[hoveredDefenseCard]) {
                defenseCard = defenseCards[hoveredDefenseCard];
            } else if (targetZoneString.startsWith('defense-card-')) {
                const defenseIndex = parseInt(targetZoneString.replace('defense-card-', ''));
                defenseCard = defenseCards[defenseIndex];
            }
            
            if (!defenseCard) {
                setActiveCard(null);
                setMousePosition(null);
                return;
            }
            
            const success = attachAttackCardThroughDefense(card, defenseCard);
            if (!success) {
                setActiveCard(null);
                setMousePosition(null);
                return;
            }
            
            let slots = gameState.slots || [];
            if (slots.length === 0) {
                slots = new Array(6).fill(null);
            }
            
            const freeSlotIndex = slots.findIndex(slot => slot === null);
            
            if (freeSlotIndex >= 0) {
                const myCards = [...(gameState.hands[currentPlayerId] || [])];
                myCards.splice(index, 1);
                
                const newSlots = [...gameState.slots];
                newSlots[freeSlotIndex] = card;
                
                setPlayroomGame({
                    ...gameState,
                    hands: { ...gameState.hands, [currentPlayerId]: myCards },
                    slots: newSlots,
                });
            } else {
                alert('🃏 Стол полон! Максимум 6 карт.');
            }
            
            setActiveCard(null);
            setMousePosition(null);
            setHoveredDefenseCard(null);
            return;
        }

        // Перемещение карты из руки на стол
        if (source === 'hand' && targetZone === 'table') {
            if (gameMode === 'defense') {
                const attackCards = gameState.slots?.map((slot, idx) => ({ slot, index: idx })).filter(({ slot }) => slot !== null) || [];
                
                if (attackCards.length > 0) {
                    const targetIndex = hoveredAttackCard !== null ? hoveredAttackCard : attackCards[0].index;
                    const result = addDefenseCard(targetIndex, card, gameState);
                    
                    if (result.success) {
                        const myCards = [...(gameState.hands[currentPlayerId] || [])];
                        if (index >= 0 && index < myCards.length && myCards[index]?.id === card.id) {
                            myCards.splice(index, 1);
                        }
                        
                        // Помечаем, что мы сами обновляем defenseCards
                        isUpdatingDefenseCardsRef.current = true;
                        
                        // Атомарно обновляем и defenseSlots, и hands
                        setPlayroomGame({
                            ...gameState,
                            hands: { ...gameState.hands, [currentPlayerId]: myCards },
                            defenseSlots: result.newDefenseSlots,
                        });
                        
                        // Обновляем локальное состояние сразу
                        setDefenseCards(result.newDefenseSlots);
                    }
                } else {
                    alert('🛡️ Нет карт атаки для отбивания!');
                }
                setActiveCard(null);
                setMousePosition(null);
                return;
            }
            
            // В режиме атаки добавляем карту на стол
            const validation = validateAttackCard(card);
            if (!validation.isValid) {
                alert(`❌ ${validation.reason}`);
                setActiveCard(null);
                setMousePosition(null);
                return;
            }
            
            let slots = gameState.slots || [];
            if (slots.length === 0) {
                slots = new Array(6).fill(null);
            }
            
            const freeSlotIndex = slots.findIndex(slot => slot === null);
            
            if (freeSlotIndex >= 0) {
                const myCards = [...(gameState.hands[currentPlayerId] || [])];
                myCards.splice(index, 1);
                
                const newSlots = [...gameState.slots];
                newSlots[freeSlotIndex] = card;
                
                // Обновляем фракции и карты атомарно
                const attackCardsCount = newSlots.filter(slot => slot !== null).length;
                let updatedFactionCounter = { ...factionCounter };
                let updatedActiveFirstAttackFactions = [...activeFirstAttackFactions];
                let updatedDefenseFactionsBuffer = { ...defenseFactionsBuffer };
                
                if (attackCardsCount <= 6) {
                    if (isFirstAttackCard()) {
                        // Первая карта - устанавливаем все её фракции и обновляем счётчик
                        card.factions.forEach(factionId => {
                            updatedFactionCounter[factionId] = (updatedFactionCounter[factionId] || 0) + 1;
                        });
                        updatedActiveFirstAttackFactions = card.factions;
                    } else {
                        // Для последующих карт - сохраняем фракции защиты в буфер
                        const firstAttackFactions = getFirstAttackCardFactions();
                        const firstAttackSet = new Set(firstAttackFactions);
                        const newBuffer: Record<number, number> = {};
                        Object.keys(updatedFactionCounter).forEach(factionIdStr => {
                            const factionId = parseInt(factionIdStr);
                            if (!firstAttackSet.has(factionId) && updatedFactionCounter[factionId] > 0) {
                                newBuffer[factionId] = updatedFactionCounter[factionId];
                            }
                        });
                        updatedDefenseFactionsBuffer = newBuffer;
                        
                        // Пересечение с фракциями первой карты атаки
                        const intersection = getFactionIntersection(card.factions, firstAttackFactions);
                        updatedActiveFirstAttackFactions = intersection;
                        
                        // Обновляем счётчик только для ПЕРЕСЕКАЮЩИХСЯ фракций
                        const newCounter: Record<number, number> = {};
                        intersection.forEach(factionId => {
                            if (updatedFactionCounter[factionId] && updatedFactionCounter[factionId] > 0) {
                                newCounter[factionId] = updatedFactionCounter[factionId];
                            }
                        });
                        updatedFactionCounter = newCounter;
                        
                        // Восстанавливаем фракции защиты из буфера
                        Object.keys(updatedDefenseFactionsBuffer).forEach(factionIdStr => {
                            const factionId = parseInt(factionIdStr);
                            updatedFactionCounter[factionId] = updatedDefenseFactionsBuffer[factionId];
                        });
                    }
                }
                
                setPlayroomGame({
                    ...gameState,
                    hands: { ...gameState.hands, [currentPlayerId]: myCards },
                    slots: newSlots,
                    factionCounter: updatedFactionCounter,
                    activeFirstAttackFactions: updatedActiveFirstAttackFactions,
                    defenseFactionsBuffer: updatedDefenseFactionsBuffer,
                });
            } else {
                alert('🃏 Стол полон! Максимум 6 карт.');
            }
        }
        
        setActiveCard(null);
        setMousePosition(null);
    };

    // Всегда используем gameState (даже если он undefined, используем fallback)
    const myHand = gameState.hands[currentPlayerId] || [];
    const playerIds = Object.keys(gameState.players || {});

    // Собираем доступные фракции для отображения
    const allAvailableDefenseFactions: number[] = [];
    defenseCards.forEach(defenseCard => {
        if (defenseCard) {
            const availableDefenseFactions = defenseCard.factions.filter(factionId => 
                canDefenseCardUseFaction(defenseCard, factionId)
            );
            allAvailableDefenseFactions.push(...availableDefenseFactions);
        }
    });

    const allActiveFactionIds = [...new Set([
        ...activeFirstAttackFactions,
        ...allAvailableDefenseFactions
    ])];

    const displayCounter: Record<number, number> = {};
    activeFirstAttackFactions.forEach(factionId => {
        displayCounter[factionId] = (displayCounter[factionId] || 0) + (factionCounter[factionId] || 0);
    });
    allAvailableDefenseFactions.forEach(factionId => {
        displayCounter[factionId] = (displayCounter[factionId] || 0) + 1;
    });

    const activeFactionIdsWithCount = allActiveFactionIds.filter(factionId => 
        displayCounter[factionId] > 0
    );

    const allActiveFactionNames = getFactionNames(activeFactionIdsWithCount);

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
                {/* Header */}
                <div style={{ 
                    padding: "12px 20px", 
                    background: "#1a1a2e", 
                    borderBottom: "2px solid #8B0000",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: "#FFD700" }}>🎮 Game Board V2</h2>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            Карт в руке: {myHand.length} | Слотов на столе: {gameState.slots?.filter(s => s !== null).length || 0} | Колода: {gameState.deck.length}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {/* Переключатель режимов атака/защита */}
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
                        
                        {/* Кнопки действий */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                            
                            <button 
                                onClick={handleBito}
                                style={{
                                    padding: "8px 12px",
                                    background: "#8b5cf6",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px"
                                }}
                            >
                                🚫 Бито
                            </button>
                        </div>
                        
                        {gameState.phase === "lobby" || !gameState.gameInitialized ? (
                            <button
                                onClick={createGame}
                                style={{
                                    padding: "8px 16px",
                                    background: "#10b981",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                }}
                            >
                                🚀 Старт
                            </button>
                        ) : (
                            <button
                                onClick={restartGame}
                                style={{
                                    padding: "8px 16px",
                                    background: "#ef4444",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                }}
                            >
                                🔄 Рестарт
                            </button>
                        )}
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
                                    padding: "8px 16px",
                                    background: "#6b7280",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: "bold",
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
                        {playerIds.map((pid) => (
                            <div key={pid} style={{ 
                                padding: "6px 10px", 
                                borderRadius: "6px", 
                                background: pid === currentPlayerId ? "#065f46" : "#1f2937",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <span>
                                    {gameState.players[pid]?.name || pid}
                                    {pid === currentPlayerId ? " • вы" : ""}
                                    {pid === gameState.hostId ? " 👑" : ""}
                                    {pid === gameState.currentTurn ? " ⏳" : ""}
                                </span>
                                <span style={{ opacity: 0.7 }}>
                                    ({gameState.hands[pid]?.length || 0} карт)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Board */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", overflow: "auto" }}>
                    <div style={{ textAlign: "center", width: "100%" }}>
                        <h3 style={{ color: "#10B981", marginBottom: "20px" }}>
                            🎯 Игровой стол
                        </h3>
                        
                        {/* Контейнер для дива защиты с абсолютно позиционированными фракциями */}
                        <div style={{ position: "relative", marginBottom: "20px", width: "100%", display: "flex", justifyContent: "center" }}>
                            {/* Активные фракции - абсолютно позиционированы слева */}
                            {allActiveFactionNames.length > 0 && (
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
                            )}
                            
                            {/* Див защиты - по центру */}
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
                                    if (dropZoneTimeout) {
                                        clearTimeout(dropZoneTimeout);
                                        setDropZoneTimeout(null);
                                    }
                                    setActiveDropZone(zoneId);
                                }}
                                onDropZoneDeactivate={() => {
                                    const timeout = setTimeout(() => {
                                        setActiveDropZone(null);
                                        setDropZoneTimeout(null);
                                    }, 100);
                                    setDropZoneTimeout(timeout);
                                }}
                                activeDropZone={activeDropZone}
                            />
                            
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
                                const card = myHand[index];
                                
                                if (gameMode === 'defense') {
                                    const attackCards = gameState.slots?.map((slot, idx) => ({ slot, index: idx })).filter(({ slot }) => slot !== null) || [];
                                    
                                    if (attackCards.length > 0) {
                                        const targetIndex = hoveredAttackCard !== null ? hoveredAttackCard : attackCards[0].index;
                                        const result = addDefenseCard(targetIndex, card, gameState);
                                        
                                        if (result.success) {
                                            const myCards = [...(gameState.hands[currentPlayerId] || [])];
                                            if (index >= 0 && index < myCards.length && myCards[index]?.id === card.id) {
                                                myCards.splice(index, 1);
                                            }
                                            
                                            // Помечаем, что мы сами обновляем defenseCards
                                            isUpdatingDefenseCardsRef.current = true;
                                            
                                            // Атомарно обновляем и defenseSlots, и hands
                                            setPlayroomGame({
                                                ...gameState,
                                                hands: { ...gameState.hands, [currentPlayerId]: myCards },
                                                defenseSlots: result.newDefenseSlots,
                                            });
                                            
                                            // Обновляем локальное состояние сразу
                                            setDefenseCards(result.newDefenseSlots);
                                        }
                                    } else {
                                        alert('🛡️ Нет карт атаки для отбивания!');
                                    }
                                    return;
                                }
                                
                                // В режиме атаки добавляем карту на стол
                                const validation = validateAttackCard(card);
                                if (!validation.isValid) {
                                    alert(`❌ ${validation.reason}`);
                                    return;
                                }
                                
                                let slots = gameState.slots || [];
                                if (slots.length === 0) {
                                    slots = new Array(6).fill(null);
                                }
                                
                                const freeSlotIndex = slots.findIndex(slot => slot === null);
                                
                                if (freeSlotIndex >= 0) {
                                    const myCards = [...(gameState.hands[currentPlayerId] || [])];
                                    myCards.splice(index, 1);
                                    
                                    const newSlots = [...gameState.slots];
                                    newSlots[freeSlotIndex] = card;
                                    
                                    // Обновляем фракции и карты атомарно
                                    const attackCardsCount = newSlots.filter(slot => slot !== null).length;
                                    let updatedFactionCounter = { ...factionCounter };
                                    let updatedActiveFirstAttackFactions = [...activeFirstAttackFactions];
                                    let updatedDefenseFactionsBuffer = { ...defenseFactionsBuffer };
                                    
                                    if (attackCardsCount <= 6) {
                                        if (isFirstAttackCard()) {
                                            // Первая карта - устанавливаем все её фракции и обновляем счётчик
                                            card.factions.forEach(factionId => {
                                                updatedFactionCounter[factionId] = (updatedFactionCounter[factionId] || 0) + 1;
                                            });
                                            updatedActiveFirstAttackFactions = card.factions;
                                        } else {
                                            // Для последующих карт - сохраняем фракции защиты в буфер
                                            const firstAttackFactions = getFirstAttackCardFactions();
                                            const firstAttackSet = new Set(firstAttackFactions);
                                            const newBuffer: Record<number, number> = {};
                                            Object.keys(updatedFactionCounter).forEach(factionIdStr => {
                                                const factionId = parseInt(factionIdStr);
                                                if (!firstAttackSet.has(factionId) && updatedFactionCounter[factionId] > 0) {
                                                    newBuffer[factionId] = updatedFactionCounter[factionId];
                                                }
                                            });
                                            updatedDefenseFactionsBuffer = newBuffer;
                                            
                                            // Пересечение с фракциями первой карты атаки
                                            const intersection = getFactionIntersection(card.factions, firstAttackFactions);
                                            updatedActiveFirstAttackFactions = intersection;
                                            
                                            // Обновляем счётчик только для ПЕРЕСЕКАЮЩИХСЯ фракций
                                            const newCounter: Record<number, number> = {};
                                            intersection.forEach(factionId => {
                                                if (updatedFactionCounter[factionId] && updatedFactionCounter[factionId] > 0) {
                                                    newCounter[factionId] = updatedFactionCounter[factionId];
                                                }
                                            });
                                            updatedFactionCounter = newCounter;
                                            
                                            // Восстанавливаем фракции защиты из буфера
                                            Object.keys(updatedDefenseFactionsBuffer).forEach(factionIdStr => {
                                                const factionId = parseInt(factionIdStr);
                                                updatedFactionCounter[factionId] = updatedDefenseFactionsBuffer[factionId];
                                            });
                                        }
                                    }
                                    
                                    setPlayroomGame({
                                        ...gameState,
                                        hands: { ...gameState.hands, [currentPlayerId]: myCards },
                                        slots: newSlots,
                                        factionCounter: updatedFactionCounter,
                                        activeFirstAttackFactions: updatedActiveFirstAttackFactions,
                                        defenseFactionsBuffer: updatedDefenseFactionsBuffer,
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
                    <div>🔄 Play V2 активен | {gameMode === 'attack' ? '⚔️ Режим атаки' : '🛡️ Режим защиты'} | 🃏 {myHand.length}/6 карт | 📚 Колода: {gameState.deck.length} карт | 🖱️ Drag & Drop активен</div>
                    <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.6 }}>
                        🎯 Отладка: activeCard={activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Наведение атаки={hoveredAttackCard !== null ? `карта ${hoveredAttackCard}` : 'нет'} | Наведение защиты={hoveredDefenseCard !== null ? `карта ${hoveredDefenseCard}` : 'нет'} | Мышь={mousePosition ? `${mousePosition.x},${mousePosition.y}` : 'нет'} | Защита={defenseCards.filter(card => card !== null).length} карт | Атака={gameState.slots?.filter(s => s !== null).length || 0} карт
                    </div>
                    <div style={{ marginTop: "2px", fontSize: "9px", opacity: 0.5, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        🖱️ Сенсор: {gameMode === 'attack' ? 'ищет карты (защита > атака)' : 'ищет карты атаки'} | Радиус: 80px | Курсор: {mousePosition ? `${mousePosition.x}, ${mousePosition.y}` : 'нет'} | Активная карта: {activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Отладка: {showSensorCircle ? 'включена' : 'выключена'}
                    </div>
                </div>

                {/* Визуальный индикатор сенсора */}
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
                                fontSize: "10px", 
                                opacity: 0.8,
                                color: "#E5E7EB"
                            }}>
                                Power: {activeCard.card.power}
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default GameBoardV2;

