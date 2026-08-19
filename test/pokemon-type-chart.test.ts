import { describe, expect, it } from "vitest";
import {
  bestOffensiveEffectiveness,
  combinedEffectiveness,
  type TypeId,
} from "@/pages/toys/pokemon-type-chart/data";

/** 双属性相克倍率测试用例 */
const COMBINED_EFFECTIVENESS_CASES: readonly {
  /** 进攻方属性 */
  attack: TypeId;
  /** 防守方第一属性 */
  defense1: TypeId;
  /** 防守方第二属性 */
  defense2: TypeId;
  /** 预期综合倍率 */
  expected: number;
  /** 测试用例说明 */
  label: string;
}[] = [
  {
    attack: "ice",
    defense1: "dragon",
    defense2: "ground",
    expected: 4,
    label: "冰->龙+地面",
  },
  {
    attack: "dark",
    defense1: "psychic",
    defense2: "ghost",
    expected: 4,
    label: "恶->超能力+幽灵",
  },
  {
    attack: "bug",
    defense1: "dark",
    defense2: "grass",
    expected: 4,
    label: "虫->恶+草",
  },
  {
    attack: "flying",
    defense1: "electric",
    defense2: "rock",
    expected: 0.25,
    label: "飞行->电+岩石",
  },
  {
    attack: "electric",
    defense1: "ground",
    defense2: "flying",
    expected: 0,
    label: "电->地面+飞行",
  },
  {
    attack: "dragon",
    defense1: "fairy",
    defense2: "steel",
    expected: 0,
    label: "龙->妖精+钢",
  },
  {
    attack: "poison",
    defense1: "grass",
    defense2: "poison",
    expected: 1,
    label: "毒->草+毒",
  },
];

describe("双属性相克倍率", () => {
  it.each(COMBINED_EFFECTIVENESS_CASES)(
    "$label的综合倍率为$expected",
    ({ attack, defense1, defense2, expected }) => {
      expect(combinedEffectiveness(attack, defense1, defense2)).toBe(expected);
    },
  );
});

describe("本系打击面", () => {
  it("飞行+地面对电 -> 2倍克制", () => {
    expect(bestOffensiveEffectiveness("flying", "ground", "electric")).toBe(2);
  });

  it("冰+超能力对龙+地面 -> 4倍克制", () => {
    expect(bestOffensiveEffectiveness("ice", "psychic", "dragon", "ground")).toBe(4);
  });
});
