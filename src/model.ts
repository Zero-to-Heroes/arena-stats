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
	matchups: ArenaClassMatchup[];
}

export interface ArenaClassMatchup {
	opponentClass: string;
	totalGames: number;
	totalsWins: number;
}

export interface WinsDistribution {
	wins: number;
	total: number;
}

export interface ArenaCardStats {
	lastUpdated: Date;
	context: 'global' | PlayerClass;
	stats: readonly ArenaCardStat[];
}

export interface ArenaCardStat {
	cardId: string;
	context: 'global' | PlayerClass;
	stats: ArenaCardData;
	matchups: readonly ArenaCardMatchup[];
}

export interface ArenaCardMatchup {
	opponentClass: string;
	stats: ArenaCardData;
}

export type PlayerClass = string;

export interface ArenaCardData {
	inStartingDeck: number;
	wins: number;
	decksWithCard: number;
	decksWithCardThenWin: number;
	// Kept%
	drawnBeforeMulligan: number;
	keptInMulligan: number;
	// Mulligan WR
	inHandAfterMulligan: number;
	inHandAfterMulliganThenWin: number;
	// Draw WR
	drawn: number;
	drawnThenWin: number;
	played: number;
	playedThenWin: number;
	playedOnCurve: number;
	playedOnCurveThenWin: number;
}

export type TimePeriod = 'past-20' | 'past-7' | 'past-3' | 'current-season' | 'last-patch';
