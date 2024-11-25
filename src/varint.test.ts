import {expect, test} from "@jest/globals";
import {decodeVarUint, encodeVarUint} from "./varint";

test("varint", () => {
  expect(decodeVarUint(encodeVarUint(0), 0)).toEqual([0, 1]);
  expect(decodeVarUint(encodeVarUint(1), 0)).toEqual([1, 1]);
  expect(decodeVarUint(encodeVarUint(255), 0)).toEqual([255, 2]);
  expect(decodeVarUint(encodeVarUint(65535), 0)).toEqual([65535, 3]);
});
