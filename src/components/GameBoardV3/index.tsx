import React, { useState, useEffect, useRef } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useGameState } from './hooks/useGameState';
import { usePlayerRegistration } from './hooks/usePlayerRegistration';
import { useGameMode } from './hooks/useGameMode';
import { useCardDragDrop } from './hooks/useCardDragDrop';
import { createGame, restartGame } from './modules/gameInitialization';
import { getCurrentPlayerRole } from './modules/roleSystem';
import { checkCanTakeCards, handleTakeCards } from './modules/cardManagement';
import { handleBito, hasUnbeatenCards } from './modules/turnSystem';
import { rotateRolesAfterTakeCards } from './modules/roleSystem';
import { processDrawQueue } from './modules/drawQueue';
import { getFactionNames } from './modules/factionSystem';
import { FACTIONS } from '../../engine/cards';
import DropZone from '../DropZone';
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
    const { gameState, updateGame } = useGameState();
    
    // Регистрация игроков
    usePlayerRegistration(myId, gameState, updateGame);
    
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
    
    // Проверка возможности взять карты
    useEffect(() => {
        const role = getCurrentPlayerRole(gameState, myId);
        const canTake = checkCanTakeCards(gameState, myId, role);
        setCanTakeCards(canTake);
    }, [effectiveGameMode, gameState.slots, defenseCards, gameState, myId]);
    
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
        const hasUnbeaten = hasUnbeatenCards(gameState, defenseCards);
        const newState = handleBito(gameState, role, () => hasUnbeaten);
        
        if (newState) {
            updateGame(() => newState);
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
    const playerIds = Object.keys(gameState.players || {});
    const role = getCurrentPlayerRole(gameState, myId);
    
    // Собираем активные фракции для отображения
    const activeFirstAttackFactions = gameState.activeFirstAttackFactions || [];
    const factionCounter = gameState.factionCounter || {};
    const usedDefenseCardFactions = gameState.usedDefenseCardFactions || {};
    
    const allAvailableDefenseFactions: number[] = [];
    defenseCards.forEach(defenseCard => {
        if (defenseCard) {
            const availableDefenseFactions = defenseCard.factions.filter(factionId => {
                const usedFactions = usedDefenseCardFactions[defenseCard.id] || [];
                return !usedFactions.includes(factionId);
            });
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
    
    const getRoleEmoji = (role?: string): string => {
        switch (role) {
            case 'attacker': return '⚔️';
            case 'co-attacker': return '🗡️';
            case 'defender': return '🛡️';
            case 'observer': return '👁️';
            default: return '❓';
        }
    };
    
    const getRoleName = (role?: string): string => {
        switch (role) {
            case 'attacker': return 'Атакующий';
            case 'co-attacker': return 'Со-атакующий';
            case 'defender': return 'Защитник';
            case 'observer': return 'Наблюдатель';
            default: return 'Не назначена';
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
                        <h2 style={{ margin: 0, color: "#FFD700" }}>🎮 Game Board V3 (Модульная версия)</h2>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            Карт в руке: {myHand.length} | Слотов на столе: {gameState.slots?.filter(s => s !== null).length || 0} | Колода: {gameState.deck.length}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {gameState.gameInitialized && (
                            <div style={{ 
                                padding: "6px 12px",
                                background: effectiveGameMode === 'attack' ? "#dc2626" : "#1d4ed8",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                color: "#fff"
                            }}>
                                {effectiveGameMode === 'attack' ? '⚔️ Режим атаки' : '🛡️ Режим защиты'}
                                {role === 'observer' && ' 👁️ Наблюдатель'}
                            </div>
                        )}
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button 
                                onClick={handleTakeCardsClick}
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
                                onClick={handleBitoClick}
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
                                onClick={handleCreateGame}
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
                                onClick={handleRestartGame}
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
                        {playerIds.map((pid) => {
                            const playerRole = gameState.playerRoles?.[pid];
                            
                            return (
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
                                    {playerRole && (
                                        <span style={{ 
                                            opacity: 0.9,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            padding: "2px 6px",
                                            background: "rgba(59, 130, 246, 0.2)",
                                            borderRadius: "4px",
                                            border: "1px solid rgba(59, 130, 246, 0.3)"
                                        }}>
                                            {getRoleEmoji(playerRole)} {getRoleName(playerRole)}
                                        </span>
                                    )}
                                    <span style={{ opacity: 0.7 }}>
                                        ({gameState.hands[pid]?.length || 0} карт)
                                    </span>
                                </div>
                            );
                        })}
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
                                gameMode={effectiveGameMode}
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
                                gameMode={effectiveGameMode}
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
                    <div>🔄 Play V3 активен | {effectiveGameMode === 'attack' ? '⚔️ Режим атаки' : '🛡️ Режим защиты'} | 🃏 {myHand.length}/6 карт | 📚 Колода: {gameState.deck.length} карт | 🖱️ Drag & Drop активен</div>
                    <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.6 }}>
                        🎯 Отладка: activeCard={activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Наведение атаки={hoveredAttackCard !== null ? `карта ${hoveredAttackCard}` : 'нет'} | Наведение защиты={hoveredDefenseCard !== null ? `карта ${hoveredDefenseCard}` : 'нет'} | Мышь={mousePosition ? `${mousePosition.x},${mousePosition.y}` : 'нет'} | Защита={defenseCards.filter(card => card !== null).length} карт | Атака={gameState.slots?.filter(s => s !== null).length || 0} карт
                    </div>
                    <div style={{ marginTop: "2px", fontSize: "9px", opacity: 0.5, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        🖱️ Сенсор: {effectiveGameMode === 'attack' ? 'ищет карты (защита > атака)' : 'ищет карты атаки'} | Радиус: 80px | Курсор: {mousePosition ? `${mousePosition.x}, ${mousePosition.y}` : 'нет'} | Активная карта: {activeCard ? `${activeCard.card.name} (${activeCard.source})` : 'нет'} | Отладка: {showSensorCircle ? 'включена' : 'выключена'}
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

export default GameBoardV3;
