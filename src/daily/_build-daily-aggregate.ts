// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.

import { S3, logBeforeTimeout, sleep } from '@firestone-hs/aws-lambda-utils';
import { AllCardsService } from '@firestone-hs/reference-data';
import { Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { yesterdayDate } from '../misc-utils';
import { handleCardStats } from './card-stats';
import { handleClassStats } from './class-stats';

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

	const targetDate: string = event.targetDate || yesterdayDate();
	const gameMode: 'arena' | 'arena-underground' = event.gameMode;
	await handleClassStats(gameMode, targetDate, s3);
	await handleCardStats(gameMode, targetDate, s3);

	cleanup();
	return { statusCode: 200, body: null };
};

const dispatchAllEvents = async (context: Context, event) => {
	const gameModes = ['arena', 'arena-underground'];
	for (const gameMode of gameModes) {
		console.log('dispatching event for game mode', gameMode);
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

const dispatchCatchUpEvents = async (context: Context, numberOfDays: number) => {
	// Build a list of days for the last 30 days, in the format YYYY-MM-dd
	const now = new Date();
	const days = [];
	for (let i = 0; i < numberOfDays; i++) {
		const baseDate = new Date(now);
		baseDate.setHours(0);
		baseDate.setMinutes(0);
		baseDate.setSeconds(0);
		baseDate.setMilliseconds(0);
		const day = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
		days.push(day);
	}

	for (const targetDate of days) {
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
