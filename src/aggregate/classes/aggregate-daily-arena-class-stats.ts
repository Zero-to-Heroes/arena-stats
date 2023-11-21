// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.

import { S3, getLastArenaPatch, sleep } from '@firestone-hs/aws-lambda-utils';
import { AllCardsService } from '@firestone-hs/reference-data';
import { Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { ArenaClassStat, ArenaClassStats, TimePeriod } from '../../model';
import { aggregateClassStats } from './data-merger';
import { loadDailyDataClassFromS3 } from './s3-loader';
import { saveClassStats } from './s3-saver';

const allCards = new AllCardsService();
export const s3 = new S3();
const lambda = new AWS.Lambda();

// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context: Context): Promise<any> => {
	await allCards.initializeCardsDb();

	if (!event.timePeriod) {
		await dispatchEvents(context);
		return;
	}

	const timePeriod: TimePeriod = event.timePeriod;
	const patchInfo = await getLastArenaPatch();
	const dailyClassData: readonly ArenaClassStats[] = await loadDailyDataClassFromS3(timePeriod, patchInfo);
	const aggregatedClassStats: readonly ArenaClassStat[] = aggregateClassStats(dailyClassData);
	await saveClassStats(aggregatedClassStats, timePeriod);
	return { statusCode: 200, body: null };
};

const dispatchEvents = async (context: Context) => {
	const allTimePeriod: readonly TimePeriod[] = ['last-patch', 'past-20', 'past-7', 'past-3'];
	for (const timePeriod of allTimePeriod) {
		const newEvent = {
			dailyProcessing: true,
			timePeriod: timePeriod,
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
};
