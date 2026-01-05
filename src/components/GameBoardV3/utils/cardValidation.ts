import type { Card } from '../../../types';

/**
 * Валидация карты защиты
 * Проверяет, что карта защиты имеет достаточную силу для защиты от карты атаки
 */
export const validateDefenseCard = (defenseCard: Card, attackCard: Card): boolean => {
    return defenseCard.power >= attackCard.power;
};

/**
 * Проверка валидности карты защиты при наведении
 */
export const checkDefenseCardValidity = (defenseCard: Card, attackCardIndex: number, attackCards: (Card | null)[]): boolean => {
    const attackCard = attackCards[attackCardIndex];
    if (!attackCard) return false;
    return validateDefenseCard(defenseCard, attackCard);
};

/**
 * Валидация карты атаки
 * Проверяет, что карта атаки соответствует правилам игры
 */
export const validateAttackCard = (
    card: Card,
    isFirstAttackCard: boolean,
    activeFirstAttackFactions: number[]
): { isValid: boolean; reason?: string } => {
    if (isFirstAttackCard) {
        return { isValid: true };
    }
    if (activeFirstAttackFactions.length === 0) {
        return { isValid: false, reason: "Нет активных фракций первой карты атаки" };
    }
    
    // Проверяем, есть ли общие фракции
    const hasCommonFactions = card.factions.some(factionId => 
        activeFirstAttackFactions.includes(factionId)
    );
    
    if (!hasCommonFactions) {
        const cardFactionNames = card.factions.map(id => {
            // Здесь можно добавить маппинг ID на названия, если нужно
            return `Faction ${id}`;
        });
        const activeFirstAttackFactionNames = activeFirstAttackFactions.map(id => `Faction ${id}`);
        return { 
            isValid: false, 
            reason: `Карта должна иметь хотя бы одну общую фракцию с активными фракциями первой карты атаки: ${activeFirstAttackFactionNames.join(', ')}. У карты: ${cardFactionNames.join(', ')}` 
        };
    }
    
    return { isValid: true };
};

