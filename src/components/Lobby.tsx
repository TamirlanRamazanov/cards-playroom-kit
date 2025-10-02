import type { GameState, Card } from "../types";
import { CARDS_DATA } from "../engine/cards";
import { useState } from "react";

interface Props {
    myId: string;
    game: GameState;
    updateGame: (updater: (prev: GameState) => GameState) => void;
}

export default function Lobby({ myId, game, updateGame }: Props) {
    const playerIds = Object.keys(game.players || {});
    const iAmHost = game.hostId === myId;
    const [playerCount, setPlayerCount] = useState<number>(4);
    const [showFirstPlayerModal, setShowFirstPlayerModal] = useState<boolean>(false);

    // Функция для случайного перемешивания колоды (без seed)
    const shuffleDeck = <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Функция для создания базового состояния игры
    const createBasicGameState = (playerCount: number): Partial<GameState> => {
        // Создаем полную колоду из всех карт и перемешиваем её случайно
        const shuffledDeck = shuffleDeck([...CARDS_DATA]);
        
        // Создаем игроков и раздаем карты в зависимости от количества
        const hands: GameState["hands"] = {};
        const turnOrder: string[] = [];
        
        for (let i = 0; i < playerIds.length; i++) {
            const playerId = playerIds[i];
            const playerCards = shuffledDeck.splice(0, 6);
            
            hands[playerId] = playerCards;
            turnOrder.push(playerId);
        }
        
        // Оставшиеся карты остаются в колоде
        const remainingDeck = shuffledDeck;
        
        console.log(`🎯 Создана колода из ${CARDS_DATA.length} карт`);
        console.log(`🎯 Раздано по 6 карт ${playerIds.length} игрокам`);
        console.log(`🎯 Осталось в колоде: ${remainingDeck.length} карт`);

        return {
            phase: "playing",
            hands,
            slots: new Array(6).fill(null),
            defenseSlots: new Array(6).fill(null),
            deck: remainingDeck,
            discardPile: [],
            playerCountAtStart: playerCount,
            winnerId: undefined,
            startedAt: Date.now(),
            
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
            
            // Turn system
            currentTurn: undefined,
            turnOrder: playerIds,
            currentTurnIndex: 0,
            turnPhase: "play",
            
            // Game mechanics
            attackingCard: null,
            defendingCard: null,
            attackTarget: undefined,
            canPass: false,
            canTakeCards: false,
            
            // Card draw system
            maxHandSize: 6,
            cardsDrawnThisTurn: {},
            canDrawCards: false,
            
            // Faction system
            availableTargets: playerIds,
            factionBonuses: {},
            targetSelectionMode: false,
            selectedTarget: undefined,
            factionEffects: {},
            activeFactions: [],
            
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
        };
    };

    // Функция для определения первого игрока (по слабейшей карте)
    const determineFirstPlayer = (hands: GameState["hands"]): {playerId: string, playerName: string, cardName: string, power: number} => {
        let weakestPlayer = { playerId: '', playerName: '', cardName: '', power: 1000 };
        
        Object.entries(hands).forEach(([playerId, playerHand]) => {
            if (playerHand.length > 0) {
                const weakestCard = playerHand.reduce((weakest, card) => 
                    card.power < weakest.power ? card : weakest
                );
                
                if (weakestCard.power < weakestPlayer.power) {
                    const playerName = game.players[playerId]?.name || `Игрок ${playerId}`;
                    weakestPlayer = {
                        playerId,
                        playerName,
                        cardName: weakestCard.name,
                        power: weakestCard.power
                    };
                }
            }
        });
        
        return weakestPlayer;
    };

    // Функция для назначения ролей игрокам
    const assignPlayerRoles = (firstPlayerId: string, playerCount: number): Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> => {
        const roles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'> = {};
        const playerIds = Object.keys(game.players || {});
        
        if (playerCount === 2) {
            // 2 игрока: атакующий и защитник
            roles[firstPlayerId] = 'attacker';
            const defenderId = playerIds.find(id => id !== firstPlayerId);
            if (defenderId) roles[defenderId] = 'defender';
        } else if (playerCount === 3) {
            // 3 игрока: атакующий, защитник, со-атакующий
            roles[firstPlayerId] = 'attacker';
            const firstIndex = playerIds.indexOf(firstPlayerId);
            const defenderId = playerIds[(firstIndex + 1) % playerIds.length];
            const coAttackerId = playerIds[(firstIndex + 2) % playerIds.length];
            roles[defenderId] = 'defender';
            roles[coAttackerId] = 'co-attacker';
        } else {
            // 4+ игроков: атакующий, защитник, со-атакующий, остальные наблюдатели
            roles[firstPlayerId] = 'attacker';
            const firstIndex = playerIds.indexOf(firstPlayerId);
            const defenderId = playerIds[(firstIndex + 1) % playerIds.length];
            const coAttackerId = playerIds[(firstIndex + 2) % playerIds.length];
            roles[defenderId] = 'defender';
            roles[coAttackerId] = 'co-attacker';
            
            // Остальные игроки - наблюдатели
            playerIds.forEach(id => {
                if (!roles[id]) {
                    roles[id] = 'observer';
                }
            });
        }
        
        return roles;
    };

    const startGame = () => {
        // Host only (simple guard)
        if (!iAmHost) return;
        if (playerIds.length < 2) {
            alert('Минимум 2 игрока для начала игры!');
            return;
        }

        // Создаем базовое состояние игры
        const basicState = createBasicGameState(playerCount);
        
        // Определяем первого игрока
        const firstPlayer = determineFirstPlayer(basicState.hands!);
        
        // Назначаем роли
        const roles = assignPlayerRoles(firstPlayer.playerId, playerCount);

        updateGame((prev) => ({
            ...prev,
            ...basicState,
            playerRoles: roles,
            firstPlayerInfo: firstPlayer,
            gameInitialized: true,
        }));

        // Показываем модальное окно с первым игроком
        setShowFirstPlayerModal(true);
        
        // Автоматически закрываем через 6 секунд
        setTimeout(() => {
            setShowFirstPlayerModal(false);
        }, 6000);
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
        <div style={{ minHeight: "100vh", padding: 24, background: "#0b1020", color: "#fff" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>🎮 Лобби игры</h1>
                
                {/* Настройки игры */}
                <div style={{ padding: 16, background: "#11172e", borderRadius: 12, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>⚙️ Настройки игры</h3>
                    
                    {/* Выбор количества игроков */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 14, opacity: 0.8 }}>
                            Количество игроков:
                        </label>
                        <select
                            value={playerCount}
                            onChange={(e) => setPlayerCount(Number(e.target.value))}
                            disabled={!iAmHost}
                            style={{
                                padding: "6px 12px",
                                background: "#1f2937",
                                color: "#fff",
                                border: "1px solid #374151",
                                borderRadius: 6,
                                fontSize: 14,
                                cursor: iAmHost ? "pointer" : "not-allowed",
                                opacity: iAmHost ? 1 : 0.5
                            }}
                        >
                            <option value={2}>2 игрока</option>
                            <option value={3}>3 игрока</option>
                            <option value={4}>4 игрока</option>
                            <option value={5}>5 игроков</option>
                            <option value={6}>6 игроков</option>
                        </select>
                    </div>
                    
                    {/* Информация о ролях */}
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
                        <div>🎯 Роли: ⚔️ Главный атакующий → 🛡️ Защитник → 🗡️ Со-атакующий → 👁️ Наблюдатели</div>
                        <div>🎲 Первый игрок определяется по слабейшей карте</div>
                    </div>
                </div>

                {/* Список игроков */}
                <div style={{ padding: 16, background: "#11172e", borderRadius: 12 }}>
                    <div style={{ opacity: 0.7, marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                        👥 Игроки ({playerIds.length}):
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {playerIds.length === 0 && <li style={{ opacity: 0.6 }}>Пока никого…</li>}
                        {playerIds.map((pid) => {
                            const playerRole = game.playerRoles?.[pid];
                            return (
                                <li key={pid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: pid === myId ? "#4ade80" : "#6b7280" }} />
                                    <span style={{ opacity: pid === myId ? 1 : 0.7 }}>
                                        {game.players[pid]?.name || pid}
                                        {pid === game.hostId && <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.6 }}>(хост)</span>}
                                        {playerRole && <span style={{ marginLeft: 8, fontSize: 14 }}>{getRoleEmoji(playerRole)}</span>}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    
                    {/* Кнопка начала игры */}
                    {iAmHost && (
                        <button
                            onClick={startGame}
                            disabled={playerIds.length < 2}
                            style={{
                                marginTop: 16,
                                padding: "10px 20px",
                                background: playerIds.length < 2 ? "#374151" : "#10b981",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                cursor: playerIds.length < 2 ? "not-allowed" : "pointer",
                                fontSize: 16,
                                fontWeight: 600,
                                width: "100%",
                                transition: "all 0.2s ease"
                            }}
                        >
                            🚀 Начать игру
                        </button>
                    )}
                    
                    {!iAmHost && (
                        <div style={{ marginTop: 16, padding: 12, background: "#1f2937", borderRadius: 6, textAlign: "center", opacity: 0.7 }}>
                            ⏳ Ожидаем начала игры от хоста...
                        </div>
                    )}
                </div>

                {/* Модальное окно с первым игроком */}
                {showFirstPlayerModal && game.firstPlayerInfo && (
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
                                🎯 Первый игрок определен!
                            </h2>
                            <div style={{ fontSize: 16, marginBottom: 16 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>{game.firstPlayerInfo.playerName}</strong>
                                </div>
                                <div style={{ opacity: 0.8 }}>
                                    Слабейшая карта: <strong>{game.firstPlayerInfo.cardName}</strong> (сила: {game.firstPlayerInfo.power})
                                </div>
                            </div>
                            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>
                                Роль: ⚔️ Главный атакующий
                            </div>
                            <button
                                onClick={() => setShowFirstPlayerModal(false)}
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
            </div>
        </div>
    );
}
