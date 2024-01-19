import { InternalArenaMatchStatsDbRow } from '../internal-model';
import { Mutable } from '../misc-utils';
import { ArenaClassStat, WinsDistribution } from '../model';

export const buildClassStats = (rows: readonly InternalArenaMatchStatsDbRow[]): readonly ArenaClassStat[] => {
	const validRows = rows;
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
		const currentGameWins = row.wins;
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
