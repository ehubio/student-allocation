export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

export function isEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value === null || value === undefined;
}

export function groupBy(arr: any[], property: string) {
    return arr.reduce((memo, x) => {
        const values = Array.isArray(x[property]) ? x[property] : [x[property]];
        values.forEach((value: any) => {
            if (!memo[value]) {
                memo[value] = [];
            }
            memo[value].push(x);
        });
        return memo;
    }, {});
}

export function formatStrings(values: string[] | Set<string>): string {
    const formattedValues = Array.isArray(values)
        ? values.map(value => `'${value}'`)
        : Array.from(values).map(value => `'${value}'`);

    return formattedValues.join(', ');
}
