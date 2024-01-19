import { gzipSync } from 'zlib';
import { ARENA_STATS_BUCKET, ARENA_STATS_KEY_PREFIX } from '../common/config';
import { ArenaCardStats, ArenaClassStat, ArenaClassStats, TimePeriod } from '../model';
import { s3 } from './_build-final-stats';

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

export const saveCardStats = async (cardStats: readonly ArenaCardStats[], timePeriod: TimePeriod): Promise<void> => {
	for (const stat of cardStats) {
		console.debug(
			'saving stat',
			timePeriod,
			stat.context,
			stat.stats
				.flatMap((s) => s.stats)
				.map((s) => s.inStartingDeck)
				.reduce((a, b) => a + b, 0),
		);
		const result: ArenaCardStats = {
			lastUpdated: new Date(),
			context: stat.context,
			stats: [...stat.stats],
		};
		const gzippedMinResult = gzipSync(JSON.stringify(result));
		await s3.writeFile(
			gzippedMinResult,
			ARENA_STATS_BUCKET,
			`${ARENA_STATS_KEY_PREFIX}/cards/${timePeriod}/${stat.context}.gz.json`,
			'application/json',
			'gzip',
		);
	}
};
