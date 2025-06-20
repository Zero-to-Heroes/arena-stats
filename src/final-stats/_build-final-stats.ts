// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.

import {
	getArenaCurrentSeasonPatch,
	getLastArenaPatch,
	logBeforeTimeout,
	S3,
	sleep,
} from '@firestone-hs/aws-lambda-utils';
import { AllCardsService } from '@firestone-hs/reference-data';
import { Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { ArenaCardStats, ArenaClassStat, ArenaClassStats, TimePeriod } from '../model';
import { aggregateCardStats, aggregateClassStats } from './data-merger';
import { loadDailyDataCardFromS3, loadDailyDataClassFromS3 } from './s3-loader';
import { saveCardStats, saveClassStats } from './s3-saver';

const allCards = new AllCardsService();
export const s3 = new S3();
const lambda = new AWS.Lambda();

// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context: Context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);
	await allCards.initializeCardsDb();

	if (!event.timePeriod) {
		await dispatchEvents(context);
		cleanup();
		return;
	}

	const timePeriod: TimePeriod = event.timePeriod;
	const gameMode: 'arena' | 'arena-underground' | 'all' = event.gameMode;
	const patchInfo = await getLastArenaPatch();
	const currentSeasonPatchInfo = await getArenaCurrentSeasonPatch();

	const dailyClassData: readonly ArenaClassStats[] = await loadDailyDataClassFromS3(
		gameMode,
		timePeriod,
		patchInfo,
		currentSeasonPatchInfo,
	);
	const aggregatedClassStats: readonly ArenaClassStat[] = aggregateClassStats(dailyClassData);
	await saveClassStats(aggregatedClassStats, gameMode, timePeriod);

	const dailyCardsData: readonly ArenaCardStats[] = await loadDailyDataCardFromS3(
		gameMode,
		timePeriod,
		patchInfo,
		currentSeasonPatchInfo,
	);
	// const validArenaSets: readonly SetId[] = arenaSets;
	const aggregatedCardStats: readonly ArenaCardStats[] = aggregateCardStats(dailyCardsData);
	const filteredCardStats: readonly ArenaCardStats[] = aggregatedCardStats.map((s) => ({
		...s,
		// stats: s.stats.filter((cardStat) => {
		// 	const card = allCards.getCard(cardStat.cardId);
		// 	return card && validArenaSets.includes(card.set?.toLowerCase() as SetId);
		// }),
	}));
	console.debug(
		'filteredCardStats',
		filteredCardStats.flatMap((s) => s.stats.length).reduce((a, b) => a + b, 0),
		aggregatedCardStats.flatMap((s) => s.stats.length).reduce((a, b) => a + b, 0),
	);
	await saveCardStats(filteredCardStats, gameMode, timePeriod);

	cleanup();
	return { statusCode: 200, body: null };
};

const dispatchEvents = async (context: Context) => {
	const allTimePeriod: readonly TimePeriod[] = ['last-patch', 'past-20', 'past-7', 'past-3', 'current-season'];
	const allGameModes: readonly string[] = ['arena', 'arena-underground', 'all'];
	for (const timePeriod of allTimePeriod) {
		for (const gameMode of allGameModes) {
			const newEvent = {
				dailyProcessing: true,
				timePeriod: timePeriod,
				gameMode: gameMode,
			};
			const params = {
				FunctionName: context.functionName,
				InvocationType: 'Event',
				LogType: 'Tail',
				Payload: JSON.stringify(newEvent),
			};
			console.log('\tinvoking lambda', params);
			const result = await lambda
				.invoke({
					FunctionName: context.functionName,
					InvocationType: 'Event',
					LogType: 'Tail',
					Payload: JSON.stringify(newEvent),
				})
				.promise();
			console.log('\tinvocation result', result);
			await sleep(50);
		}
	}
};
