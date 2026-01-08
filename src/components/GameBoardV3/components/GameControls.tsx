import React from 'react';

interface GameControlsProps {
    gameInitialized: boolean;
    phase: string;
    effectiveGameMode: 'attack' | 'defense';
    playerRole: 'attacker' | 'co-attacker' | 'defender' | 'observer' | undefined;
    canTakeCards: boolean;
    canBito: boolean;
    canPas: boolean;
    attackPriority: 'attacker' | 'co-attacker';
    attackerBitoPressed: boolean;
    coAttackerBitoPressed: boolean;
    attackerPassed: boolean;
    coAttackerPassed: boolean;
    mainAttackerHasPlayed: boolean;
    playerCount: number;
    onStartGame: () => void;
    onRestartGame: () => void;
    onTakeCards: () => void;
    onBito: () => void;
    onPas: () => void;
    showSensorCircle: boolean;
    onToggleSensor: () => void;
    onBack?: () => void;
    myHandLength: number;
    slotsCount: number;
    deckLength: number;
}

/**
 * Компонент управления игрой
 * Отображает кнопки управления и информацию о игре
 */
export const GameControls: React.FC<GameControlsProps> = ({
    gameInitialized,
    phase,
    effectiveGameMode,
    playerRole,
    canTakeCards,
    canBito,
    canPas,
    attackPriority,
    attackerBitoPressed,
    coAttackerBitoPressed,
    attackerPassed,
    coAttackerPassed,
    mainAttackerHasPlayed,
    playerCount,
    onStartGame,
    onRestartGame,
    onTakeCards,
    onBito,
    onPas,
    showSensorCircle,
    onToggleSensor,
    onBack,
    myHandLength,
    slotsCount,
    deckLength,
}) => {
    return (
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
                    Карт в руке: {myHandLength} | Слотов на столе: {slotsCount} | Колода: {deckLength}
                </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {gameInitialized && (
                    <>
                        <div style={{ 
                            padding: "6px 12px",
                            background: effectiveGameMode === 'attack' ? "#dc2626" : "#1d4ed8",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: "#fff"
                        }}>
                            {effectiveGameMode === 'attack' ? '⚔️ Режим атаки' : '🛡️ Режим защиты'}
                            {playerRole === 'observer' && ' 👁️ Наблюдатель'}
                        </div>
                        
                        {/* Индикатор приоритета атаки */}
                        {(playerRole === 'attacker' || playerRole === 'co-attacker') && mainAttackerHasPlayed && (
                            <div style={{ 
                                padding: "6px 12px",
                                background: attackPriority === playerRole ? "#10b981" : "#6b7280",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "bold",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                            }}>
                                {attackPriority === 'attacker' ? '👑 Приоритет: Атакующий' : '🗡️ Приоритет: Со-атакующий'}
                                {playerRole === 'attacker' && attackerBitoPressed && ' (Бито ✓)'}
                                {playerRole === 'co-attacker' && coAttackerBitoPressed && ' (Бито ✓)'}
                            </div>
                        )}
                    </>
                )}
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button 
                        onClick={onTakeCards}
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
                    
                    {/* Кнопка Бито (для 2+ игроков) */}
                    {playerCount >= 2 && (playerRole === 'attacker' || playerRole === 'co-attacker') && (
                        <button 
                            onClick={onBito}
                            disabled={!canBito}
                            style={{
                                padding: "8px 12px",
                                background: canBito ? "#8b5cf6" : "#6b7280",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: canBito ? "pointer" : "not-allowed",
                                fontSize: "12px",
                                opacity: canBito ? 1 : 0.5,
                                position: "relative"
                            }}
                            title={
                                playerCount === 2 
                                    ? "Завершить ход" 
                                    : !canBito && playerRole === 'attacker' && attackerBitoPressed 
                                    ? "Вы уже нажали Бито" 
                                    : !canBito && playerRole === 'co-attacker' && coAttackerBitoPressed 
                                    ? "Вы уже нажали Бито" 
                                    : !canBito 
                                    ? "Бито недоступно" 
                                    : "Передать приоритет"
                            }
                        >
                            🚫 Бито {playerCount === 2 && "(Завершить ход)"}
                            {playerRole === 'attacker' && attackerBitoPressed && playerCount > 2 && (
                                <span style={{ 
                                    position: "absolute", 
                                    top: "-5px", 
                                    right: "-5px", 
                                    background: "#10b981", 
                                    borderRadius: "50%", 
                                    width: "16px", 
                                    height: "16px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    fontSize: "10px"
                                }}>✓</span>
                            )}
                            {playerRole === 'co-attacker' && coAttackerBitoPressed && playerCount > 2 && (
                                <span style={{ 
                                    position: "absolute", 
                                    top: "-5px", 
                                    right: "-5px", 
                                    background: "#10b981", 
                                    borderRadius: "50%", 
                                    width: "16px", 
                                    height: "16px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    fontSize: "10px"
                                }}>✓</span>
                            )}
                        </button>
                    )}
                    
                    {/* Кнопка Пас (только для 3+ игроков, только после нажатия Бито) */}
                    {playerCount >= 3 && (playerRole === 'attacker' || playerRole === 'co-attacker') && (
                        <button 
                            onClick={onPas}
                            disabled={!canPas}
                            style={{
                                padding: "8px 12px",
                                background: canPas ? "#3b82f6" : "#6b7280",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: canPas ? "pointer" : "not-allowed",
                                fontSize: "12px",
                                opacity: canPas ? 1 : 0.5,
                                position: "relative"
                            }}
                            title={
                                !canPas && playerRole === 'attacker' && attackerPassed 
                                    ? "Вы уже нажали Пас" 
                                    : !canPas && playerRole === 'co-attacker' && coAttackerPassed 
                                    ? "Вы уже нажали Пас" 
                                    : !canPas 
                                    ? "Сначала нажмите Бито" 
                                    : "Отказаться от атаки"
                            }
                        >
                            ✋ Пас
                            {playerRole === 'attacker' && attackerPassed && (
                                <span style={{ 
                                    position: "absolute", 
                                    top: "-5px", 
                                    right: "-5px", 
                                    background: "#10b981", 
                                    borderRadius: "50%", 
                                    width: "16px", 
                                    height: "16px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    fontSize: "10px"
                                }}>✓</span>
                            )}
                            {playerRole === 'co-attacker' && coAttackerPassed && (
                                <span style={{ 
                                    position: "absolute", 
                                    top: "-5px", 
                                    right: "-5px", 
                                    background: "#10b981", 
                                    borderRadius: "50%", 
                                    width: "16px", 
                                    height: "16px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    fontSize: "10px"
                                }}>✓</span>
                            )}
                        </button>
                    )}
                </div>
                
                {phase === "lobby" || !gameInitialized ? (
                    <button
                        onClick={onStartGame}
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
                        onClick={onRestartGame}
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
                    onClick={onToggleSensor}
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
    );
};

