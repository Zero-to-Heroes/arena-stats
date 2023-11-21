/* eslint-disable no-case-declarations */
import { PatchInfo } from '@firestone-hs/aws-lambda-utils';
import { ARENA_STATS_BUCKET, ARENA_STATS_KEY_PREFIX } from '../../daily/build-daily-arena-class-stats';
import { ArenaClassStats, TimePeriod } from '../../model';
import { s3 } from './aggregate-daily-arena-class-stats';

export const loadDailyDataClassFromS3 = async (
	timePeriod: TimePeriod,
	patchInfo: PatchInfo,
): Promise<readonly ArenaClassStats[]> => {
	const daysBack: number = computeDaysBackFromNow(timePeriod, patchInfo);
	const fileNames: readonly string[] = buildFileNames(daysBack);
	const fileResults = await Promise.all(fileNames.map((fileName) => loadDailyClassStatsFromS3(fileName)));
	return fileResults.filter((result) => !!result);
};

const loadDailyClassStatsFromS3 = async (fileName: string): Promise<ArenaClassStats> => {
	const fileKey = `${ARENA_STATS_KEY_PREFIX}/classes/daily/${fileName}.gz.json`;
	const data = await s3.readGzipContent(ARENA_STATS_BUCKET, fileKey, 1, false);
	const result: ArenaClassStats = JSON.parse(data);
	return result;
};

const computeDaysBackFromNow = (timePeriod: TimePeriod, patchInfo: PatchInfo): number => {
	switch (timePeriod) {
		case 'past-3':
			return 3;
		case 'past-7':
			return 7;
		case 'past-20':
			return 20;
		case 'current-season':
			// Get the day of the start of the month, then count the number of days from then to today
			const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
			return Math.floor((Date.now() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
		case 'last-patch':
			const patchReleaseDate = new Date(patchInfo.date);
			// Add one day, so that we limit partial data
			const patchReleaseDatePlusOneDay = new Date(patchReleaseDate.getTime() + 24 * 60 * 60 * 1000);
			return Math.floor((Date.now() - patchReleaseDatePlusOneDay.getTime()) / (1000 * 60 * 60 * 24));
	}
};

const buildFileNames = (daysBack: number): readonly string[] => {
	// Build a list of file names, in the form YYYY-MM-dd (e.g. 2020-05-01)
	// that start from the day before the current date and go back in time
	const fileNames: string[] = [];
	const now = new Date();
	for (let i = 0; i < daysBack; i++) {
		const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		fileNames.push(`${year}-${month}-${day}`);
	}
	return fileNames;
};
