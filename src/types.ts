export interface Card {
    id: number;
    name: string;
    power: number;
    factions: number[];
    image: string;
}

export type PlayersMap = Record<string, { name: string }>; // playerId -> profile

export interface GameState {
    phase: "lobby" | "playing" | "gameover";
    hostId?: string; // first player who joined (simplest host logic)
    players: PlayersMap; // all known players (by our own shared-state registry)
    hands: Record<string, Card[]>; // playerId -> hand (cards)
    slots: (Card | null)[]; // center slots (length equals number of players at start)
    defenseSlots: (Card | null)[]; // slots for defense cards (aligned with attack slots)
    playerCountAtStart?: number; // fixed at start
    winnerId?: string; // set when someone collects all cards
    startedAt?: number;
    
    // Turn system
    currentTurn?: string; // playerId whose turn it is
    turnOrder?: string[]; // order of players for turns
    currentTurnIndex?: number; // index in turnOrder
    turnPhase?: "draw" | "play" | "attack" | "defend" | "end"; // текущая фаза хода
    
    // Game mechanics
    attackingCard?: Card | null; // card that is currently attacking
    defendingCard?: Card | null; // card that is defending
    attackTarget?: string; // playerId being attacked
    canPass?: boolean; // whether current player can pass
    canTakeCards?: boolean; // whether current player can take cards
    
    // Card draw system
    deck: Card[]; // remaining cards in deck
    discardPile: Card[]; // discarded cards
    maxHandSize: number; // maximum cards in hand
    cardsDrawnThisTurn: Record<string, number>; // cards drawn by each player this turn
    canDrawCards: boolean; // whether current player can draw cards
    
    // Faction system
    availableTargets: string[]; // playerIds that can be targeted
    factionBonuses: Record<number, number>; // faction -> bonus power
    targetSelectionMode: boolean; // whether player is selecting attack target
    selectedTarget?: string; // currently selected target for attack
    factionEffects: Record<number, string[]>; // faction -> list of effect descriptions
    activeFactions: number[]; // currently active factions on the table
    
    // Faction management (moved from local state)
    factionCounter: Record<number, number>; // faction -> count
    activeFirstAttackFactions: number[]; // фракции первой карты атаки
    usedDefenseCardFactions: Record<string, number[]>; // cardId -> used factionIds
    displayActiveFactions: string[]; // отображаемые активные фракции для UI
    defenseFactionsBuffer: Record<number, number>; // буфер фракций защиты
    
    // Card power system
    minCardPower: number; // минимальная сила карты (50)
    maxCardPower: number; // максимальная сила карты (100)
    canDefendWithEqualPower: boolean; // может ли карта с равной силой защищаться
    
    // Turn control system
    turnActions: {
        canEndTurn: boolean; // может ли игрок завершить ход
        canPass: boolean; // может ли игрок пасовать
        canTakeCards: boolean; // может ли игрок брать карты
        canAttack: boolean; // может ли игрок атаковать
        canDefend: boolean; // может ли игрок защищаться
    };
    turnHistory: Array<{
        playerId: string;
        action: string;
        timestamp: number;
        details?: any;
    }>;
    
    // Role system (from DebugGameBoard)
    playerRoles: Record<string, 'attacker' | 'co-attacker' | 'defender' | 'observer'>; // роли игроков
    attackPriority: 'attacker' | 'co-attacker'; // кто имеет приоритет атаки
    mainAttackerHasPlayed: boolean; // подкинул ли главный атакующий хотя бы одну карту
    attackerPassed: boolean; // отказался ли главный атакующий от подкидывания
    coAttackerPassed: boolean; // отказался ли со-атакующий от подкидывания
    
    // Button states
    attackerBitoPressed: boolean; // нажал ли главный атакующий Бито
    coAttackerBitoPressed: boolean; // нажал ли со-атакующий Бито
    attackerPasPressed: boolean; // нажал ли главный атакующий Пас
    coAttackerPasPressed: boolean; // нажал ли со-атакующий Пас
    
    // Draw queue system
    drawQueue: string[]; // очередь игроков для добора карт
    
    // Game initialization
    gameInitialized: boolean; // инициализирована ли игра
    firstPlayerInfo?: { // информация о первом игроке
        playerId: string;
        playerName: string;
        cardName: string;
        power: number;
    };
}
