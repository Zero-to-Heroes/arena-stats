import { S3 } from '@firestone-hs/aws-lambda-utils';
import { gzipSync } from 'zlib';
import { ARENA_STATS_BUCKET, ARENA_STATS_KEY_PREFIX } from '../common/config';
import { ArenaCardStat, ArenaCardStats, ArenaClassStat, ArenaClassStats } from '../model';

export const saveClassStats = async (
	classStats: readonly ArenaClassStat[],
	gameMode: 'arena' | 'arena-underground',
	startDate: Date,
	s3: S3,
): Promise<void> => {
	const result: ArenaClassStats = {
		lastUpdated: new Date(),
		stats: [...classStats],
		timePeriod: null,
		dataPoints: classStats.map((d) => d.totalGames).reduce((a, b) => a + b, 0),
	};
	const gzippedResult = gzipSync(JSON.stringify(result));
	const destination = `${ARENA_STATS_KEY_PREFIX}/classes/${gameMode}/hourly/${startDate.toISOString()}.gz.json`;
	await s3.writeFile(gzippedResult, ARENA_STATS_BUCKET, destination, 'application/json', 'gzip');
};

export const saveCardStats = async (
	cardStats: readonly ArenaCardStat[],
	gameMode: 'arena' | 'arena-underground',
	startDate: Date,
	s3: S3,
): Promise<void> => {
	const result: ArenaCardStats = {
		lastUpdated: new Date(),
		context: null,
		stats: [...cardStats],
	};
	const gzippedMinResult = gzipSync(JSON.stringify(result));
	const destination = `${ARENA_STATS_KEY_PREFIX}/cards/${gameMode}/hourly/${startDate.toISOString()}.gz.json`;
	await s3.writeFile(gzippedMinResult, ARENA_STATS_BUCKET, destination, 'application/json', 'gzip');
};
