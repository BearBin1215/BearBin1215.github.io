/**
 * All The Mons 静态数据的懒加载与缓存。
 * 数据由 scripts/extract-all-the-mons.ts 生成到 public/data/all-the-mons/。
 */
import type {
  AllTheMonsData,
  AllTheMonsMeta,
  MaterialInfo,
  PoolEntry,
  SpawnBait,
  SpeciesInfo,
} from "./types";

/** 数据目录（相对站点根路径，兼容 GitHub Pages 的 base 配置） */
const DATA_BASE = `${import.meta.env.BASE_URL}data/all-the-mons/`;

/** 模块级缓存：数据只会加载一次 */
let cachePromise: Promise<AllTheMonsData> | null = null;

/** 加载单个 JSON 文件 */
async function loadJson<T>(name: string): Promise<T> {
  const response = await fetch(`${DATA_BASE}${name}`);
  if (!response.ok) {
    throw new Error(`加载 ${name} 失败（HTTP ${response.status}）`);
  }
  return response.json() as Promise<T>;
}

/**
 * 加载全部 All The Mons 静态数据并组装为 AllTheMonsData。
 * 返回同一 Promise，可安全并发调用。
 */
export function loadAllTheMonsData(): Promise<AllTheMonsData> {
  if (!cachePromise) {
    cachePromise = (async () => {
      const [baitEffects, materials, speciesList, spawnPool, biomeTagReverse, meta] =
        await Promise.all([
          loadJson<Record<string, SpawnBait>>("bait-effects.json"),
          loadJson<MaterialInfo[]>("materials.json"),
          loadJson<SpeciesInfo[]>("species.json"),
          loadJson<PoolEntry[]>("spawn-pool.json"),
          loadJson<Record<string, string[]>>("biome-tags-reverse.json"),
          loadJson<AllTheMonsMeta>("meta.json"),
        ]);

      const species: Record<string, SpeciesInfo> = {};
      for (const item of speciesList) {
        species[item.id] = item;
      }

      return { baitEffects, materials, species, spawnPool, biomeTagReverse, meta };
    })().catch((err) => {
      // 加载失败时清空缓存，允许重试
      cachePromise = null;
      throw err;
    });
  }
  return cachePromise;
}
