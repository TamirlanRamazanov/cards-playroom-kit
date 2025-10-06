import type { GameState, Card } from "../types";
import GameOverModal from "./GameOverModal";
import { useState, useEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
// import DraggableCard from "./DraggableCard";
import DropZone from "./DropZone";
import DefenseZone from "./DefenseZone";
import { FACTIONS } from "../engine/cards";

interface Props {
    myId: string;
    game: GameState;
    updateGame: (updater: (prev: GameState) => GameState) => void;
}

export default function GameBoard({ myId, game, updateGame }: Props) {
    // Inline styles as fallback for Vercel compatibility
    const gameButtonStyle = {
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '11px',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s ease',
    } as React.CSSProperties;
    const playerIds = Object.keys(game.players || {});
    const myHand = game.hands[myId] || [];

    // Состояния для drag&drop
    const [activeCard, setActiveCard] = useState<{ card: Card; index: number; source: string } | null>(null);
    const [hoveredAttackCard, setHoveredAttackCard] = useState<number | null>(null);
    const [hoveredDefenseCard, setHoveredDefenseCard] = useState<number | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [showSensorCircle, setShowSensorCircle] = useState<boolean>(false);
    const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
    // const [invalidDefenseCard, setInvalidDefenseCard] = useState<number | null>(null);
    // const [canTakeCards, setCanTakeCards] = useState<boolean>(false);
    const [defenseCards, setDefenseCards] = useState<(Card | null)[]>([]); // Локальное состояние для отображения карт защиты
    const [isUpdatingDefenseCards] = useState<boolean>(false); // Флаг для предотвращения конфликтов
    
    // Состояния для игровой логики
    const [gameMode, setGameMode] = useState<'attack' | 'defense'>('attack');
    
    // Используем глобальное состояние для фракций
    const factionCounter = game.factionCounter || {};
    const activeFactions = game.displayActiveFactions || [];
    
    // Состояния для системы инициализации
    const [showGameInitialization, setShowGameInitialization] = useState<boolean>(false);

    // Автоматическая инициализация при изменении состояния игры
    useEffect(() => {
        if (game.gameInitialized && !showGameInitialization) {
            initializeGameForPlayer();
        }
    }, [game.gameInitialized]);

    // useEffect для синхронизации размера div защиты с div атаки
    useEffect(() => {
        syncDefenseZoneSize();
    }, [game.slots]);

    // useEffect для обновления отображения активных фракций
    useEffect(() => {
        updateActiveFactionsDisplay();
    }, [game.slots, game.defenseSlots, game.activeFirstAttackFactions, game.usedDefenseCardFactions]);

    // Глобальный обработчик мыши для отслеживания позиции курсора
    useEffect(() => {
        if (showSensorCircle || activeCard) {
            const handleGlobalMouseMove = (e: MouseEvent) => {
                setMousePosition({ x: e.clientX, y: e.clientY });
            };

            document.addEventListener('mousemove', handleGlobalMouseMove);

            return () => {
                document.removeEventListener('mousemove', handleGlobalMouseMove);
            };
        }
    }, [showSensorCircle, activeCard]);

    // useEffect для синхронизации defenseCards с глобальным game.defenseSlots
    useEffect(() => {
        const globalDefense = game.defenseSlots || [];
        if (isUpdatingDefenseCards) {
            return;
        }
        // Сравниваем состав по id карт, чтобы понять, отличается ли состояние
        const toKey = (arr: (Card | null)[]) => arr.map(c => (c ? c.id : null)).join("|");
        const localKey = toKey(defenseCards);
        const globalKey = toKey(globalDefense);
        if (localKey !== globalKey) {
            setDefenseCards(globalDefense);
        }
    }, [game.defenseSlots, isUpdatingDefenseCards]);

    // Функции для обработки hover событий
    const handleAttackCardHover = (index: number) => {
        console.log(`🎯 Hover attack card: ${index}`);
        setHoveredAttackCard(index);
    };

    const handleAttackCardLeave = () => {
        console.log(`🎯 Leave attack card`);
        setHoveredAttackCard(null);
    };

    const handleDefenseCardHover = (index: number) => {
        console.log(`🎯 Hover defense card: ${index}`);
        // Только в режиме атаки подсвечиваем карты защиты
        if (gameMode === 'attack') {
            setHoveredDefenseCard(index);
        }
    };

    const handleDefenseCardLeave = () => {
        console.log(`🎯 Leave defense card`);
        setHoveredDefenseCard(null);
    };

    const handleDefenseCardSlotHover = (attackIndex: number) => {
        console.log(`🎯 Hover defense card slot: ${attackIndex}, gameMode: ${gameMode}, role: ${getCurrentPlayerRole()}`);
        setHoveredDefenseCard(attackIndex);
    };

    const handleDefenseCardSlotLeave = () => {
        console.log(`🎯 Leave defense card slot, gameMode: ${gameMode}, role: ${getCurrentPlayerRole()}`);
        setHoveredDefenseCard(null);
    };

    // Функции для drop zone активации
    const handleDropZoneActivate = (zoneId: string) => {
        console.log(`🎯 Drop zone activated: ${zoneId}`);
        setActiveDropZone(zoneId);
    };

    const handleDropZoneDeactivate = () => {
        console.log(`🎯 Drop zone deactivated`);
        setActiveDropZone(null);
    };

    // Функции для системы инициализации игры
    const initializeGameForPlayer = () => {
        if (game.gameInitialized && !showGameInitialization) {
            // Устанавливаем правильный режим игры в зависимости от роли игрока
            const playerRole = getCurrentPlayerRole();
            if (playerRole === 'attacker' || playerRole === 'co-attacker') {
                setGameMode('attack');
            } else if (playerRole === 'defender') {
                setGameMode('defense');
            } else {
                setGameMode('attack'); // По умолчанию для наблюдателей
            }
            
            setShowGameInitialization(true);
            // Автоматически скрываем через 6 секунд
            setTimeout(() => {
                setShowGameInitialization(false);
            }, 6000);
        }
    };

    const resetGameState = () => {
        // Сбрасываем глобальное состояние фракций
        updateGame(prev => ({
            ...prev,
            factionCounter: {},
            activeFirstAttackFactions: [],
            usedDefenseCardFactions: {},
            displayActiveFactions: []
        }));
        setDefenseCards([]);
        setGameMode('attack');
        setShowGameInitialization(false);
        clearDrawQueue();
    };

    // Функции для работы с ролями
    const getCurrentPlayerRole = (): 'attacker' | 'co-attacker' | 'defender' | 'observer' | null => {
        return game.playerRoles?.[myId] || null;
    };

    const canPlayerAttack = (): boolean => {
        const role = getCurrentPlayerRole();
        if (!role || (role !== 'attacker' && role !== 'co-attacker')) return false;
        
        // Проверяем приоритет атаки
        if (role === 'attacker' && game.attackPriority === 'co-attacker') return false;
        if (role === 'co-attacker' && game.attackPriority === 'attacker') return false;
        
        // Со-атакующий может играть только после того, как главный атакующий подкинул карту
        if (role === 'co-attacker' && !game.mainAttackerHasPlayed) return false;
        
        // Проверяем, не нажал ли игрок уже "Пас"
        if (role === 'attacker' && game.attackerPassed) return false;
        if (role === 'co-attacker' && game.coAttackerPassed) return false;
        
        return true;
    };

    const hasUnbeatenCards = (): boolean => {
        // Проверяем, есть ли карты атаки без защиты
        const attackCards = game.slots?.filter(slot => slot !== null) || [];
        const defenseCardsCount = defenseCards.filter(slot => slot !== null).length;
        return attackCards.length > defenseCardsCount;
    };

    // Функции для кнопок "Бито" и "Пас"
    const handleBito = () => {
        const role = getCurrentPlayerRole();
        if (!role || (role !== 'attacker' && role !== 'co-attacker')) return;
        
        // Проверяем, что главный атакующий уже играл
        if (!game.mainAttackerHasPlayed) {
            alert('❌ Сначала нужно подкинуть хотя бы одну карту!');
            return;
        }
        
        // Проверяем, что все карты отбиты
        if (hasUnbeatenCards()) {
            alert('❌ Не все карты отбиты! Сначала отбейте все карты атаки.');
            return;
        }
        
        // Проверяем, не нажал ли игрок уже "Пас"
        if ((role === 'attacker' && game.attackerPassed) || (role === 'co-attacker' && game.coAttackerPassed)) {
            alert('❌ Вы уже нажали "Пас"!');
            return;
        }
        
        updateGame((prev) => {
            let newState = { ...prev };
            
            if (role === 'attacker') {
                // Главный атакующий нажал "Бито" - передаем приоритет со-атакующему
                newState.attackPriority = 'co-attacker';
                newState.attackerBitoPressed = true;
                newState.coAttackerBitoPressed = false; // Разблокируем кнопку со-атакующего
                console.log('🎯 Главный атакующий нажал "Бито" - приоритет передан со-атакующему');
            } else if (role === 'co-attacker') {
                // Со-атакующий нажал "Бито" - передаем приоритет главному атакующему
                newState.attackPriority = 'attacker';
                newState.coAttackerBitoPressed = true;
                newState.attackerBitoPressed = false; // Разблокируем кнопку главного атакующего
                console.log('🎯 Со-атакующий нажал "Бито" - приоритет передан главному атакующему');
            }
            
            return newState;
        });
    };

    const handlePas = () => {
        const role = getCurrentPlayerRole();
        if (!role || (role !== 'attacker' && role !== 'co-attacker')) return;
        
        // Проверяем, что главный атакующий уже играл
        if (!game.mainAttackerHasPlayed) {
            alert('❌ Сначала нужно подкинуть хотя бы одну карту!');
            return;
        }
        
        // Проверяем, что все карты отбиты
        if (hasUnbeatenCards()) {
            alert('❌ Не все карты отбиты! Сначала отбейте все карты атаки.');
            return;
        }
        
        // Проверяем, не нажал ли игрок уже "Пас"
        if ((role === 'attacker' && game.attackerPassed) || (role === 'co-attacker' && game.coAttackerPassed)) {
            alert('❌ Вы уже нажали "Пас"!');
            return;
        }
        
        updateGame((prev) => {
            let newState = { ...prev };
            
            if (role === 'attacker') {
                newState.attackerPassed = true;
                newState.attackerPasPressed = true;
                newState.coAttackerBitoPressed = false; // Разблокируем кнопку со-атакующего
                console.log('🎯 Главный атакующий нажал "Пас"');
            } else if (role === 'co-attacker') {
                newState.coAttackerPassed = true;
                newState.coAttackerPasPressed = true;
                newState.attackerBitoPressed = false; // Разблокируем кнопку главного атакующего
                console.log('🎯 Со-атакующий нажал "Пас"');
            }
            
            // Проверяем, не закончился ли ход
            checkTurnEnd(newState);
            
            return newState;
        });
    };

    const checkTurnEnd = (gameState: GameState) => {
        if (gameState.attackerPassed && gameState.coAttackerPassed) {
            console.log('🎯 Оба игрока нажали "Пас" - ход завершается');
            endTurn();
        }
    };

    const endTurn = () => {
        console.log('🎯 Завершение хода - карты идут в сброс');
        
        updateGame((prev) => {
            const newState = { ...prev };
            
            // Перемещаем все карты в сброс
            const allCards = [
                ...(prev.slots?.filter(card => card !== null) || []),
                ...(prev.defenseSlots?.filter(card => card !== null) || [])
            ];
            
            newState.discardPile = [...(prev.discardPile || []), ...allCards];
            newState.slots = new Array(6).fill(null);
            newState.defenseSlots = new Array(6).fill(null);
            
            // Сбрасываем состояния кнопок
            newState.attackPriority = 'attacker';
            newState.mainAttackerHasPlayed = false;
            newState.attackerPassed = false;
            newState.coAttackerPassed = false;
            newState.attackerBitoPressed = false;
            newState.coAttackerBitoPressed = false;
            newState.attackerPasPressed = false;
            newState.coAttackerPasPressed = false;
            
            // Сбрасываем глобальное состояние фракций
            newState.factionCounter = {};
            newState.activeFirstAttackFactions = [];
            newState.usedDefenseCardFactions = {};
            newState.displayActiveFactions = [];
            setDefenseCards([]);
            
            console.log('✅ Ход завершен, карты перемещены в сброс');
            
            return newState;
        });
        
        // Смена ролей после успешной защиты
        setTimeout(() => {
            rotateRolesAfterSuccessfulDefense();
        }, 100);
        
        // Обрабатываем очередь добора карт
        setTimeout(() => {
            processDrawQueue();
        }, 200);
        
        // Проверяем окончание игры
        setTimeout(() => {
            checkGameEnd();
        }, 300);
    };

    // Функции для смены ролей
    const rotateRolesAfterSuccessfulDefense = () => {
        console.log('🎯 Смена ролей после успешной защиты (карты в сброс)');
        
        updateGame((prev) => {
            const newState = { ...prev };
            const playerIds = Object.keys(prev.players || {});
            const playerCount = playerIds.length;
            
            if (playerCount === 2) {
                // 2 игрока: роли не меняются
                console.log('🎯 2 игрока - роли не меняются');
            } else if (playerCount === 3) {
                // 3 игрока: роли сдвигаются на 1 вперед
                const currentRoles = { ...prev.playerRoles };
                const newRoles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
                
                playerIds.forEach((playerId) => {
                    const currentRole = currentRoles[playerId];
                    let newRole: 'attacker' | 'co-attacker' | 'defender' | 'observer';
                    
                    if (currentRole === 'attacker') {
                        newRole = 'defender';
                    } else if (currentRole === 'defender') {
                        newRole = 'co-attacker';
                    } else if (currentRole === 'co-attacker') {
                        newRole = 'attacker';
                    } else {
                        newRole = 'observer';
                    }
                    
                    newRoles[playerId] = newRole;
                });
                
                newState.playerRoles = newRoles;
                console.log('🎯 3 игрока - роли сдвинуты на 1 вперед');
            } else {
                // 4+ игроков: роли сдвигаются на 1 вперед
                const currentRoles = { ...prev.playerRoles };
                const newRoles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
                
                playerIds.forEach((playerId) => {
                    const currentRole = currentRoles[playerId];
                    let newRole: 'attacker' | 'co-attacker' | 'defender' | 'observer';
                    
                    if (currentRole === 'attacker') {
                        newRole = 'defender';
                    } else if (currentRole === 'defender') {
                        newRole = 'co-attacker';
                    } else if (currentRole === 'co-attacker') {
                        newRole = 'observer';
                    } else {
                        // Находим следующего наблюдателя, который станет атакующим
                        const observerIndex = playerIds.indexOf(playerId);
                        const nextObserverIndex = (observerIndex + 1) % playerIds.length;
                        const nextObserverId = playerIds[nextObserverIndex];
                        
                        if (currentRoles[nextObserverId] === 'observer') {
                            newRole = 'attacker';
                        } else {
                            newRole = 'observer';
                        }
                    }
                    
                    newRoles[playerId] = newRole;
                });
                
                newState.playerRoles = newRoles;
                console.log('🎯 4+ игроков - роли сдвинуты на 1 вперед');
            }
            
            return newState;
        });
    };

    // const rotateRolesAfterTakeCards = () => {
    //     console.log('🎯 Смена ролей после взятия карт защитником');
    //     
    //     updateGame((prev) => {
    //         const newState = { ...prev };
    //         const playerIds = Object.keys(prev.players || {});
    //         const playerCount = playerIds.length;
    //         
    //         if (playerCount === 2) {
    //             // 2 игрока: роли не меняются
    //             console.log('🎯 2 игрока - роли не меняются');
    //         } else if (playerCount === 3) {
    //             // 3 игрока: роли сдвигаются на 1 назад
    //             const currentRoles = { ...prev.playerRoles };
    //             const newRoles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
    //             
    //             playerIds.forEach((playerId) => {
    //                 const currentRole = currentRoles[playerId];
    //                 let newRole: 'attacker' | 'co-attacker' | 'defender' | 'observer';
    //                 
    //                 if (currentRole === 'attacker') {
    //                     newRole = 'co-attacker';
    //                 } else if (currentRole === 'co-attacker') {
    //                     newRole = 'defender';
    //                 } else if (currentRole === 'defender') {
    //                     newRole = 'attacker';
    //                 } else {
    //                     newRole = 'observer';
    //                 }
    //                 
    //                 newRoles[playerId] = newRole;
    //             });
    //             
    //             newState.playerRoles = newRoles;
    //             console.log('🎯 3 игрока - роли сдвинуты на 1 назад');
    //         } else {
    //             // 4+ игроков: роли сдвигаются на 2 вперед
    //             const currentRoles = { ...prev.playerRoles };
    //             const newRoles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
    //             
    //             playerIds.forEach((playerId) => {
    //                 const currentRole = currentRoles[playerId];
    //                 let newRole: 'attacker' | 'co-attacker' | 'defender' | 'observer';
    //                 
    //                 if (currentRole === 'attacker') {
    //                     newRole = 'co-attacker';
    //                 } else if (currentRole === 'co-attacker') {
    //                     newRole = 'defender';
    //                 } else if (currentRole === 'defender') {
    //                     newRole = 'observer';
    //                 } else {
    //                     // Находим следующего наблюдателя, который станет атакующим
    //                     const observerIndex = playerIds.indexOf(playerId);
    //                     const nextObserverIndex = (observerIndex + 1) % playerIds.length;
    //                     const nextObserverId = playerIds[nextObserverIndex];
    //                     
    //                     if (currentRoles[nextObserverId] === 'observer') {
    //                         newRole = 'attacker';
    //                     } else {
    //                         newRole = 'observer';
    //                     }
    //                 }
    //                 
    //                 newRoles[playerId] = newRole;
    //             });
    //             
    //             newState.playerRoles = newRoles;
    //             console.log('🎯 4+ игроков - роли сдвинуты на 2 вперед');
    //         }
    //         
    //         return newState;
    //     });
    // };

    // Функции для автоматического добора карт
    const addToDrawQueue = (playerId: string, isDefender: boolean = false) => {
        console.log(`🎯 Добавляем игрока ${playerId} в очередь добора (защитник: ${isDefender})`);
        
        updateGame((prev) => {
            const newState = { ...prev };
            const currentQueue = [...(prev.drawQueue || [])];
            
            if (isDefender) {
                // Защитник добавляется в конец очереди
                currentQueue.push(playerId);
            } else {
                // Атакующие добавляются в начало очереди
                currentQueue.unshift(playerId);
            }
            
            newState.drawQueue = currentQueue;
            console.log(`🎯 Очередь добора: ${currentQueue.join(', ')}`);
            
            return newState;
        });
    };

    const processDrawQueue = () => {
        console.log('🎯 Обрабатываем очередь добора карт');
        
        updateGame((prev) => {
            const newState = { ...prev };
            const queue = [...(prev.drawQueue || [])];
            const deck = [...(prev.deck || [])];
            const hands = { ...prev.hands };
            
            // Обрабатываем очередь
            for (const playerId of queue) {
                const playerHand = hands[playerId] || [];
                
                // Добираем карты до 6, если в колоде есть карты
                while (playerHand.length < 6 && deck.length > 0) {
                    const card = deck.shift();
                    if (card) {
                        playerHand.push(card);
                        console.log(`🎯 Игрок ${playerId} получил карту: ${card.name}`);
                    }
                }
                
                hands[playerId] = playerHand;
            }
            
            newState.deck = deck;
            newState.hands = hands;
            newState.drawQueue = []; // Очищаем очередь
            
            console.log(`✅ Очередь добора обработана. Осталось карт в колоде: ${deck.length}`);
            
            // Проверяем окончание игры после добора карт
            if (deck.length === 0) {
                console.log('🎯 Колода пуста - проверяем окончание игры');
                setTimeout(() => {
                    checkGameEnd();
                }, 100);
            }
            
            return newState;
        });
    };

    const clearDrawQueue = () => {
        updateGame((prev) => ({
            ...prev,
            drawQueue: []
        }));
    };

    // Функция синхронизации размера div защиты с div атаки
    const syncDefenseZoneSize = () => {
        const attackCardsCount = game.slots?.filter(slot => slot !== null).length || 0;
        const currentDefense = game.defenseSlots || [];
        if (attackCardsCount !== currentDefense.length) {
            updateGame((prev) => {
                const newDefenseSlots = new Array(attackCardsCount).fill(null).map((_, i) => prev.defenseSlots?.[i] || null);
                return { ...prev, defenseSlots: newDefenseSlots };
            });
        }
    };

    // Функции для проверки окончания игры
    const checkGameEnd = () => {
        console.log('🎯 Проверяем условия окончания игры');
        
        updateGame((prev) => {
            const newState = { ...prev };
            const playerIds = Object.keys(prev.players || {});
            const deckEmpty = (prev.deck?.length || 0) === 0;
            
            if (!deckEmpty) {
                console.log('🎯 Колода не пуста - игра продолжается');
                return newState;
            }
            
            // Подсчитываем игроков с картами
            const playersWithCards = playerIds.filter(playerId => {
                const handSize = (prev.hands[playerId]?.length || 0);
                return handSize > 0;
            });
            
            console.log(`🎯 Игроки с картами: ${playersWithCards.length}`);
            
            if (playersWithCards.length === 1) {
                // Только один игрок остался с картами - он проиграл
                const loserId = playersWithCards[0];
                const loserName = prev.players[loserId]?.name || loserId;
                
                console.log(`🎯 Игра окончена! Проиграл: ${loserName}`);
                
                newState.phase = "gameover";
                newState.winnerId = loserId;
                
                // Показываем модальное окно с результатами
                setTimeout(() => {
                    alert(`🎯 Игра окончена!\n\nПроиграл: ${loserName}\n\nОстальные игроки победили!`);
                }, 500);
            } else if (playersWithCards.length === 0) {
                // Все игроки без карт - ничья
                console.log('🎯 Игра окончена! Ничья - все игроки без карт');
                
                newState.phase = "gameover";
                newState.winnerId = undefined;
                
                setTimeout(() => {
                    alert('🎯 Игра окончена!\n\nНичья - все игроки остались без карт!');
                }, 500);
            } else {
                console.log('🎯 Игра продолжается - несколько игроков с картами');
            }
            
            return newState;
        });
    };

    // Функции для работы с фракциями
    const getFactionNames = (factionIds: number[]): string[] => {
        return factionIds.map(id => FACTIONS[id] || `Unknown ${id}`);
    };

    const hasCommonFactions = (cardFactions: number[], activeFactionIds: number[]): boolean => {
        return cardFactions.some(factionId => activeFactionIds.includes(factionId));
    };

    // Функция для проверки, может ли карта защиты использовать фракцию
    const canDefenseCardUseFaction = (defenseCard: Card, factionId: number): boolean => {
        const usedFactions = game.usedDefenseCardFactions?.[defenseCard.id] || [];
        return !usedFactions.includes(factionId);
    };

    // Функция для получения пересечения фракций
    const getFactionIntersection = (cardFactions: number[], activeFactionIds: number[]): number[] => {
        return cardFactions.filter(factionId => activeFactionIds.includes(factionId));
    };

    // Функция для получения фракций первой карты атаки
    const getFirstAttackCardFactions = (): number[] => {
        const attackCards = game.slots?.filter(card => card !== null) || [];
        if (attackCards.length === 0) return [];
        
        // Возвращаем фракции первой карты атаки
        return attackCards[0].factions;
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
        
        // setDefenseFactionsBuffer(newBuffer);
        console.log(`🎯 Сохранены фракции защиты в буфер:`, Object.keys(newBuffer).map(id => `${FACTIONS[parseInt(id)]}(${newBuffer[parseInt(id)]})`));
        return newBuffer;
    };

    // Функция для восстановления фракций от карт защиты из буфера
    // const restoreDefenseFactionsFromBuffer = (prev: Record<number, number>) => {
    //     const newCounter = { ...prev };
    //     // Восстанавливаем фракции из буфера
    //     Object.keys(defenseFactionsBuffer).forEach(factionIdStr => {
    //         const factionId = parseInt(factionIdStr);
    //         newCounter[factionId] = defenseFactionsBuffer[factionId];
    //     });
    //     
    //     setFactionCounter(newCounter);
    //     console.log(`🎯 Восстановлены фракции защиты из буфера:`, Object.keys(defenseFactionsBuffer).map(id => `${FACTIONS[parseInt(id)]}(${defenseFactionsBuffer[parseInt(id)]})`));
    //     return newCounter;
    // };

    // Функции для работы с фракционной системой
    const updateActiveFactionsFromAttackCard = (card: Card) => {
        // Проверяем, заполнен ли див атаки (6 карт)
        const attackCardsCount = game.slots?.filter(slot => slot !== null).length || 0;
        if (attackCardsCount >= 6) {
            console.log(`🚫 Див атаки заполнен (${attackCardsCount}/6), блокируем изменение фракций`);
            return;
        }

        if (game.slots?.every(slot => slot === null)) {
            // Первая карта - устанавливаем все её фракции как единицу
            updateGame(prev => ({
                ...prev,
                activeFirstAttackFactions: card.factions,
                factionCounter: card.factions.reduce((acc, factionId) => {
                    acc[factionId] = 1;
                    return acc;
                }, {} as Record<number, number>)
            }));
            console.log(`🎯 Первая карта атаки - фракции установлены как единица:`, getFactionNames(card.factions));
            return;
        }

        // Для последующих карт - сохраняем фракции защиты в буфер
        saveDefenseFactionsToBuffer(factionCounter);

        // Пересечение с фракциями первой карты атаки
        const firstAttackFactions = getFirstAttackCardFactions();
        const intersection = getFactionIntersection(card.factions, firstAttackFactions);
        
        // Обновляем активные фракции первой карты - только пересекающиеся
        updateGame(prev => {
            const newCounter: Record<number, number> = {};
            // Сохраняем только фракции из пересечения (не все фракции первой карты!)
            intersection.forEach(factionId => {
                if (prev.factionCounter?.[factionId] && prev.factionCounter[factionId] > 0) {
                    newCounter[factionId] = prev.factionCounter[factionId];
                }
            });
            
            return {
                ...prev,
                activeFirstAttackFactions: intersection,
                factionCounter: newCounter
            };
        });
        
        console.log(`🎯 Карта атаки добавлена через див атаки - восстановлены фракции защиты`);
    };

    const updateActiveFactionsFromDefenseCard = (card: Card) => {
        // Проверяем, заполнен ли див атаки (6 карт)
        const attackCardsCount = game.slots?.filter(slot => slot !== null).length || 0;
        if (attackCardsCount >= 6) {
            console.log(`🚫 Див атаки заполнен (${attackCardsCount}/6), блокируем изменение фракций через карты защиты`);
            return;
        }

        // Все фракции карты защиты становятся активными
        const factionNames = getFactionNames(card.factions);
        
        // Обновляем счётчик
        updateGame(prev => {
            const newCounter = { ...prev.factionCounter };
            card.factions.forEach(factionId => {
                newCounter[factionId] = (newCounter[factionId] || 0) + 1;
            });
            return {
                ...prev,
                factionCounter: newCounter
            };
        });
        console.log(`🎯 Добавлены фракции защиты:`, factionNames);
        
        // Обновляем отображение активных фракций
        updateActiveFactionsDisplay();
    };

    // Функция для прикрепления атакующей карты через защитную
    const attachAttackCardThroughDefense = (attackCard: Card, defenseCard: Card): boolean => {
        // Проверяем, заполнен ли див атаки (6 карт)
        const attackCardsCount = game.slots?.filter(slot => slot !== null).length || 0;
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
        saveDefenseFactionsToBuffer(factionCounter);

        // Обновляем активные фракции
        // Сохраняем фракции первой карты атаки (они всегда остаются)
        const firstAttackFactions = getFirstAttackCardFactions();
        const firstAttackFactionNames = getFactionNames(firstAttackFactions);
        
        // Добавляем фракции из пересечения с защитной картой
        const intersectionNames = getFactionNames(intersection);
        
        // Обновляем счётчик: оставляем только фракции первой карты атаки + пересечение
        const keepFactions = [...firstAttackFactions, ...intersection];
        
        updateGame(prev => {
            const newCounter: Record<number, number> = {};
            keepFactions.forEach(factionId => {
                if (prev.factionCounter?.[factionId] && prev.factionCounter[factionId] > 0) {
                    newCounter[factionId] = prev.factionCounter[factionId];
                }
            });
            
            return {
                ...prev,
                factionCounter: newCounter,
                activeFirstAttackFactions: firstAttackFactions,
                usedDefenseCardFactions: {
                    ...prev.usedDefenseCardFactions,
                    [defenseCard.id]: [...(prev.usedDefenseCardFactions?.[defenseCard.id] || []), ...intersection]
                }
            };
        });
        
        console.log(`🎯 Атакующая карта прикреплена через защитную. Фракции первой карты атаки: ${firstAttackFactionNames.join(', ')}, Пересечение: ${intersectionNames.join(', ')}`);
        
        // Обновляем отображение активных фракций
        updateActiveFactionsDisplay();
        return true;
    };

    // Функция для обновления отображения активных фракций
    const updateActiveFactionsDisplay = () => {
        // Собираем доступные фракции со всех защитных карт
        const allAvailableDefenseFactions: number[] = [];
        (game.defenseSlots || []).forEach(defenseCard => {
            if (defenseCard) {
                const availableDefenseFactions = defenseCard.factions.filter(factionId => 
                    canDefenseCardUseFaction(defenseCard, factionId)
                );
                allAvailableDefenseFactions.push(...availableDefenseFactions);
            }
        });

        // Объединяем активные фракции с доступными фракциями защиты
        [...new Set([
            ...(game.activeFirstAttackFactions || []),
            ...allAvailableDefenseFactions
        ])];

        // Создаем счетчик для отображения
        const displayCounter: Record<number, number> = {};
        
        // Добавляем счетчики от карт атаки (фракции первой карты)
        (game.activeFirstAttackFactions || []).forEach(factionId => {
            displayCounter[factionId] = (displayCounter[factionId] || 0) + 1;
        });
        
        // Добавляем счетчики от карт защиты
        allAvailableDefenseFactions.forEach(factionId => {
            displayCounter[factionId] = (displayCounter[factionId] || 0) + 1;
        });

        // Обновляем отображаемые активные фракции
        const newActiveFactions = Object.entries(displayCounter)
            .filter(([_, count]) => count > 0)
            .map(([factionId, count]) => `${getFactionNames([Number(factionId)])[0]} (${count})`);
        
        // Обновляем глобальное состояние
        updateGame(prev => ({
            ...prev,
            displayActiveFactions: newActiveFactions
        }));
    };


    const validateAttackCard = (card: Card): { isValid: boolean; reason?: string } => {
        // Если это первая карта атаки, разрешаем любую карту
        if (game.slots?.every(slot => slot === null)) {
            return { isValid: true };
        }

        // Проверяем, есть ли общие фракции с активными фракциями первой карты
        if (game.activeFirstAttackFactions && game.activeFirstAttackFactions.length > 0) {
            const hasCommon = hasCommonFactions(card.factions, game.activeFirstAttackFactions);
            if (!hasCommon) {
                return { 
                    isValid: false, 
                    reason: `Карта должна иметь общие фракции с первой картой атаки: ${getFactionNames(game.activeFirstAttackFactions).join(', ')}` 
                };
            }
        }

        return { isValid: true };
    };

    const validateDefenseCard = (defenseCard: Card, attackCard: Card): boolean => {
        return defenseCard.power > attackCard.power;
    };

    // Функции для drag&drop
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const cardData = active.data.current as { card: Card; index: number; source: string };
        
        if (cardData) {
            setActiveCard(cardData);
            console.log(`🎯 Drag start: ${cardData.card.name} from ${cardData.source}`);
            console.log(`🎯 Current gameMode: ${gameMode}`);
            console.log(`🎯 Player role: ${getCurrentPlayerRole()}`);
            console.log(`🎯 Can player attack: ${canPlayerAttack()}`);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        console.log('🎯 Завершено перетаскивание:', { activeId: active.id, overId: over?.id });

        // Проверяем роль текущего игрока - наблюдающие не могут взаимодействовать со столом
        if (getCurrentPlayerRole() === 'observer') {
            console.log('❌ Наблюдающие игроки не могут взаимодействовать со столом');
            setActiveCard(null);
            return;
        }

        // Проверяем приоритет атаки для атакующих игроков
        if (gameMode === 'attack' && !canPlayerAttack()) {
            console.log('❌ Приоритет атаки не у вас');
            alert('Приоритет атаки не у вас');
            setActiveCard(null);
            return;
        }

        setActiveCard(null);
        setHoveredAttackCard(null);
        setHoveredDefenseCard(null);

        if (!over) {
            console.log('❌ Нет цели для drop');
            return;
        }

        const cardData = active.data.current as { card: Card; index: number; source: string };
        if (!cardData) {
            console.log('❌ Нет данных карты');
            return;
        }

        const targetZone = over.id as string;
        console.log('🎯 Целевая зона:', targetZone);

        // Перемещение карты из руки на отдельную карту защиты
        if (cardData.source === 'hand' && targetZone.startsWith('defense-card-')) {
            const attackIndex = parseInt(targetZone.replace('defense-card-', ''));
            console.log('🎯 Карта отпущена над картой защиты, добавляем в див атаки');
            
            // Определяем карту защиты
            let defenseCard: Card | null = null;
            if (hoveredDefenseCard !== null && game.defenseSlots?.[hoveredDefenseCard]) {
                defenseCard = game.defenseSlots[hoveredDefenseCard];
            } else if (game.defenseSlots?.[attackIndex]) {
                defenseCard = game.defenseSlots[attackIndex];
            }
            
            if (!defenseCard) {
                console.log('❌ Карта защиты не найдена');
                return;
            }
            
            // Используем специальную механику прикрепления через защитную карту
            const success = attachAttackCardThroughDefense(cardData.card, defenseCard);
            if (!success) {
                setActiveCard(null);
                setHoveredDefenseCard(null);
                return;
            }
            
            // Находим свободный слот
            const freeSlotIndex = game.slots?.findIndex(slot => slot === null) ?? -1;
            
            if (freeSlotIndex >= 0) {
                console.log('🎯 Добавляем карту в слот', freeSlotIndex);
                
                updateGame((prev) => {
            const myCards = [...(prev.hands[myId] || [])];
                    myCards.splice(cardData.index, 1);
                    
                    const slots = [...(prev.slots || [])];
                    slots[freeSlotIndex] = cardData.card;
                    
                    // Отмечаем, что главный атакующий подкинул карту
                    let newState = {
                ...prev,
                hands: { ...prev.hands, [myId]: myCards },
                slots,
            };

                    if (getCurrentPlayerRole() === 'attacker') {
                        newState.mainAttackerHasPlayed = true;
                        console.log('🎯 Главный атакующий подкинул карту');
                    }

                    // Обновляем фракции после добавления карты
                    updateActiveFactionsFromAttackCard(cardData.card);

                    // Добавляем игрока в очередь добора
                    addToDrawQueue(myId, false);

                    return tryDeclareWinner(newState);
                });
            } else {
                console.log('❌ Нет свободных слотов');
                alert('❌ Нет свободных слотов на столе!');
            }
            return;
        }

        // Перемещение карты из руки на стол
        if (cardData.source === 'hand' && targetZone === 'table') {
            // Проверяем режим: в режиме защиты нельзя добавлять карты на стол атаки
            if (gameMode === 'defense') {
                // В режиме защиты пытаемся отбить карту
                const attackCards = game.slots?.map((slot, idx) => ({ slot, index: idx })).filter(({ slot }) => slot !== null) || [];
                
                if (attackCards.length > 0) {
                    const targetIndex = hoveredAttackCard !== null ? hoveredAttackCard : attackCards[0].index;
                    console.log('🎯 Выбранный индекс для защиты:', targetIndex);
                    
                    // Добавляем карту защиты над выбранной картой атаки (в одном атомарном апдейте внутри addDefenseCard)
                    addDefenseCard(targetIndex, cardData.card, cardData.index);
                } else {
                    alert('🛡️ Нет карт атаки для отбивания!');
                }
                return;
            }
            
            // В режиме атаки добавляем карту на стол
            const validation = validateAttackCard(cardData.card);
            if (!validation.isValid) {
                console.log('❌ Карта не прошла валидацию:', validation.reason);
                alert(validation.reason);
                return;
            }

            // Находим свободный слот
            const freeSlotIndex = game.slots?.findIndex(slot => slot === null) ?? -1;
            
            if (freeSlotIndex >= 0) {
                console.log('🎯 Добавляем карту в слот', freeSlotIndex);
                
        updateGame((prev) => {
            const myCards = [...(prev.hands[myId] || [])];
                    myCards.splice(cardData.index, 1);
                    
                    const slots = [...(prev.slots || [])];
                    slots[freeSlotIndex] = cardData.card;
                    
                    // Отмечаем, что главный атакующий подкинул карту
                    let newState = {
                ...prev,
                hands: { ...prev.hands, [myId]: myCards },
                slots,
            };

                    if (getCurrentPlayerRole() === 'attacker') {
                        newState.mainAttackerHasPlayed = true;
                        console.log('🎯 Главный атакующий подкинул карту');
                    }

                    // Обновляем фракции после добавления карты
                    updateActiveFactionsFromAttackCard(cardData.card);

                    // Добавляем игрока в очередь добора
                    addToDrawQueue(myId, false);

                    return tryDeclareWinner(newState);
                });
                
                console.log('✅ Карта успешно добавлена!');
            } else {
                console.log('❌ Нет свободных слотов');
                alert('🃏 Стол полон! Максимум 6 карт.');
            }
        }
    };

    const addDefenseCard = (attackCardIndex: number, defenseCard: Card, handIndex?: number): boolean => {
        const attackCard = game.slots?.[attackCardIndex];
        if (!attackCard) {
            console.log('❌ Карта атаки не найдена');
            return false;
        }

        if (!validateDefenseCard(defenseCard, attackCard)) {
            console.log('❌ Карта защиты слишком слабая');
            alert(`❌ Карта "${defenseCard.name}" (сила: ${defenseCard.power}) не может отбить "${attackCard.name}" (сила: ${attackCard.power})`);
            return false;
        }

        // Атомарно обновляем глобальное состояние: ставим карту в defenseSlots и убираем её из руки
        updateGame((prev) => {
            const newState = { ...prev };
            const defenseSlots = [...(prev.defenseSlots || [])];
            while (defenseSlots.length <= attackCardIndex) {
                defenseSlots.push(null);
            }
            // Запрещаем перезапись, если слот уже занят
            if (defenseSlots[attackCardIndex] !== null) {
                console.log(`❌ Слот защиты ${attackCardIndex} уже занят`);
                return prev;
            }
            defenseSlots[attackCardIndex] = defenseCard;

            // Удаляем карту из руки текущего игрока
            const myCards = [...(prev.hands[myId] || [])];
            if (handIndex !== undefined && handIndex >= 0 && handIndex < myCards.length && myCards[handIndex]?.id === defenseCard.id) {
                myCards.splice(handIndex, 1);
            } else {
                const idx = myCards.findIndex(c => c?.id === defenseCard.id);
                if (idx !== -1) myCards.splice(idx, 1);
            }

            // Обновляем активные фракции и очередь добора для защитника
            updateActiveFactionsFromDefenseCard(defenseCard);
            addToDrawQueue(myId, true);

            newState.hands = { ...prev.hands, [myId]: myCards };
            newState.defenseSlots = defenseSlots;
            
            // Инициализируем usedDefenseCardFactions для новой карты защиты
            if (!newState.usedDefenseCardFactions) {
                newState.usedDefenseCardFactions = {};
            }
            if (!newState.usedDefenseCardFactions[defenseCard.id]) {
                newState.usedDefenseCardFactions[defenseCard.id] = [];
            }
            
            return newState;
        });

        console.log(`✅ Карта "${defenseCard.name}" успешно отбила "${attackCard.name}"`);
        return true;
    };

    const tryDeclareWinner = (draft: GameState): GameState => {
        // Эта функция не должна вызываться при простом выставлении карты
        // Окончание игры проверяется только в checkGameEnd() после событий конца хода
        console.log('🎯 tryDeclareWinner вызвана - игнорируем');
        return draft;
    };


    const onRestartToLobby = () => {
        // Сбрасываем локальные состояния
        resetGameState();
        
        updateGame(() => ({
            phase: "lobby",
            hostId: myId,
            players: Object.fromEntries(
                Object.entries(game.players).map(([id, player]) => [id, player])
            ),
            hands: {},
            slots: [],
            defenseSlots: [],
            playerCountAtStart: undefined,
            winnerId: undefined,
            startedAt: undefined,
            
            // Role system
            playerRoles: {},
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
            firstPlayerInfo: undefined,
            
            // Card draw system
            deck: [],
            discardPile: [],
            maxHandSize: 6,
            cardsDrawnThisTurn: {},
            canDrawCards: false,
            
            // Faction system
            availableTargets: [],
            factionBonuses: {},
            targetSelectionMode: false,
            factionEffects: {},
            activeFactions: [],
            
            // Faction management
            factionCounter: {},
            activeFirstAttackFactions: [],
            usedDefenseCardFactions: {},
            displayActiveFactions: [],
            
            // Card power system
            minCardPower: 50,
            maxCardPower: 100,
            canDefendWithEqualPower: true,
            
            // Turn control system
            turnActions: {
                canEndTurn: false,
                canPass: false,
                canTakeCards: false,
                canAttack: false,
                canDefend: false,
            },
            turnHistory: [],
        }));
    };

    // Функция для получения эмодзи роли
    const getRoleEmoji = (role: 'attacker' | 'co-attacker' | 'defender' | 'observer'): string => {
        switch (role) {
            case 'attacker': return '⚔️';
            case 'co-attacker': return '🗡️';
            case 'defender': return '🛡️';
            case 'observer': return '👁️';
            default: return '❓';
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0b1020", color: "#fff" }}>
            {/* Header with players and game info */}
            <div style={{ padding: 8, background: "#101826", position: "sticky", top: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>🎮 Игровая доска</h2>
                        <button
                            onClick={onRestartToLobby}
                            className="game-button game-button-primary"
                            style={{
                                ...gameButtonStyle,
                                backgroundColor: '#ef4444',
                                border: "1px solid #ef4444",
                            }}
                        >
                            Завершить игру
                        </button>
                        
                        {/* Кнопка сенсора */}
                        <button
                            onClick={() => setShowSensorCircle(!showSensorCircle)}
                            className="game-button"
                            style={{
                                ...gameButtonStyle,
                                backgroundColor: showSensorCircle ? '#059669' : '#6b7280',
                                border: `1px solid ${showSensorCircle ? '#059669' : '#6b7280'}`,
                            }}
                        >
                            {showSensorCircle ? "Скрыть сенсор" : "Показать сенсор"}
                        </button>
                        
                        {/* Кнопки управления игрой */}
                        {game.gameInitialized && (
                            <>
                                {/* Режимы игры */}
                                <button
                                    onClick={() => setGameMode('attack')}
                                    className={`game-button ${gameMode === 'attack' ? 'game-button-attack' : 'game-button-secondary'}`}
                                    style={{
                                        ...gameButtonStyle,
                                        backgroundColor: gameMode === 'attack' ? '#dc2626' : '#374151',
                                        fontWeight: gameMode === 'attack' ? "bold" : "normal"
                                    }}
                                >
                                    ⚔️ Атака
                                </button>
                                <button
                                    onClick={() => setGameMode('defense')}
                                    className={`game-button ${gameMode === 'defense' ? 'game-button-defense' : 'game-button-secondary'}`}
                                    style={{
                                        ...gameButtonStyle,
                                        backgroundColor: gameMode === 'defense' ? '#1d4ed8' : '#374151',
                                        fontWeight: gameMode === 'defense' ? "bold" : "normal"
                                    }}
                                >
                                    🛡️ Защита
                                </button>
                                
                                {/* Кнопки для атакующих игроков */}
                                {getCurrentPlayerRole() === 'attacker' && (
                                    <>
                                        <button
                                            onClick={handleBito}
                                            disabled={!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.attackerBitoPressed || game.attackerPassed}
                                            className={`game-button ${(!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.attackerBitoPressed || game.attackerPassed) ? 'game-button-secondary' : 'game-button-bito'}`}
                                            style={{
                                                ...gameButtonStyle,
                                                backgroundColor: (!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.attackerBitoPressed || game.attackerPassed) ? '#374151' : '#f59e0b',
                                                fontWeight: "bold"
                                            }}
                                        >
                                            🚫 Бито
                                        </button>
                                        <button
                                            onClick={handlePas}
                                            disabled={!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.attackerPasPressed}
                                            className={`game-button ${(!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.attackerPasPressed) ? 'game-button-secondary' : 'game-button-pas'}`}
                                            style={{
                                                ...gameButtonStyle,
                                                backgroundColor: (!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.attackerPasPressed) ? '#374151' : '#ef4444',
                                                fontWeight: "bold"
                                            }}
                                        >
                                            🛑 Пас
                                        </button>
                                    </>
                                )}
                                
                                {getCurrentPlayerRole() === 'co-attacker' && (
                                    <>
                                        <button
                                            onClick={handleBito}
                                            disabled={!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.coAttackerBitoPressed || game.coAttackerPassed}
                                            className={`game-button ${(!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.coAttackerBitoPressed || game.coAttackerPassed) ? 'game-button-secondary' : 'game-button-bito'}`}
                                            style={{
                                                ...gameButtonStyle,
                                                backgroundColor: (!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.coAttackerBitoPressed || game.coAttackerPassed) ? '#374151' : '#f59e0b',
                                                fontWeight: "bold"
                                            }}
                                        >
                                            🚫 Бито
                                        </button>
                                        <button
                                            onClick={handlePas}
                                            disabled={!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.coAttackerPasPressed}
                                            className={`game-button ${(!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.coAttackerPasPressed) ? 'game-button-secondary' : 'game-button-pas'}`}
                                            style={{
                                                ...gameButtonStyle,
                                                backgroundColor: (!game.mainAttackerHasPlayed || hasUnbeatenCards() || game.coAttackerPasPressed) ? '#374151' : '#ef4444',
                                                fontWeight: "bold"
                                            }}
                                        >
                                            🛑 Пас
                                        </button>
                                    </>
                                )}
                                
                                {/* Кнопка для защитника */}
                                {getCurrentPlayerRole() === 'defender' && (
                                    <button
                                        onClick={() => {
                                            // TODO: Реализовать взятие карт защитником
                                            alert('🛡️ Функция "Взять карты" будет реализована в следующей фазе');
                                        }}
                                        className="game-button game-button-take"
                                        style={{
                                            ...gameButtonStyle,
                                            backgroundColor: '#10b981',
                                            fontWeight: "bold"
                                        }}
                                    >
                                        🛡️ Взять карты
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>
                        Карт в руке: {myHand.length} | Слотов на столе: {game.slots?.filter(s => s !== null).length || 0} | Колода: {game.deck?.length || 0} | Сброс: {game.discardPile?.length || 0}
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.5, marginTop: 2 }}>
                        🖱️ Сенсор: {gameMode === 'attack' ? 'ищет карты (защита > атака)' : 'ищет карты атаки'} | Радиус: 80px | Курсор: {mousePosition ? `${mousePosition.x}, ${mousePosition.y}` : 'нет'} | Активная карта: {activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Отладка: {showSensorCircle ? 'включена' : 'выключена'}
                    </div>
                </div>
                
                {/* Players with roles */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    {playerIds.map((pid) => {
                        const playerRole = game.playerRoles?.[pid];
                        return (
                            <div key={pid} style={{ 
                                padding: "4px 8px !important", 
                                borderRadius: 999, 
                                background: pid === myId ? "#065f46" : "#1f2937",
                                border: pid === myId ? "1px solid #10b981" : "1px solid #374151",
                                fontSize: 11
                            }}>
                            {game.players[pid]?.name || pid}
                            {pid === myId ? " • вы" : ""}
                            {pid === game.hostId ? " 👑" : ""}
                                {playerRole && <span style={{ marginLeft: 4 }}>{getRoleEmoji(playerRole)}</span>}
                        </div>
                        );
                    })}
                </div>
                
                {/* Game status */}
                {game.gameInitialized && (
                    <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7 }}>
                        <div>🎯 Приоритет: {game.attackPriority === 'attacker' ? '⚔️ Главный' : '🗡️ Со-атакующий'}</div>
                        <div>🎲 Играл: {game.mainAttackerHasPlayed ? '✅' : '❌'}</div>
                        {game.firstPlayerInfo && (
                            <div>🏆 Первый: {game.firstPlayerInfo.playerName}</div>
                        )}
                        {activeFactions.length > 0 && (
                            <div>⚔️ Фракции: {activeFactions.join(', ')}</div>
                        )}
                        {game.drawQueue && game.drawQueue.length > 0 && (
                            <div>🎯 Добор: {game.drawQueue.length}</div>
                        )}
                    </div>
                )}
            </div>


            {/* Center slots */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
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
                            🎮 Игровой стол:
                        </div>
                        
                        {/* Атакующие карты */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "14px", marginBottom: "8px", color: "#FFD700", textAlign: "center" }}>
                                ⚔️ Атакующие карты:
                            </div>
                            <DropZone
                                id="table"
                                cards={game.slots || []}
                                minVisibleCards={1}
                                gameMode={gameMode}
                                onCardClick={(index) => {
                                    console.log('Clicked table card:', index);
                                }}
                                onCardHover={handleAttackCardHover}
                                onCardLeave={handleAttackCardLeave}
                                highlightedCardIndex={hoveredAttackCard}
                                onMousePositionUpdate={() => {}}
                                activeCard={activeCard}
                                onDropZoneActivate={handleDropZoneActivate}
                                onDropZoneDeactivate={handleDropZoneDeactivate}
                                activeDropZone={activeDropZone}
                            />
                                    </div>

                        {/* Защитные карты */}
                        {(game.slots || []).filter(slot => slot !== null).length > 0 && (
                            <div>
                                <div style={{ fontSize: "14px", marginBottom: "8px", color: "#FFD700", textAlign: "center" }}>
                                    🛡️ Защитные карты:
                                    </div>
                                <DefenseZone
                                    attackCards={game.slots || []}
                                    defenseCards={game.defenseSlots || []}
                                    onCardClick={(attackIndex) => {
                                        console.log('Clicked defense card:', attackIndex);
                                    }}
                                    onCardHover={handleDefenseCardHover}
                                    onCardLeave={handleDefenseCardLeave}
                                    highlightedCardIndex={gameMode === 'defense' ? hoveredAttackCard : null}
                                    gameMode={gameMode}
                                    invalidDefenseCard={null}
                                    onDefenseCardHover={handleDefenseCardSlotHover}
                                    onDefenseCardLeave={handleDefenseCardSlotLeave}
                                    playerRole={getCurrentPlayerRole()}
                                    highlightedDefenseCardIndex={hoveredDefenseCard}
                                />
                                    </div>
                            )}
                </div>
            </div>

            {/* My hand */}
            <div style={{ padding: 16 }}>
                <div style={{ fontSize: "16px", marginBottom: "12px", color: "#FFD700", textAlign: "center" }}>
                    🃏 Мои карты:
                </div>
                <DropZone
                    id="my-hand"
                    cards={myHand}
                    maxVisibleCards={6}
                    gameMode={gameMode}
                />
            </div>

            {/* Game initialization modal */}
            {showGameInitialization && (
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
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#1f2937",
                        padding: 24,
                        borderRadius: 12,
                        textAlign: "center",
                        maxWidth: 400,
                        border: "2px solid #10b981"
                    }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#10b981" }}>
                            🎮 Игра началась!
                        </h2>
                        
                        {game.firstPlayerInfo && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 16, marginBottom: 8, color: "#FFD700" }}>
                                    Первый ход делает:
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                                    {game.firstPlayerInfo.playerName}
                                </div>
                                <div style={{ fontSize: 14, color: "#10b981", marginBottom: 8 }}>
                                    Карта: {game.firstPlayerInfo.cardName} (сила: {game.firstPlayerInfo.power})
                                </div>
                                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                                    Роль: {getRoleEmoji(game.playerRoles?.[game.firstPlayerInfo.playerId] || 'observer')} {
                                        game.playerRoles?.[game.firstPlayerInfo.playerId] === 'attacker' ? 'Главный атакующий' :
                                        game.playerRoles?.[game.firstPlayerInfo.playerId] === 'co-attacker' ? 'Со-атакующий' :
                                        game.playerRoles?.[game.firstPlayerInfo.playerId] === 'defender' ? 'Защитник' :
                                        'Наблюдатель'
                                    }
                                </div>
                            </div>
                        )}
                        
                        <div style={{ fontSize: 16, marginBottom: 16 }}>
                            <div style={{ marginBottom: 8 }}>
                                <strong>Ваша роль:</strong> {getRoleEmoji(getCurrentPlayerRole() || 'observer')} {
                                    getCurrentPlayerRole() === 'attacker' ? 'Главный атакующий' :
                                    getCurrentPlayerRole() === 'co-attacker' ? 'Со-атакующий' :
                                    getCurrentPlayerRole() === 'defender' ? 'Защитник' :
                                    'Наблюдатель'
                                }
                            </div>
                        </div>
                        
                        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
                            Модальное окно закроется автоматически через несколько секунд
                        </div>
                    <button
                            onClick={() => setShowGameInitialization(false)}
                        style={{
                                padding: "8px 16px",
                                background: "#10b981",
                            color: "#fff",
                                border: "none",
                                borderRadius: 6,
                            cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 500
                            }}
                        >
                            Понятно
                    </button>
                    </div>
            </div>
            )}

            <GameOverModal game={game} onRestartToLobby={onRestartToLobby} />
            
            {/* Визуальный индикатор сенсора - при зажатой карте или при включенной кнопке отладки */}
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
            
            <DragOverlay>
                {activeCard ? (
                    <div style={{
                        width: 120,
                        height: 160,
                        background: "#1f2937",
                        border: "2px solid #10b981",
                        borderRadius: 12,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        fontSize: 12,
                        textAlign: "center",
                        transform: "rotate(5deg)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    }}>
                        <div>
                            <div style={{ fontWeight: "bold", marginBottom: 4 }}>{activeCard.card.name}</div>
                            <div style={{ opacity: 0.7 }}>Power: {activeCard.card.power}</div>
                            <div style={{ opacity: 0.5, fontSize: 10 }}>
                                {getFactionNames(activeCard.card.factions).join(", ")}
                        </div>
                        </div>
            </div>
                ) : null}
            </DragOverlay>
        </div>
        </DndContext>
    );
}