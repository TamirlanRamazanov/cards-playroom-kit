import React from 'react';
import { useGameState } from './hooks/useGameState';
import { usePlayerRegistration } from './hooks/usePlayerRegistration';

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

    if (!myId) {
        return (
            <div style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1a1a2e",
                color: "#fff"
            }}>
                Подключение к комнате...
            </div>
        );
    }

    return (
        <div style={{
            width: "100vw",
            height: "100vh",
            background: "#1a1a2e",
            color: "#fff",
            padding: "20px",
            boxSizing: "border-box"
        }}>
            <div style={{ marginBottom: "20px" }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: "10px 20px",
                        background: "#e94560",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "16px"
                    }}
                >
                    ← Назад в меню
                </button>
            </div>
            
            <div style={{
                padding: "20px",
                background: "#16213e",
                borderRadius: "12px",
                border: "2px solid #0f3460"
            }}>
                <h1 style={{ marginTop: 0 }}>🎮 GameBoard V3 (Модульная версия)</h1>
                <p>Эта версия использует модульную архитектуру для лучшей поддерживаемости.</p>
                <p><strong>Статус:</strong> В разработке</p>
                <p><strong>Игроков:</strong> {Object.keys(gameState.players || {}).length}</p>
                <p><strong>Фаза:</strong> {gameState.phase}</p>
            </div>
        </div>
    );
};

export default GameBoardV3;

