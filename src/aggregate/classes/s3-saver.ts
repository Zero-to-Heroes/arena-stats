import { gzipSync } from 'zlib';
import { ARENA_STATS_BUCKET, ARENA_STATS_KEY_PREFIX } from '../../daily/build-daily-arena-class-stats';
import { ArenaClassStat, ArenaClassStats, TimePeriod } from '../../model';
import { s3 } from './aggregate-daily-arena-class-stats';

export const saveClassStats = async (classStats: readonly ArenaClassStat[], timePeriod: TimePeriod): Promise<void> => {
	const result: ArenaClassStats = {
		lastUpdated: new Date(),
		timePeriod: timePeriod,
		dataPoints: classStats.map((d) => d.totalGames).reduce((a, b) => a + b, 0),
		stats: [...classStats],
	};
	const gzippedMinResult = gzipSync(JSON.stringify(result));
	await s3.writeFile(
		gzippedMinResult,
		ARENA_STATS_BUCKET,
		`${ARENA_STATS_KEY_PREFIX}/classes/${timePeriod}/overview.gz.json`,
		'application/json',
		'gzip',
	);
};
