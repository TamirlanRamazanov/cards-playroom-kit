import React from 'react';
import { FACTIONS } from '../../../engine/cards';
import { getFactionNames } from '../modules/factionSystem';
import type { GameState } from '../../../types';
import type { Card } from '../../../types';

interface ActiveFactionsProps {
    gameState: GameState;
    defenseCards: (Card | null)[];
}

/**
 * Компонент активных фракций
 * Отображает список активных фракций с их счетчиками
 */
export const ActiveFactions: React.FC<ActiveFactionsProps> = ({
    gameState,
    defenseCards,
}) => {
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
    
    if (allActiveFactionNames.length === 0) {
        return null;
    }
    
    return (
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
                                        {allActiveFactionNames.map((faction: string, index: number) => {
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
};

