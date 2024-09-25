import {expect, test} from "vitest";
import {formatStrings} from "../src/components/common/utils.ts";

test('can format strings for errors', () => {
    const arrayOfStrings = ['a', 'b', 'c'];
    const setOfStrings = new Set(['d', 'e', 'f']);

    expect(formatStrings(arrayOfStrings)).toStrictEqual("'a', 'b', 'c'")
    expect(formatStrings(setOfStrings)).toStrictEqual("'d', 'e', 'f'")
    expect(formatStrings(['a'])).toStrictEqual("'a'")
})
