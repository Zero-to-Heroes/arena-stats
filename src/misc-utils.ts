// The date of the day before, in YYYY-MM-dd format
export const yesterdayDate = () => {
	const now = new Date();
	const yesterday = new Date(now.setDate(now.getDate() - 1));
	const year = yesterday.getFullYear();
	const month = yesterday.getMonth() + 1;
	const day = yesterday.getDate();
	return `${year}-${month}-${day}`;
};

export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};
