import { useEffect } from 'react';
import type { GameState } from '../../../types';

/**
 * Хук для автоматической регистрации игроков
 * 
 * Регистрирует игрока при подключении и назначает хоста, если его еще нет
 * Синхронизируется с состоянием PlayroomKit для видимости всех игроков
 */
export const usePlayerRegistration = (
    myId: string,
    gameState: GameState,
    updateGame: (fn: (prev: GameState) => GameState) => void,
    playroomGameRef: React.MutableRefObject<GameState>
) => {
    useEffect(() => {
        if (!myId) return;
        
        // Используем playroomGameRef для получения актуального состояния
        const currentState = playroomGameRef.current;
        
        // Проверяем, зарегистрирован ли игрок
        const players = currentState.players || {};
        if (players[myId]) {
            // Игрок уже зарегистрирован - не обновляем состояние
            return;
        }
        
        // Регистрируем игрока только если его еще нет
        updateGame((prev) => {
            const players = prev.players || {};
            if (players[myId]) {
                // Игрок уже зарегистрирован
                return prev;
            }
            
            const newPlayers = { ...players };
            newPlayers[myId] = { name: `Player ${myId.slice(-4)}` };
            console.log(`✅ Игрок ${myId} зарегистрирован в GameBoardV3`);
            
            const next: GameState = { 
                ...prev, 
                players: newPlayers,
                // Назначаем хоста, если его еще нет
                hostId: prev.hostId || myId,
            };
            
            if (!prev.hostId) {
                console.log(`👑 Игрок ${myId} назначен хостом`);
            }
            
            return next;
        });
    }, [myId, gameState]); // Добавили gameState для синхронизации с другими игроками
};

