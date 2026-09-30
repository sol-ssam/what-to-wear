// 상황 5(옷차림 정돈) 카드용 작은 UI 아이콘. 별도 이미지 파일이 없어 인라인 SVG로 대신한다.
export function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"
        fill="currentColor"
      />
      <circle cx="19" cy="18" r="1.6" fill="currentColor" />
      <circle cx="5" cy="17" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function FoldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none">
      <rect x="3" y="9" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 13h18" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9V6.5A2.5 2.5 0 0 1 10.5 4h3A2.5 2.5 0 0 1 16 6.5V9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CheckBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
