import { CardAnalysis, MatchAnalysis } from '@firestone-hs/replay-metadata';
import { InternalArenaMatchStatsDbRow } from '../internal-model';
import { ArenaCardData, ArenaCardStat } from '../model';

export const buildCardStats = (rows: readonly InternalArenaMatchStatsDbRow[]): readonly ArenaCardStat[] => {
	const cards: { [cardId: string]: { [context: string]: ArenaCardData } } = {};
	for (const row of rows) {
		const matchAnalysis: MatchAnalysis = JSON.parse(row.matchAnalysis);
		if (!matchAnalysis) {
			console.warn('missing match analysis data', row);
			continue;
		}
		const cardsAnalysis: readonly CardAnalysis[] = matchAnalysis.cardsAnalysis;
		const playerClass = row.playerClass;
		const cardsParsedForThisDeck: string[] = [];
		for (let i = 0; i < cardsAnalysis.length; i++) {
			const cardId = cardsAnalysis[i].cardId;
			// const debug = cardId === 'WW_0700';
			const cardGlobalContext = getCardContext(cards, cardId, 'global');
			updateCardStats(cardGlobalContext, row.result, cardsAnalysis[i], !cardsParsedForThisDeck.includes(cardId));
			// debug && console.debug('updated', 'global', cardGlobalContext);
			const cardPlayerClassContext = getCardContext(cards, cardId, playerClass);
			updateCardStats(
				cardPlayerClassContext,
				row.result,
				cardsAnalysis[i],
				!cardsParsedForThisDeck.includes(cardId),
			);
			// debug && console.debug('updated', playerClass, cardPlayerClassContext);
			cardsParsedForThisDeck.push(cardId);
		}
	}
	const result: ArenaCardStat[] = [];
	for (const cardId of Object.keys(cards)) {
		const cardData = cards[cardId];
		for (const context of Object.keys(cardData)) {
			const cardStat = cardData[context];
			result.push({
				cardId: cardId,
				context: context,
				stats: cardStat,
			});
		}
	}
	return result;
};

const updateCardStats = (
	cardContext: ArenaCardData,
	result: string,
	cardAnalysis: CardAnalysis,
	firstTimeInDeck: boolean,
) => {
	cardContext.inStartingDeck += 1;
	cardContext.wins += result === 'won' ? 1 : 0;
	cardContext.decksWithCard += firstTimeInDeck ? 1 : 0;
	cardContext.decksWithCardThenWin += firstTimeInDeck && result === 'won' ? 1 : 0;
	cardContext.drawnBeforeMulligan += cardAnalysis.drawnBeforeMulligan ? 1 : 0;
	cardContext.keptInMulligan += cardAnalysis.drawnBeforeMulligan && cardAnalysis.mulligan ? 1 : 0;
	cardContext.inHandAfterMulligan += cardAnalysis.mulligan ? 1 : 0;
	cardContext.inHandAfterMulliganThenWin += cardAnalysis.mulligan && result === 'won' ? 1 : 0;
	cardContext.drawn += cardAnalysis.drawnTurn > 0 ? 1 : 0;
	cardContext.drawnThenWin += cardAnalysis.drawnTurn > 0 && result === 'won' ? 1 : 0;
	cardContext.played += cardAnalysis.playedTurn > 0 ? 1 : 0;
	cardContext.playedThenWin += cardAnalysis.playedTurn > 0 && result === 'won' ? 1 : 0;
	cardContext.playedOnCurve += cardAnalysis.playedOnCurve ? 1 : 0;
	cardContext.playedOnCurveThenWin += cardAnalysis.playedOnCurve && result === 'won' ? 1 : 0;
};

const getCardContext = (
	cards: { [cardId: string]: { [context: string]: ArenaCardData } },
	cardId: string,
	context: string,
): ArenaCardData => {
	if (!cards[cardId]) {
		cards[cardId] = {};
	}
	if (!cards[cardId][context]) {
		cards[cardId][context] = {
			inStartingDeck: 0,
			wins: 0,
			decksWithCard: 0,
			decksWithCardThenWin: 0,
			drawnBeforeMulligan: 0,
			keptInMulligan: 0,
			inHandAfterMulligan: 0,
			inHandAfterMulliganThenWin: 0,
			drawn: 0,
			drawnThenWin: 0,
			played: 0,
			playedThenWin: 0,
			playedOnCurve: 0,
			playedOnCurveThenWin: 0,
		};
	}
	return cards[cardId][context];
};
