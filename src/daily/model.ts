export interface InternalReplaySummaryDbRow {
	readonly playerClass: string;
	readonly result: 'won' | 'lost' | 'tied';
	readonly additionalResult: string;
}
