// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.

import { S3, logBeforeTimeout, sleep } from '@firestone-hs/aws-lambda-utils';
import { AllCardsService } from '@firestone-hs/reference-data';
import { Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { InternalArenaMatchStatsDbRow } from '../internal-model';
import { buildCardStats } from './card-stats';
import { buildClassStats } from './class-stats';
import { saveCardStats, saveClassStats } from './persist-data';
import { loadRows } from './rows';

const allCards = new AllCardsService();
const s3 = new S3();
const lambda = new AWS.Lambda();

// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context: Context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);
	await allCards.initializeCardsDb();

	if (event.catchUp) {
		await dispatchCatchUpEvents(context, +event.catchUp);
		cleanup();
		return;
	}

	if (!event.gameMode) {
		await dispatchAllEvents(context, event);
		cleanup();
		return;
	}

	const processStartDate = buildProcessStartDate(event);
	const processEndDate = new Date(processStartDate);
	processEndDate.setHours(processEndDate.getHours() + 1);
	const gameMode: 'arena' | 'arena-underground' = event.gameMode;

	const rows: readonly InternalArenaMatchStatsDbRow[] = await loadRows(gameMode, processStartDate, processEndDate);
	console.debug(
		'Loaded rows',
		rows.length,
		'for game mode',
		gameMode,
		'between',
		processStartDate,
		'and',
		processEndDate,
	);
	const classStats = buildClassStats(rows);
	const cardStats = buildCardStats(rows);

	await saveClassStats(classStats, gameMode, processStartDate, s3);
	await saveCardStats(cardStats, gameMode, processStartDate, s3);

	cleanup();
	return { statusCode: 200, body: null };
};

const buildProcessStartDate = (event): Date => {
	if (event.targetDate) {
		const targetDate = new Date(event.targetDate);
		return targetDate;
	}

	// Start from the start of the current hour
	const processStartDate = new Date();
	processStartDate.setHours(processStartDate.getHours() - 1);
	processStartDate.setMinutes(0);
	processStartDate.setSeconds(0);
	processStartDate.setMilliseconds(0);
	return processStartDate;
};

const dispatchAllEvents = async (context: Context, event) => {
	const gameModes = ['arena', 'arena-underground'];
	for (const gameMode of gameModes) {
		console.log('dispatching event for game mode', gameMode, event.targetDate);
		const newEvent = {
			gameMode: gameMode,
			targetDate: event.targetDate,
		};
		const params = {
			FunctionName: context.functionName,
			InvocationType: 'Event',
			LogType: 'Tail',
			Payload: JSON.stringify(newEvent),
		};
		// console.log('\tinvoking lambda', params);
		const result = await lambda.invoke(params).promise();
		// console.log('\tinvocation result', result);
		await sleep(50);
	}
};

const dispatchCatchUpEvents = async (context: Context, daysInThePast: number) => {
	// Build a list of hours for the last `daysInThePast` days, in the format YYYY-MM-ddTHH:mm:ss.sssZ
	const now = new Date();
	const hours = [];
	for (let i = 0; i < 24 * daysInThePast; i++) {
		const baseDate = new Date(now);
		baseDate.setMinutes(0);
		baseDate.setSeconds(0);
		baseDate.setMilliseconds(0);
		const hour = new Date(baseDate.getTime() - i * 60 * 60 * 1000);
		hours.push(hour.toISOString());
	}

	for (const targetDate of hours) {
		console.log('dispatching catch-up for date', targetDate);
		const newEvent = {
			targetDate: targetDate,
		};
		const params = {
			FunctionName: context.functionName,
			InvocationType: 'Event',
			LogType: 'Tail',
			Payload: JSON.stringify(newEvent),
		};
		// console.log('\tinvoking lambda', params);
		const result = await lambda
			.invoke({
				FunctionName: context.functionName,
				InvocationType: 'Event',
				LogType: 'Tail',
				Payload: JSON.stringify(newEvent),
			})
			.promise();
		// console.log('\tinvocation result', result);
		await sleep(50);
	}
};
