import explosionUrl from "@/assets/gif-detonator/explosion.gif";
import { decodeGif, type DecodedGif } from "./decode";

/**
 * 素材是公共领域的核试验胶片，开头过曝、结尾换镜头，
 * 因此只取火球炸开到蘑菇云成形之间的一段。
 */
const EXPLOSION_FROM_FRAME = 16;
const EXPLOSION_TO_FRAME = 101;
/** 解码宽度上限，素材原宽 428px，不会触发缩放 */
const EXPLOSION_MAX_WIDTH = 2048;

/** 加载中的爆炸素材，成功后复用，失败后置空以便重试 */
let explosionPromise: Promise<DecodedGif> | null = null;

/**
 * 加载并解码爆炸片段，结果在页面生命周期内缓存。
 * 解码后的帧是整画布 RGBA，后续由 `fillBox` 缩放到源片尺寸。
 */
export function loadExplosion(): Promise<DecodedGif> {
  explosionPromise ??= decodeExplosion().catch((error: unknown) => {
    explosionPromise = null;
    throw error;
  });
  return explosionPromise;
}

async function decodeExplosion(): Promise<DecodedGif> {
  const response = await fetch(explosionUrl);
  if (!response.ok) {
    throw new Error("爆炸素材加载失败，请刷新页面重试。");
  }
  return decodeGif(await response.arrayBuffer(), EXPLOSION_MAX_WIDTH, {
    from: EXPLOSION_FROM_FRAME,
    to: EXPLOSION_TO_FRAME,
  });
}
