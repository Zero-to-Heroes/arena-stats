// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.

import { S3, logBeforeTimeout } from '@firestone-hs/aws-lambda-utils';
import { AllCardsService } from '@firestone-hs/reference-data';
import { Context } from 'aws-lambda';
import { InternalArenaMatchStatsDbRow } from '../internal-model';
import { buildCardStats } from './card-stats';
import { buildClassStats } from './class-stats';
import { saveCardStats, saveClassStats } from './persist-data';
import { loadRows } from './rows';

export const ARENA_STATS_BUCKET = 'static.zerotoheroes.com';
export const ARENA_STATS_KEY_PREFIX = `api/arena/stats`;

const allCards = new AllCardsService();
export const s3 = new S3();

// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context: Context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);
	await allCards.initializeCardsDb();

	// Start from the start of the current hour
	const processStartDate = new Date();
	processStartDate.setMinutes(0);
	processStartDate.setSeconds(0);
	processStartDate.setMilliseconds(0);
	processStartDate.setHours(processStartDate.getHours() - 1);
	// End one hour later
	const processEndDate = new Date(processStartDate);
	processEndDate.setHours(processEndDate.getHours() + 1);

	const rows: readonly InternalArenaMatchStatsDbRow[] = await loadRows(processStartDate, processEndDate);
	const classStats = buildClassStats(rows);
	const cardStats = buildCardStats(rows);

	await saveClassStats(classStats, processStartDate);
	await saveCardStats(cardStats, processStartDate);

	cleanup();
	return { statusCode: 200, body: null };
};
