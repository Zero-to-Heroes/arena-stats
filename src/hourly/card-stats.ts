/* eslint-disable no-extra-boolean-cast */
import { CardAnalysis, MatchAnalysis } from '@firestone-hs/replay-metadata';
import { InternalArenaMatchStatsDbRow } from '../internal-model';
import { allClasses } from '../misc-utils';
import { ArenaCardData, ArenaCardMatchup, ArenaCardStat } from '../model';

export const buildCardStats = (rows: readonly InternalArenaMatchStatsDbRow[]): readonly ArenaCardStat[] => {
	const cards: {
		[cardId: string]: {
			[context: string]: {
				stats: ArenaCardData;
				matchups: { [opponentClass: string]: ArenaCardMatchup };
			};
		};
	} = {};
	for (const row of rows) {
		const matchAnalysis: MatchAnalysis = JSON.parse(row.matchAnalysis);
		if (!matchAnalysis) {
			console.warn('missing match analysis data', row);
			continue;
		}
		const cardsAnalysis: readonly CardAnalysis[] = matchAnalysis.cardsAnalysis;
		const playerClass = row.playerClass;
		const opponentClass = row.opponentClass;
		// console.debug('getting matchup for', opponentClass, row);
		const cardsParsedForThisDeck: string[] = [];
		for (let i = 0; i < cardsAnalysis.length; i++) {
			const cardId = cardsAnalysis[i].cardId;
			// const debug = cardId === 'WW_0700';
			const cardGlobalContext = getCardContext(cards, cardId, 'global');
			updateCardStats(
				cardGlobalContext,
				row.result,
				opponentClass,
				cardsAnalysis[i],
				!cardsParsedForThisDeck.includes(cardId),
			);
			// debug && console.debug('updated', 'global', cardGlobalContext);
			const cardPlayerClassContext = getCardContext(cards, cardId, playerClass);
			updateCardStats(
				cardPlayerClassContext,
				row.result,
				opponentClass,
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
			const matchups = Object.values(cardStat.matchups);
			result.push({
				cardId: cardId,
				context: context,
				stats: cardStat?.stats,
				matchups: matchups,
			});
		}
	}
	return result;
};

const updateCardStats = (
	cardContext: {
		stats: ArenaCardData;
		matchups: { [opponentClass: string]: ArenaCardMatchup };
	},
	result: string,
	opponentClass: string,
	cardAnalysis: CardAnalysis,
	firstTimeInDeck: boolean,
) => {
	updateStat(cardContext.stats, result, cardAnalysis, firstTimeInDeck);
	if (!!opponentClass?.length || opponentClass === 'neutral') {
		if (!cardContext.matchups[opponentClass]) {
			console.error('missing matchup for', opponentClass, cardContext.matchups);
		}
		updateStat(cardContext.matchups[opponentClass].stats, result, cardAnalysis, firstTimeInDeck);
	}
};

const updateStat = (stats: ArenaCardData, result: string, cardAnalysis: CardAnalysis, firstTimeInDeck: boolean) => {
	stats.inStartingDeck += 1;
	stats.wins += result === 'won' ? 1 : 0;
	stats.decksWithCard += firstTimeInDeck ? 1 : 0;
	stats.decksWithCardThenWin += firstTimeInDeck && result === 'won' ? 1 : 0;
	stats.drawnBeforeMulligan += cardAnalysis.drawnBeforeMulligan ? 1 : 0;
	stats.keptInMulligan += cardAnalysis.drawnBeforeMulligan && cardAnalysis.mulligan ? 1 : 0;
	stats.inHandAfterMulligan += cardAnalysis.mulligan ? 1 : 0;
	stats.inHandAfterMulliganThenWin += cardAnalysis.mulligan && result === 'won' ? 1 : 0;
	stats.drawn += cardAnalysis.drawnTurn > 0 ? 1 : 0;
	stats.drawnThenWin += cardAnalysis.drawnTurn > 0 && result === 'won' ? 1 : 0;
	stats.played += cardAnalysis.playedTurn > 0 ? 1 : 0;
	stats.playedThenWin += cardAnalysis.playedTurn > 0 && result === 'won' ? 1 : 0;
	stats.playedOnCurve += cardAnalysis.playedOnCurve ? 1 : 0;
	stats.playedOnCurveThenWin += cardAnalysis.playedOnCurve && result === 'won' ? 1 : 0;
};

const getCardContext = (
	cards: {
		[cardId: string]: {
			[context: string]: {
				stats: ArenaCardData;
				matchups: { [opponentClass: string]: ArenaCardMatchup };
			};
		};
	},
	cardId: string,
	context: string,
): {
	stats: ArenaCardData;
	matchups: { [opponentClass: string]: ArenaCardMatchup };
} => {
	if (!cards[cardId]) {
		cards[cardId] = {};
	}
	if (!cards[cardId][context]) {
		const matchups = buildEmptyMatchups();
		cards[cardId][context] = {
			stats: buildEmptyStats(),
			matchups: matchups,
		};
	}
	return cards[cardId][context];
};

export const buildEmptyMatchups = (): { [opponentClass: string]: ArenaCardMatchup } => {
	const matchUps: { [opponentClass: string]: ArenaCardMatchup } = {};
	for (const playerClass of allClasses) {
		const matchup: ArenaCardMatchup = {
			opponentClass: playerClass,
			stats: buildEmptyStats(),
		};
		matchUps[playerClass] = matchup;
	}
	return matchUps;
};

export const buildEmptyStats = (): ArenaCardData => ({
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
});
