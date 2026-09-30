// "선호 색" 팔레트. 각 색상은 T05 무지티 부분만 이 색으로 다시 칠한
// 이미지 버전(옷 이미지 카드 + 완성 코디 큰 그림 모두)을 실제로 가지고 있다.
// 생성은 scripts/generate-tee-colors.mjs가 담당하며, swatch 값이 곧 실제
// 이미지에 입혀지는 색이므로 이 파일을 바꾸면 npm run generate-tee-colors로
// 다시 생성해야 한다.
export const FAVORITE_COLORS = [
  { id: 'blue', label: '파랑', swatch: '#4a90c2' },
  { id: 'pink', label: '분홍', swatch: '#e08bb0' },
  { id: 'yellow', label: '노랑', swatch: '#e0c23c' },
  { id: 'green', label: '초록', swatch: '#5ba876' },
  { id: 'purple', label: '보라', swatch: '#8a7cc2' },
];

export function getColorLabel(colorId) {
  return FAVORITE_COLORS.find((c) => c.id === colorId)?.label ?? '';
}
