import SecretsManager, { GetSecretValueRequest, GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';
import { Connection, createPool } from 'mysql';
import { targetDate } from './build-daily-arena-class-stats';
import { InternalReplaySummaryDbRow } from './model';

export const loadRows = async (): Promise<readonly InternalReplaySummaryDbRow[]> => {
	const secretRequest: GetSecretValueRequest = {
		SecretId: 'rds-connection',
	};
	const secret: SecretInfo = await getSecret(secretRequest);
	const pool = createPool({
		connectionLimit: 1,
		host: secret.hostReadOnly,
		user: secret.username,
		password: secret.password,
		database: 'replay_summary',
		port: secret.port,
	});
	return performRowProcessIngPool(pool);
};

const performRowProcessIngPool = async (pool: any): Promise<readonly InternalReplaySummaryDbRow[]> => {
	return new Promise<readonly InternalReplaySummaryDbRow[]>((resolve) => {
		pool.getConnection(async (err, connection) => {
			if (err) {
				console.log('error with connection', err);
				throw new Error('Could not connect to DB');
			} else {
				const result = await performRowsProcessing(connection);
				connection.release();
				resolve(result);
			}
		});
	});
};

const performRowsProcessing = async (connection: Connection): Promise<readonly InternalReplaySummaryDbRow[]> => {
	return new Promise<readonly InternalReplaySummaryDbRow[]>((resolve) => {
		// Load all the rows from the day before. Not simply from the past 24 hours, but from the
		// day before today. For instance, if it's 24/09 at 04:00, we load all the rows that were
		// inserted on the 23/09, from 00:00 to 23:59
		console.log('yesterdayStr', targetDate);
		const queryStr = `
			SELECT playerClass, result, additionalResult 
			FROM replay_summary
			WHERE gameMode = 'arena'
			AND creationDate >= '${targetDate}'
			AND creationDate < '${targetDate} 23:59:59'
		`;
		console.log('running query', queryStr);
		const query = connection.query(queryStr);

		const rowsToProcess: InternalReplaySummaryDbRow[] = [];
		query
			.on('error', (err) => {
				console.error('error while fetching rows', err);
			})
			.on('fields', (fields) => {
				console.log('fields', fields);
			})
			.on('result', async (row: InternalReplaySummaryDbRow) => {
				rowsToProcess.push(row);
			})
			.on('end', async () => {
				console.log('end', rowsToProcess.length);
				resolve(rowsToProcess);
			});
	});
};

const getSecret = (secretRequest: GetSecretValueRequest) => {
	const secretsManager = new SecretsManager({ region: 'us-west-2' });
	return new Promise<SecretInfo>((resolve) => {
		secretsManager.getSecretValue(secretRequest, (err, data: GetSecretValueResponse) => {
			const secretInfo: SecretInfo = JSON.parse(data.SecretString);
			resolve(secretInfo);
		});
	});
};

interface SecretInfo {
	readonly username: string;
	readonly password: string;
	readonly host: string;
	readonly hostReadOnly: string;
	readonly port: number;
	readonly dbClusterIdentifier: string;
}
