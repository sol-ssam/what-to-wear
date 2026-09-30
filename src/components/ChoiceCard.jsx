export default function ChoiceCard({ images, label, selected, onClick, compact = false, icon = null }) {
  return (
    <button
      type="button"
      className={`choice-card${selected ? ' choice-card--selected' : ''}${compact ? ' choice-card--compact' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {selected && <span className="choice-card__badge">✓</span>}
      <span className="choice-card__images">
        {images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt}
            className="choice-card__image"
            style={img.style}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // 색상 버전 로드 실패 시 같은 아이템의 기본(무색) 이미지로 한 번만 대체한다
              // (fallbackSrc도 실패할 경우 무한 재시도로 이어지지 않도록 플래그로 막는다).
              if (img.fallbackSrc && !e.currentTarget.dataset.fallbackApplied) {
                e.currentTarget.dataset.fallbackApplied = '1';
                e.currentTarget.src = img.fallbackSrc;
              }
            }}
          />
        ))}
        {icon && <span className="choice-card__icon">{icon}</span>}
      </span>
      <span className="choice-card__label">{label}</span>
    </button>
  );
}
