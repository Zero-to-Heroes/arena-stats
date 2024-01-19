import { S3 } from '@firestone-hs/aws-lambda-utils';
import { ARENA_STATS_BUCKET } from '../common/config';
import { buildFileKeys, buildFileNamesForGivenDay } from '../common/utils';
import { ArenaClassStat, ArenaClassStats, WinsDistribution } from '../model';
import { persistClassData } from './persist-data';

export const handleClassStats = async (targetDate: string, s3: S3) => {
	const fileNames = buildFileNamesForGivenDay(targetDate);
	const fileKeys = buildFileKeys('hourly', 'classes', fileNames);
	const hourlyRawData: readonly string[] = await Promise.all(
		fileKeys.map((fileKey) => s3.readGzipContent(ARENA_STATS_BUCKET, fileKey, 1, false, 300)),
	);
	const hourlyData: readonly ArenaClassStats[] = hourlyRawData
		.filter((d) => !!d?.length)
		.map((data) => JSON.parse(data));
	if (!hourlyData?.length) {
		console.warn('no data found for', targetDate);
		return;
	}

	const allClassStats: readonly ArenaClassStat[] = hourlyData.flatMap((data) => data.stats);
	const mergedClassStats: readonly ArenaClassStat[] = mergeClassStats(allClassStats);
	// targetDate + 1 day
	const lastUpdateDate = new Date(targetDate);
	lastUpdateDate.setDate(lastUpdateDate.getDate() + 1);
	const result: ArenaClassStats = {
		lastUpdated: lastUpdateDate,
		timePeriod: null,
		dataPoints: mergedClassStats.map((d) => d.totalGames).reduce((a, b) => a + b, 0),
		stats: [...mergedClassStats],
	};
	await persistClassData(result, targetDate, s3);
};

const mergeClassStats = (allClassStats: readonly ArenaClassStat[]): readonly ArenaClassStat[] => {
	const result: ArenaClassStat[] = [];
	for (const stat of allClassStats) {
		const existingStat = result.find((s) => s.playerClass === stat.playerClass);
		if (!existingStat) {
			result.push(stat);
		} else {
			existingStat.totalGames += stat.totalGames;
			existingStat.totalsWins += stat.totalsWins;
			existingStat.winsDistribution = mergeWinsDistribution(existingStat.winsDistribution, stat.winsDistribution);
		}
	}
	return result;
};

const mergeWinsDistribution = (
	existing: readonly { wins: number; total: number }[],
	incoming: readonly { wins: number; total: number }[],
): WinsDistribution[] => {
	const result: { [wins: number]: number } = {};
	for (const dist of existing) {
		result[dist.wins] = dist.total;
	}
	for (const dist of incoming) {
		result[dist.wins] = (result[dist.wins] || 0) + dist.total;
	}
	return Object.keys(result).map((wins) => ({ wins: parseInt(wins), total: result[wins] }));
};
