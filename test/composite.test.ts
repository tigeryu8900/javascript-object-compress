import {expect, test} from "@jest/globals";
import {compress, decompress} from "../src";
import type {Compressible} from "../src/types";
import {testCompressDecompress} from "./common";

test("Array", async () => {
  await testCompressDecompress([]);
  await testCompressDecompress([1, 2, 3, 4, 5]);
  const array: Compressible[] = [];
  array.push(array);
  const result = decompress(await compress(array)) as Compressible[];
  expect(result).toEqual(array);
  expect(result[0]).toBe(result);
});

test("Object", async () => {
  await testCompressDecompress({});
  await testCompressDecompress({
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5
  });
  const obj: { [p: string]: Compressible } = {};
  obj.a = obj;
  const result = decompress(await compress(obj)) as { [p: string]: Compressible };
  expect(result).toEqual(obj);
  expect(result.a).toBe(result);
});

test("Map", async () => {
  await testCompressDecompress(new Map());
  await testCompressDecompress(new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
    ["d", 4],
    ["e", 5],
  ]));
  const map = new Map<Compressible, Compressible>();
  map.set(map, map);
  const result = decompress(await compress(map)) as Map<Compressible, Compressible>;
  expect(result).toEqual(map);
  expect(result.get(result)).toBe(result);
});

test("Set", async () => {
  await testCompressDecompress(new Set());
  await testCompressDecompress(new Set([1, 2, 3, 4, 5]));
  const set = new Set<Compressible>();
  set.add(set);
  const result = decompress(await compress(set)) as Set<Compressible>;
  expect(result).toEqual(set);
  expect(set.has(set)).toBeTruthy();
});
