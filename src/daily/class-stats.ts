import { CardClass } from '@firestone-hs/reference-data';
import { Mutable } from '../misc-utils';
import { ArenaClassStat, WinsDistribution } from '../model';
import { InternalReplaySummaryDbRow } from './model';

// Build the list of all classes from the CardClass enum
export const allClasses: readonly string[] = Object.keys(CardClass)
	.map((key) => CardClass[key])
	.filter((value) => typeof value === 'string')
	.filter((value) => ![CardClass.INVALID, CardClass.NEUTRAL, CardClass.DREAM, CardClass.WHIZBANG].includes(value));

export const buildClassStats = (rows: readonly InternalReplaySummaryDbRow[]): readonly ArenaClassStat[] => {
	const validRows = rows.filter((row) => row.additionalResult?.includes('-')).filter((row) => row.result?.length > 0);
	const stats: { [playerClass: string]: ArenaClassStat } = {};
	for (const row of validRows) {
		const playerClass = row.playerClass;
		if (!stats[playerClass]) {
			stats[playerClass] = {
				playerClass: playerClass,
				totalGames: 0,
				totalsWins: 0,
				winsDistribution: [],
			};
		}
		const stat = stats[playerClass] as Mutable<ArenaClassStat>;
		stat.totalGames++;
		stat.totalsWins += row.result === 'won' ? 1 : 0;
		const currentGameWins = parseInt(row.additionalResult.split('-')[0]);
		const gameWinsAfterThisGame = row.result === 'won' ? currentGameWins + 1 : currentGameWins;
		const winsDistribution = stat.winsDistribution.find(
			(dist) => dist.wins === gameWinsAfterThisGame,
		) as Mutable<WinsDistribution>;
		if (!winsDistribution) {
			stat.winsDistribution.push({ wins: gameWinsAfterThisGame, total: 1 });
		} else {
			winsDistribution.total++;
		}
	}
	return Object.values(stats);
};
