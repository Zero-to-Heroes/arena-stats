import { S3 } from '@firestone-hs/aws-lambda-utils';
import { gzipSync } from 'zlib';
import { ArenaClassStat, ArenaClassStats } from '../model';
import { ARENA_STATS_BUCKET, ARENA_STATS_KEY_PREFIX, targetDate } from './build-daily-arena-class-stats';

export const saveClassStats = async (classStats: readonly ArenaClassStat[]): Promise<void> => {
	const s3 = new S3();
	const result: ArenaClassStats = {
		lastUpdated: new Date(),
		stats: [...classStats],
		timePeriod: null,
		dataPoints: classStats.map((d) => d.totalGames).reduce((a, b) => a + b, 0),
	};
	const gzippedResult = gzipSync(JSON.stringify(result));
	const destination = `${ARENA_STATS_KEY_PREFIX}/classes/daily/${targetDate}.gz.json`;
	// console.log('writing to ', destination);
	await s3.writeFile(gzippedResult, ARENA_STATS_BUCKET, destination, 'application/json', 'gzip');
};
