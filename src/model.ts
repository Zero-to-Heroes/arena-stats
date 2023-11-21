export interface ArenaClassStats {
	lastUpdated: Date;
	timePeriod: TimePeriod;
	dataPoints: number;
	stats: ArenaClassStat[];
}

export interface ArenaClassStat {
	playerClass: string;
	totalGames: number;
	totalsWins: number;
	winsDistribution: WinsDistribution[];
}

export interface WinsDistribution {
	wins: number;
	total: number;
}

export type TimePeriod = 'past-20' | 'past-7' | 'past-3' | 'current-season' | 'last-patch';
