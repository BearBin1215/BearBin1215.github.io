import bugIcon from "@/assets/type-icons/bug.png";
import darkIcon from "@/assets/type-icons/dark.png";
import dragonIcon from "@/assets/type-icons/dragon.png";
import electricIcon from "@/assets/type-icons/electric.png";
import fairyIcon from "@/assets/type-icons/fairy.png";
import fightingIcon from "@/assets/type-icons/fighting.png";
import fireIcon from "@/assets/type-icons/fire.png";
import flyingIcon from "@/assets/type-icons/flying.png";
import ghostIcon from "@/assets/type-icons/ghost.png";
import grassIcon from "@/assets/type-icons/grass.png";
import groundIcon from "@/assets/type-icons/ground.png";
import iceIcon from "@/assets/type-icons/ice.png";
import normalIcon from "@/assets/type-icons/normal.png";
import poisonIcon from "@/assets/type-icons/poison.png";
import psychicIcon from "@/assets/type-icons/psychic.png";
import rockIcon from "@/assets/type-icons/rock.png";
import steelIcon from "@/assets/type-icons/steel.png";
import waterIcon from "@/assets/type-icons/water.png";

/** 属性 id（与 src/assets/type-icons/ 下的图标文件名一致） */
export type TypeId =
  | "normal"
  | "fighting"
  | "flying"
  | "poison"
  | "ground"
  | "rock"
  | "bug"
  | "ghost"
  | "steel"
  | "fire"
  | "water"
  | "grass"
  | "electric"
  | "psychic"
  | "ice"
  | "dragon"
  | "dark"
  | "fairy";

/** 单个属性的展示信息 */
export interface TypeInfo {
  /** 属性 id */
  id: TypeId;
  /** 中文名 */
  zh: string;
  /** 属性颜色（白色图标的底色） */
  color: string;
  /** 白色透明底图标（64px PNG） */
  icon: string;
}

/** 属性列表（行列顺序与 wiki 一致） */
export const TYPES: readonly TypeInfo[] = [
  { id: "normal", zh: "一般", color: "#9fa19f", icon: normalIcon },
  { id: "fighting", zh: "格斗", color: "#ff8000", icon: fightingIcon },
  { id: "flying", zh: "飞行", color: "#81b9ef", icon: flyingIcon },
  { id: "poison", zh: "毒", color: "#9141cb", icon: poisonIcon },
  { id: "ground", zh: "地面", color: "#915121", icon: groundIcon },
  { id: "rock", zh: "岩石", color: "#afa981", icon: rockIcon },
  { id: "bug", zh: "虫", color: "#91a119", icon: bugIcon },
  { id: "ghost", zh: "幽灵", color: "#704170", icon: ghostIcon },
  { id: "steel", zh: "钢", color: "#60a1b8", icon: steelIcon },
  { id: "fire", zh: "火", color: "#e62829", icon: fireIcon },
  { id: "water", zh: "水", color: "#2980ef", icon: waterIcon },
  { id: "grass", zh: "草", color: "#3fa129", icon: grassIcon },
  { id: "electric", zh: "电", color: "#fac000", icon: electricIcon },
  { id: "psychic", zh: "超能力", color: "#ef4179", icon: psychicIcon },
  { id: "ice", zh: "冰", color: "#3fd8ff", icon: iceIcon },
  { id: "dragon", zh: "龙", color: "#5060e1", icon: dragonIcon },
  { id: "dark", zh: "恶", color: "#50413f", icon: darkIcon },
  { id: "fairy", zh: "妖精", color: "#ef70ef", icon: fairyIcon },
];

/** 行 = 进攻方、列 = 防守方（顺序同 TYPES）；2=克制 0.5=抵抗 0=免疫 1=正常 */
const MATRIX: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 1, 0.5, 1, 0, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1], // normal 一般
  [2, 1, 0.5, 0.5, 1, 2, 0.5, 0, 2, 1, 1, 1, 1, 0.5, 2, 1, 2, 0.5], // fighting 格斗
  [1, 2, 1, 1, 1, 0.5, 2, 1, 0.5, 1, 1, 2, 0.5, 1, 1, 1, 1, 1], // flying 飞行
  [1, 1, 1, 0.5, 0.5, 0.5, 1, 0.5, 0, 1, 1, 2, 1, 1, 1, 1, 1, 2], // poison 毒
  [1, 1, 0, 2, 1, 2, 0.5, 1, 2, 2, 1, 0.5, 2, 1, 1, 1, 1, 1], // ground 地面
  [1, 0.5, 2, 1, 0.5, 1, 2, 1, 0.5, 2, 1, 1, 1, 1, 2, 1, 1, 1], // rock 岩石
  [1, 0.5, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 0.5, 1, 2, 1, 2, 1, 1, 2, 0.5], // bug 虫
  [0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 0.5, 1], // ghost 幽灵
  [1, 1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 0.5, 1, 0.5, 1, 2, 1, 1, 2], // steel 钢
  [1, 1, 1, 1, 1, 0.5, 2, 1, 2, 0.5, 0.5, 2, 1, 1, 2, 0.5, 1, 1], // fire 火
  [1, 1, 1, 1, 2, 2, 1, 1, 1, 2, 0.5, 0.5, 1, 1, 1, 0.5, 1, 1], // water 水
  [1, 1, 0.5, 0.5, 2, 2, 0.5, 1, 0.5, 0.5, 2, 0.5, 1, 1, 1, 0.5, 1, 1], // grass 草
  [1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 2, 0.5, 0.5, 1, 1, 0.5, 1, 1], // electric 电
  [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 0, 1], // psychic 超能力
  [1, 1, 2, 1, 2, 1, 1, 1, 0.5, 0.5, 0.5, 2, 1, 1, 0.5, 2, 1, 1], // ice 冰
  [1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 1, 1, 2, 1, 0], // dragon 龙
  [1, 0.5, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 0.5, 0.5], // dark 恶
  [1, 2, 1, 0.5, 1, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 1, 1, 2, 2, 1], // fairy 妖精
];

/** 进攻方->防守方 克制倍率 */
export const MULTIPLIER: Record<TypeId, Record<TypeId, number>> = TYPES.reduce(
  (result, atk, i) => {
    result[atk.id] = TYPES.reduce(
      (row, def, j) => {
        row[def.id] = MATRIX[i]![j]!;
        return row;
      },
      {} as Record<TypeId, number>,
    );
    return result;
  },
  {} as Record<TypeId, Record<TypeId, number>>,
);

/** 双属性防守方综合倍率（倍率相乘） */
export function combinedEffectiveness(atk: TypeId, def1: TypeId, def2: TypeId): number {
  return MULTIPLIER[atk][def1] * MULTIPLIER[atk][def2];
}

/**
 * 计算两个进攻属性对指定防守方属性组合的最佳打击倍率。
 * - 单属性防守方直接比较两个倍率
 * - 双属性防守方先分别计算综合倍率，再取较大值
 */
export function bestOffensiveEffectiveness(
  atk1: TypeId,
  atk2: TypeId,
  def1: TypeId,
  def2?: TypeId,
): number {
  const first = def2 ? combinedEffectiveness(atk1, def1, def2) : MULTIPLIER[atk1][def1];
  const second = def2 ? combinedEffectiveness(atk2, def1, def2) : MULTIPLIER[atk2][def1];

  return Math.max(first, second);
}
