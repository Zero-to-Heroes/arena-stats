import { S3 } from '@firestone-hs/aws-lambda-utils';
import { gzipSync } from 'zlib';
import { ARENA_STATS_BUCKET, ARENA_STATS_KEY_PREFIX, s3 } from '../daily/build-daily-arena-class-stats';
import { InternalArenaClassStat, InternalArenaClassStats } from '../internal-model';
import { ArenaCardStat, ArenaCardStats } from '../model';

export const saveClassStats = async (classStats: readonly InternalArenaClassStat[], startDate: Date): Promise<void> => {
	const s3 = new S3();
	const result: InternalArenaClassStats = {
		lastUpdated: new Date(),
		stats: [...classStats],
		timePeriod: null,
		dataPoints: classStats.map((d) => d.totalGames).reduce((a, b) => a + b, 0),
	};
	const gzippedResult = gzipSync(JSON.stringify(result));
	const destination = `${ARENA_STATS_KEY_PREFIX}/classes/hourly/${startDate}.gz.json`;
	// console.log('writing to ', destination);
	await s3.writeFile(gzippedResult, ARENA_STATS_BUCKET, destination, 'application/json', 'gzip');
};

export const saveCardStats = async (cardStats: readonly ArenaCardStat[], startDate: Date): Promise<void> => {
	// const contexts = ['global', ...ALL_CLASSES];
	// for (const context of contexts) {
	const result: ArenaCardStats = {
		lastUpdated: new Date(),
		context: null,
		stats: [...cardStats],
	};
	const gzippedMinResult = gzipSync(JSON.stringify(result));
	const destination = `${ARENA_STATS_KEY_PREFIX}/cards/hourly/${startDate}.gz.json`;
	// console.log('writing to ', destination);
	await s3.writeFile(gzippedMinResult, ARENA_STATS_BUCKET, destination, 'application/json', 'gzip');
	// }
};
