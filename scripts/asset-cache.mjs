// sync-assets.mjs와 generate-tee-colors.mjs가 함께 쓰는 캐시 유틸리티.
// "원본 내용 + 처리 설정(해상도·포맷·품질·팔레트·시작점/임계값·알고리즘 버전) 중
// 하나라도 바뀌면 다시 생성" 규칙을 mtime이 아니라 내용 해시로 보장한다.
import fs from 'node:fs';
import crypto from 'node:crypto';

export function loadManifest(manifestPath) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return {};
  }
}

export function saveManifest(manifestPath, manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
}

// buf(원본 파일 내용) + 그 외 설정 값들을 합쳐 하나의 캐시 키를 만든다.
export function computeHash(buf, ...settingsParts) {
  const h = crypto.createHash('sha1');
  h.update(buf);
  for (const part of settingsParts) {
    h.update(typeof part === 'string' ? part : JSON.stringify(part));
  }
  return h.digest('hex');
}
