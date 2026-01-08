import React, { useState, useEffect, useRef } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useGameState } from './hooks/useGameState';
import { usePlayerRegistration } from './hooks/usePlayerRegistration';
import { useGameMode } from './hooks/useGameMode';
import { useCardDragDrop } from './hooks/useCardDragDrop';
import { createGame, restartGame } from './modules/gameInitialization';
import { getCurrentPlayerRole } from './modules/roleSystem';
import { checkCanTakeCards, handleTakeCards } from './modules/cardManagement';
import { handleBito, hasUnbeatenCards, canPressBito, checkTurnComplete } from './modules/turnSystem';
import { rotateRolesAfterTakeCards } from './modules/roleSystem';
import { processDrawQueue } from './modules/drawQueue';
import { GameControls } from './components/GameControls';
import { PlayersInfo } from './components/PlayersInfo';
import { GameTable } from './components/GameTable';
import { PlayerHand } from './components/PlayerHand';
import { ActiveFactions } from './components/ActiveFactions';
import { DebugInfo } from './components/DebugInfo';
import DefenseZone from '../DefenseZone';
import type { Card } from '../../types';

interface GameBoardV3Props {
    myId: string;
    onBack?: () => void;
}

/**
 * GameBoardV3 - Модульная версия игрового поля
 * 
 * Эта версия разделена на логические модули для лучшей поддерживаемости:
 * - hooks/ - кастомные хуки для управления состоянием
 * - modules/ - логические модули игры
 * - utils/ - утилиты
 * - components/ - UI компоненты
 */
const GameBoardV3: React.FC<GameBoardV3Props> = ({ myId, onBack }) => {
    // Управление состоянием игры
    const { gameState, updateGame, playroomGameRef } = useGameState();
    
    // Регистрация игроков
    usePlayerRegistration(myId, gameState, updateGame, playroomGameRef);
    
    // Определяем режим игры
    const effectiveGameMode = useGameMode(gameState, myId, 'attack');
    
    // Локальные UI состояния
    const [defenseCards, setDefenseCards] = useState<(Card | null)[]>([]);
    const [hoveredAttackCard, setHoveredAttackCard] = useState<number | null>(null);
    const [hoveredDefenseCard, setHoveredDefenseCard] = useState<number | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [showSensorCircle, setShowSensorCircle] = useState<boolean>(false);
    const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
    const [dropZoneTimeout, setDropZoneTimeout] = useState<number | null>(null);
    const [invalidDefenseCard] = useState<number | null>(null);
    const [canTakeCards, setCanTakeCards] = useState<boolean>(false);
    
    const isUpdatingDefenseCardsRef = useRef<boolean>(false);
    
    // Drag & Drop
    const { activeCard, handleDragStart, handleDragEnd } = useCardDragDrop(
        gameState,
        myId,
        effectiveGameMode,
        defenseCards,
        hoveredDefenseCard,
        hoveredAttackCard,
        updateGame,
        setDefenseCards,
        isUpdatingDefenseCardsRef
    );
    
    // Синхронизация defenseCards с gameState.defenseSlots
    useEffect(() => {
        if (!isUpdatingDefenseCardsRef.current) {
            const slots = gameState.defenseSlots || [];
            if (JSON.stringify(slots) !== JSON.stringify(defenseCards)) {
                setDefenseCards(slots);
            }
        }
    }, [gameState.defenseSlots]);
    
    // Синхронизация размера defenseCards с количеством карт атаки
    useEffect(() => {
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
    }, [gameState.slots]);
    
    // Состояние для кнопки "Бито"
    const [canBito, setCanBito] = useState<boolean>(false);
    
    // Проверка возможности взять карты
    useEffect(() => {
        const role = getCurrentPlayerRole(gameState, myId);
        const canTake = checkCanTakeCards(gameState, myId, role);
        setCanTakeCards(canTake);
    }, [effectiveGameMode, gameState.slots, defenseCards, gameState, myId]);
    
    // Проверка возможности нажать Бито
    useEffect(() => {
        const role = getCurrentPlayerRole(gameState, myId);
        const hasUnbeaten = hasUnbeatenCards(gameState, defenseCards);
        const canPress = canPressBito(gameState, role, () => hasUnbeaten);
        setCanBito(canPress);
    }, [gameState.slots, gameState.defenseSlots, gameState.mainAttackerHasPlayed, gameState.attackerBitoPressed, gameState.coAttackerBitoPressed, gameState.attackerPassed, gameState.coAttackerPassed, gameState.players, defenseCards, myId]);
    
    // Глобальный сенсор для карт (как в GameBoardV2)
    useEffect(() => {
        if (activeCard && activeCard.source === 'hand') {
            const handleGlobalMouseMove = (e: MouseEvent) => {
                const clientX = e.clientX;
                const clientY = e.clientY;
                const sensorRadius = 80;
                
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
                    
                    if (effectiveGameMode === 'attack' && defenseCards[defenseIndex] === null) {
                        return;
                    }
                    
                    if (distance < closestDefenseDistance) {
                        closestDefenseDistance = distance;
                        closestDefenseCard = element;
                    }
                });
                
                // Активируем ховер в зависимости от режима
                if (effectiveGameMode === 'defense') {
                    if (closestAttackCard && closestAttackDistance <= sensorRadius) {
                        const attackIndex = parseInt((closestAttackCard as Element).getAttribute('data-card-index') || '0');
                        setHoveredAttackCard(attackIndex);
                        setHoveredDefenseCard(null);
                        setActiveDropZone('attack-card');
                    } else {
                        setHoveredAttackCard(null);
                        setHoveredDefenseCard(null);
                        setActiveDropZone(null);
                    }
                } else if (effectiveGameMode === 'attack') {
                    if (activeDropZone) {
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
    }, [effectiveGameMode, activeCard, defenseCards, gameState.slots, activeDropZone]);
    
    // Очистка таймаута при размонтировании
    useEffect(() => {
        return () => {
            if (dropZoneTimeout) {
                clearTimeout(dropZoneTimeout);
            }
        };
    }, [dropZoneTimeout]);
    
    // Обработчики действий
    const handleCreateGame = () => {
        const newState = createGame(gameState, myId);
        if (newState) {
            updateGame(() => newState);
        }
    };
    
    const handleRestartGame = () => {
        const newState = restartGame(gameState, myId);
        updateGame(() => newState);
        setDefenseCards([]);
    };
    
    const handleTakeCardsClick = () => {
        const role = getCurrentPlayerRole(gameState, myId);
        if (role !== 'defender') {
            alert('❌ Только защитник может взять карты');
            return;
        }
        
        if (!canTakeCards) {
            return;
        }
        
        const newState = handleTakeCards(
            gameState,
            myId,
            rotateRolesAfterTakeCards,
            processDrawQueue
        );
        
        updateGame(() => newState);
        setDefenseCards([]);
        alert('✅ Взято карт со стола! Роли обновлены.');
    };
    
    const handleBitoClick = () => {
        const role = getCurrentPlayerRole(gameState, myId);
        
        // Детальные проверки с сообщениями (как в GameBoardV2)
        if (!role || (role !== 'attacker' && role !== 'co-attacker')) {
            console.log('❌ Только атакующие игроки могут нажимать Бито');
            alert('❌ Только атакующие игроки могут нажимать Бито');
            return;
        }
        
        if (!gameState.mainAttackerHasPlayed) {
            console.log('❌ Главный атакующий должен сначала подкинуть хотя бы одну карту');
            alert('❌ Главный атакующий должен сначала подкинуть хотя бы одну карту');
            return;
        }
        
        const hasUnbeaten = hasUnbeatenCards(gameState, defenseCards);
        console.log('🎯 Проверка Бито - есть ли неотбитые карты:', hasUnbeaten);
        if (hasUnbeaten) {
            console.log('❌ Нельзя нажимать Бито пока есть неотбитые карты на столе');
            alert('❌ Нельзя нажимать Бито пока есть неотбитые карты на столе');
            return;
        }
        
        // Проверка, не заблокирована ли кнопка
        if (role === 'attacker' && gameState.attackerBitoPressed) {
            console.log('❌ Кнопка Бито уже нажата главным атакующим');
            return;
        }
        if (role === 'co-attacker' && gameState.coAttackerBitoPressed) {
            console.log('❌ Кнопка Бито уже нажата со-атакующим');
            return;
        }
        
        const newState = handleBito(gameState, role, () => hasUnbeaten);
        
        if (newState) {
            updateGame(() => newState);
            const newPriority = newState.attackPriority === 'attacker' ? 'главному атакующему' : 'со-атакующему';
            console.log(`✅ Бито: приоритет передан ${newPriority}`);
            
            // Проверяем, завершился ли ход (оба нажали Бито)
            if (checkTurnComplete(newState, defenseCards)) {
                console.log('🎯 Ход завершен - оба атакующих нажали Бито');
                alert('🎯 Ход завершен! Оба атакующих нажали Бито. Карты отбиты.');
                // Здесь можно добавить логику завершения хода (очистка стола, добор карт)
            } else {
                alert(`✅ Бито: приоритет передан ${newPriority}`);
            }
        } else {
            console.log('❌ Не удалось выполнить Бито');
        }
    };
    
    // Функции ховера (пустые - ховер обрабатывается глобальным сенсором)
    const handleAttackCardHover = (_index: number) => {};
    const handleAttackCardLeave = () => {};
    const handleDefenseCardHover = (_index: number) => {};
    const handleDefenseCardLeave = () => {};
    
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
    
    const myHand = gameState.hands[myId] || [];
    const role = getCurrentPlayerRole(gameState, myId);
    
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
                <GameControls
                    gameInitialized={gameState.gameInitialized || false}
                    phase={gameState.phase}
                    effectiveGameMode={effectiveGameMode}
                    playerRole={role}
                    canTakeCards={canTakeCards}
                    canBito={canBito}
                    attackPriority={gameState.attackPriority}
                    attackerBitoPressed={gameState.attackerBitoPressed || false}
                    coAttackerBitoPressed={gameState.coAttackerBitoPressed || false}
                    mainAttackerHasPlayed={gameState.mainAttackerHasPlayed || false}
                    onStartGame={handleCreateGame}
                    onRestartGame={handleRestartGame}
                    onTakeCards={handleTakeCardsClick}
                    onBito={handleBitoClick}
                    showSensorCircle={showSensorCircle}
                    onToggleSensor={() => setShowSensorCircle(!showSensorCircle)}
                    onBack={onBack}
                    myHandLength={myHand.length}
                    slotsCount={gameState.slots?.filter(s => s !== null).length || 0}
                    deckLength={gameState.deck.length}
                />
                
                {/* Players Info */}
                <PlayersInfo
                    gameState={gameState}
                    currentPlayerId={myId}
                />
                
                {/* Game Board */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", overflow: "auto" }}>
                    <div style={{ textAlign: "center", width: "100%" }}>
                        <h3 style={{ color: "#10B981", marginBottom: "20px" }}>
                            🎯 Игровой стол
                        </h3>
                        
                        {/* Контейнер для дива защиты с абсолютно позиционированными фракциями */}
                        <div style={{ position: "relative", marginBottom: "20px", width: "100%", display: "flex", justifyContent: "center" }}>
                            {/* Активные фракции - абсолютно позиционированы слева */}
                            <ActiveFactions
                                gameState={gameState}
                                defenseCards={defenseCards}
                            />
                            
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
                                gameMode={effectiveGameMode}
                                invalidDefenseCard={invalidDefenseCard}
                            />
                        </div>
                        
                        {/* Игровой стол */}
                        <GameTable
                            slots={gameState.slots || []}
                            gameMode={effectiveGameMode}
                            hoveredAttackCard={hoveredAttackCard}
                            activeCard={activeCard}
                            mousePosition={mousePosition}
                            activeDropZone={activeDropZone}
                            onCardClick={(index) => {
                                console.log('Clicked table card:', index);
                            }}
                            onCardHover={handleAttackCardHover}
                            onCardLeave={handleAttackCardLeave}
                            onMousePositionUpdate={setMousePosition}
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
                            dropZoneTimeout={dropZoneTimeout}
                            defenseCardsCount={defenseCards.filter(card => card !== null).length}
                        />
                    </div>
                </div>
                
                {/* My hand - внизу экрана */}
                <PlayerHand
                    cards={myHand}
                    defenseCards={defenseCards}
                    activeCard={activeCard}
                    onMousePositionUpdate={setMousePosition}
                />
                
                {/* Debug Info */}
                <DebugInfo
                    effectiveGameMode={effectiveGameMode}
                    myHandLength={myHand.length}
                    deckLength={gameState.deck.length}
                    activeCard={activeCard}
                    hoveredAttackCard={hoveredAttackCard}
                    hoveredDefenseCard={hoveredDefenseCard}
                    mousePosition={mousePosition}
                    defenseCardsCount={defenseCards.filter(card => card !== null).length}
                    slotsCount={gameState.slots?.filter(s => s !== null).length || 0}
                    showSensorCircle={showSensorCircle}
                />
                
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

export default GameBoardV3;
