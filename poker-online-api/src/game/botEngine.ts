import { evaluateHand, HandCategory } from './handEvaluator.js'
import type { PlayerAction } from './gameEngine.js'
import type { Room } from './room.js'
import type { Player } from './player.js'

export function calculateBotAction(room: Room, bot: Player): PlayerAction {
  const canCheck = bot.currentBet === room.currentBetLevel;
  const toCall = room.currentBetLevel - bot.currentBet;
  const personality = bot.botPersonality || 'balanced';
  
  // Basic Hand Strength Evaluator (0 to 100+)
  let strength = 0;
  
  if (room.communityCards.length === 0) {
    // Pre-flop logic
    // Just look at the highest 2 cards even in Omaha for simplicity of the bot
    const ranks = bot.holeCards.map(c => c.rank).sort((a, b) => b - a);
    if (ranks[0] === ranks[1]) {
      strength = ranks[0] * 3; // Pair (e.g. AA = 42)
    } else {
      strength = ranks[0] + (ranks[1] * 0.5); // (e.g. AK = 14 + 6.5 = 20.5)
    }
  } else {
    // Post-flop logic: evaluate actual hand
    // HandCategory ranges from 0 (High Card) to 8 (Straight Flush)
    try {
      const evaluation = evaluateHand(bot.holeCards, room.communityCards, room.variant);
      strength = evaluation.category * 15; 
      
      // If just high card or pair, boost slightly by rank
      if (evaluation.category <= HandCategory.Pair) {
        strength += evaluation.ranks[0] * 0.5;
      }
    } catch (e) {
      strength = 10; // Fallback
    }
  }
  
  // Apply Personality Modifiers
  if (personality === 'aggressive') strength *= 1.4;
  if (personality === 'conservative') strength *= 0.7;
  
  // Add some randomness (bluffing/mistakes factor)
  const randomFactor = Math.random() * 20; 
  const finalScore = strength + randomFactor;

  // Decision Tree
  if (toCall > 0) {
    // Facing a bet
    if (finalScore < 25) {
      return { type: 'fold' };
    }
    // Raise if strong hand
    if (finalScore > 65 && bot.chips > toCall * 2) {
      // Small raise
      return { type: 'raise', amount: room.currentBetLevel + room.bigBlind * 2 };
    }
    return { type: 'call' };
  } else {
    // Can check (no bets to call)
    if (finalScore > 70 && bot.chips > room.bigBlind) {
       return { type: 'raise', amount: room.currentBetLevel + room.bigBlind * 2 };
    }
    return { type: 'check' };
  }
}
