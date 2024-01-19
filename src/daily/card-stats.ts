import { S3 } from '@firestone-hs/aws-lambda-utils';
import { ARENA_STATS_BUCKET } from '../common/config';
import { buildFileKeys, buildFileNamesForGivenDay } from '../common/utils';
import { ArenaCardData, ArenaCardStat, ArenaCardStats } from '../model';
import { persistCardData } from './persist-data';

export const handleCardStats = async (targetDate: string, s3: S3): Promise<void> => {
	const fileNames = buildFileNamesForGivenDay(targetDate);
	const fileKeys = buildFileKeys('hourly', 'cards', fileNames);
	const hourlyRawData: readonly string[] = await Promise.all(
		fileKeys.map((fileKey) => s3.readGzipContent(ARENA_STATS_BUCKET, fileKey, 1, false, 300)),
	);
	const hourlyData: readonly ArenaCardStats[] = hourlyRawData
		.filter((d) => !!d?.length)
		.map((data) => JSON.parse(data));
	if (!hourlyData?.length) {
		console.warn('no data found for', targetDate);
		return;
	}

	const allCardStats: readonly ArenaCardStat[] = hourlyData.flatMap((data) => data.stats);
	const mergedClassStats: readonly ArenaCardStat[] = mergeCardStats(allCardStats);
	const result: ArenaCardStats = {
		lastUpdated: new Date(),
		context: null,
		stats: [...mergedClassStats],
	};

	// targetDate + 1 day
	const lastUpdateDate = new Date(targetDate);
	lastUpdateDate.setDate(lastUpdateDate.getDate() + 1);
	await persistCardData(result, targetDate, s3);
};

const mergeCardStats = (allCardStats: readonly ArenaCardStat[]): readonly ArenaCardStat[] => {
	// The key here is cardId + context
	const result: { [cardIdAndContext: string]: ArenaCardStat } = {};
	for (const stat of allCardStats) {
		const existingStat = result[stat.cardId + stat.context];
		if (!existingStat) {
			result[stat.cardId + stat.context] = stat;
		} else {
			existingStat.stats = mergeCardStat(existingStat.stats, stat.stats);
		}
	}
	return Object.values(result);
};

const mergeCardStat = (existing: ArenaCardData, incoming: ArenaCardData): ArenaCardData => {
	const base: ArenaCardData = { ...existing };
	base.inStartingDeck += incoming.inStartingDeck;
	base.wins += incoming.wins;
	base.drawnBeforeMulligan += incoming.drawnBeforeMulligan;
	base.keptInMulligan += incoming.keptInMulligan;
	base.inHandAfterMulligan += incoming.inHandAfterMulligan;
	base.inHandAfterMulliganThenWin += incoming.inHandAfterMulliganThenWin;
	base.drawn += incoming.drawn;
	base.drawnThenWin += incoming.drawnThenWin;
	return base;
};
