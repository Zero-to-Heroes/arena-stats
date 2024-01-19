export interface InternalArenaMatchStatsDbRow {
	readonly playerClass: string;
	readonly result: 'won' | 'lost' | 'tied';
	readonly wins: number;
	readonly losses: number;
	readonly playerDecklist: string;
	readonly matchAnalysis: string;
}
