import { ArenaClassStat, ArenaClassStats } from '../../model';

export const aggregateClassStats = (dailyClassData: readonly ArenaClassStats[]): readonly ArenaClassStat[] => {
	const result: { [playerClass: string]: ArenaClassStat } = {};
	for (const dailyData of dailyClassData) {
		for (const classStat of dailyData.stats) {
			if (!result[classStat.playerClass]) {
				result[classStat.playerClass] = {
					playerClass: classStat.playerClass,
					totalGames: 0,
					totalsWins: 0,
					winsDistribution: [],
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
		}
	}
	return Object.values(result);
};
