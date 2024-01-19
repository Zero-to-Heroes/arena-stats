import { TimePeriod } from './model';

export interface InternalArenaMatchStatsDbRow {
	readonly playerClass: string;
	readonly result: 'won' | 'lost' | 'tied';
	readonly wins: number;
	readonly losses: number;
	readonly playerDecklist: string;
	readonly matchAnalysis: string;
}

export interface InternalArenaClassStats {
	lastUpdated: Date;
	timePeriod: TimePeriod;
	dataPoints: number;
	stats: InternalArenaClassStat[];
}

export interface InternalArenaClassStat {
	playerClass: string;
	totalGames: number;
	totalsWins: number;
}
