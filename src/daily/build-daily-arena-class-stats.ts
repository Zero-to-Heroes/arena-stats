// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.

import { S3 } from '@firestone-hs/aws-lambda-utils';
import { AllCardsService } from '@firestone-hs/reference-data';
import { Context } from 'aws-lambda';
import { yesterdayDate } from '../misc-utils';
import { buildCardStats } from './card-stats';
import { buildClassStats } from './class-stats';
import { InternalArenaMatchStatsDbRow } from './model';
import { saveCardStats, saveClassStats } from './persist-data';
import { loadRows } from './rows';

export const ARENA_STATS_BUCKET = 'static.zerotoheroes.com';
export const ARENA_STATS_KEY_PREFIX = `api/arena/stats`;

const allCards = new AllCardsService();
export const s3 = new S3();

export let targetDate = yesterdayDate();

// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context: Context): Promise<any> => {
	await allCards.initializeCardsDb();
	targetDate = event.overrideTargetDate || targetDate;

	const rows: readonly InternalArenaMatchStatsDbRow[] = await loadRows();
	const classStats = buildClassStats(rows);
	const cardStats = buildCardStats(rows);

	await saveClassStats(classStats);
	await saveCardStats(cardStats);

	return { statusCode: 200, body: null };
};
