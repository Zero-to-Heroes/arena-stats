// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.

import { S3, logBeforeTimeout } from '@firestone-hs/aws-lambda-utils';
import { AllCardsService } from '@firestone-hs/reference-data';
import { Context } from 'aws-lambda';
import { buildCardStats } from '../hourly/card-stats';
import { buildClassStats } from '../hourly/class-stats';
import { saveCardStats, saveClassStats } from '../hourly/persist-data';
import { InternalArenaMatchStatsDbRow } from '../internal-model';
import { yesterdayDate } from '../misc-utils';
import { loadRows } from './rows';

export const ARENA_STATS_BUCKET = 'static.zerotoheroes.com';
export const ARENA_STATS_KEY_PREFIX = `api/arena/stats`;

const allCards = new AllCardsService();
export const s3 = new S3();

export let targetDate = yesterdayDate();

// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context: Context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);
	await allCards.initializeCardsDb();
	targetDate = event.overrideTargetDate || targetDate;

	const rows: readonly InternalArenaMatchStatsDbRow[] = await loadRows();
	const classStats = buildClassStats(rows);
	const cardStats = buildCardStats(rows);

	await saveClassStats(classStats);
	await saveCardStats(cardStats);

	cleanup();
	return { statusCode: 200, body: null };
};
