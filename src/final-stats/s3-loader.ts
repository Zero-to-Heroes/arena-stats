/* eslint-disable no-case-declarations */
import { PatchInfo } from '@firestone-hs/aws-lambda-utils';
import { ARENA_STATS_BUCKET } from '../common/config';
import { getFileKeysToLoad } from '../common/utils';
import { ArenaCardStats, ArenaClassStats, TimePeriod } from '../model';
import { s3 } from './_build-final-stats';

export const loadDailyDataClassFromS3 = async (
	gameMode: 'arena' | 'arena-underground' | 'all',
	timePeriod: TimePeriod,
	patchInfo: PatchInfo,
	currentSeasonPatchInfo: PatchInfo,
): Promise<readonly ArenaClassStats[]> => {
	const fileKeys = getFileKeysToLoad('classes', gameMode, timePeriod, patchInfo, currentSeasonPatchInfo);
	const rawData: readonly string[] = await Promise.all(
		fileKeys.map((fileKey) => s3.readGzipContent(ARENA_STATS_BUCKET, fileKey, 1, false, 300)),
	);
	const data: readonly ArenaClassStats[] = rawData.filter((d) => !!d?.length).map((data) => JSON.parse(data));
	return data;
};

export const loadDailyDataCardFromS3 = async (
	gameMode: 'arena' | 'arena-underground' | 'all',
	timePeriod: TimePeriod,
	patchInfo: PatchInfo,
	currentSeasonPatchInfo: PatchInfo,
): Promise<readonly ArenaCardStats[]> => {
	const fileKeys = getFileKeysToLoad('cards', gameMode, timePeriod, patchInfo, currentSeasonPatchInfo);
	const rawData: readonly string[] = await Promise.all(
		fileKeys.map((fileKey) => s3.readGzipContent(ARENA_STATS_BUCKET, fileKey, 1, false, 300)),
	);
	const data: readonly ArenaCardStats[] = rawData.filter((d) => !!d?.length).map((data) => JSON.parse(data));
	return data;
};
