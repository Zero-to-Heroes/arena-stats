import { mergeCardStats } from '../daily/card-stats';
import { allClasses } from '../misc-utils';
import { ArenaCardStat, ArenaCardStats, ArenaClassStat, ArenaClassStats } from '../model';

export const aggregateClassStats = (dailyClassData: readonly ArenaClassStats[]): readonly ArenaClassStat[] => {
	const result: { [playerClass: string]: ArenaClassStat } = {};
	// TODO: probably should merge this and daily merge
	for (const dailyData of dailyClassData) {
		for (const classStat of dailyData.stats) {
			if (!result[classStat.playerClass]) {
				result[classStat.playerClass] = {
					playerClass: classStat.playerClass,
					totalGames: 0,
					totalsWins: 0,
					winsDistribution: [],
					matchups: [],
				};
			}
			result[classStat.playerClass].totalGames += classStat.totalGames;
			result[classStat.playerClass].totalsWins += classStat.totalsWins;
			for (const winsDistribution of classStat.winsDistribution) {
				const existingWinsDistribution = result[classStat.playerClass].winsDistribution.find(
					(dist) => dist.wins === winsDistribution.wins,
				);
				if (existingWinsDistribution) {
					existingWinsDistribution.total += winsDistribution.total;
				} else {
					result[classStat.playerClass].winsDistribution.push(winsDistribution);
				}
			}
			for (const matchup of classStat.matchups) {
				const existingMatchup = result[classStat.playerClass].matchups.find(
					(m) => m.opponentClass === matchup.opponentClass,
				);
				if (existingMatchup) {
					existingMatchup.totalGames += matchup.totalGames;
					existingMatchup.totalsWins += matchup.totalsWins;
				} else {
					result[classStat.playerClass].matchups.push(matchup);
				}
			}
		}
	}
	return Object.values(result);
};

export const aggregateCardStats = (dailyCardData: readonly ArenaCardStats[]): readonly ArenaCardStats[] => {
	const contexts = ['global', ...allClasses];
	return contexts.map((context) =>
		aggregateCardStatsForContext(
			dailyCardData.flatMap((d) => d.stats).filter((d) => d.context === context),
			context,
		),
	);
};

const aggregateCardStatsForContext = (dailyCardData: readonly ArenaCardStat[], context: string): ArenaCardStats => {
	// const mergedStats: ArenaCardStat[] = mergeDailyCardData(dailyCardData, context);
	const mergedStats: readonly ArenaCardStat[] = mergeCardStats(dailyCardData);
	const result: ArenaCardStats = {
		lastUpdated: new Date(),
		context: context,
		stats: mergedStats,
	};
	return result;
};

// const mergeDailyCardData = (dailyCardData: readonly ArenaCardStat[], context: string): ArenaCardStat[] => {
// 	const result: { [cardId: string]: ArenaCardStat } = {};
// 	console.debug('merging daily card data', dailyCardData.length);
// 	for (const cardStat of dailyCardData) {
// 		if (!result[cardStat.cardId]) {
// 			const matchups = buildEmptyMatchups();
// 			result[cardStat.cardId] = {
// 				cardId: cardStat.cardId,
// 				context: context,
// 				stats: buildEmptyStats(),
// 				matchups: Object.values(matchups), // TODO
// 			};
// 		}
// 		result[cardStat.cardId].stats.inStartingDeck += cardStat.stats.inStartingDeck;
// 		result[cardStat.cardId].stats.wins += cardStat.stats.wins;
// 		result[cardStat.cardId].stats.decksWithCard += cardStat.stats.decksWithCard;
// 		result[cardStat.cardId].stats.decksWithCardThenWin += cardStat.stats.decksWithCardThenWin;
// 		result[cardStat.cardId].stats.drawnBeforeMulligan += cardStat.stats.drawnBeforeMulligan;
// 		result[cardStat.cardId].stats.keptInMulligan += cardStat.stats.keptInMulligan;
// 		result[cardStat.cardId].stats.inHandAfterMulligan += cardStat.stats.inHandAfterMulligan;
// 		result[cardStat.cardId].stats.inHandAfterMulliganThenWin += cardStat.stats.inHandAfterMulliganThenWin;
// 		result[cardStat.cardId].stats.drawn += cardStat.stats.drawn;
// 		result[cardStat.cardId].stats.drawnThenWin += cardStat.stats.drawnThenWin;
// 		result[cardStat.cardId].stats.played += cardStat.stats.played;
// 		result[cardStat.cardId].stats.playedThenWin += cardStat.stats.playedThenWin;
// 		result[cardStat.cardId].stats.playedOnCurve += cardStat.stats.playedOnCurve;
// 		result[cardStat.cardId].stats.playedOnCurveThenWin += cardStat.stats.playedOnCurveThenWin;
// 	}
// 	return Object.values(result);
// };
