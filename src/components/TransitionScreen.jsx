// 이야기1 마무리 화면과 이야기2 전환 화면에 함께 쓰는 단순한 안내 화면.
// tone("story1" | "story2")으로 배경색을 다르게 줘서 날짜·이야기가
// 바뀌었음을 시각적으로도 드러낸다.
export default function TransitionScreen({ title, lines, buttonLabel, onContinue, tone }) {
  return (
    <div className={`screen transition-screen transition-screen--${tone}`}>
      <h2 className="transition-screen__title">{title}</h2>
      <div className="transition-screen__body">
        {lines.map((line, i) => (
          <p key={i} className="transition-screen__line">
            {line}
          </p>
        ))}
      </div>
      <button type="button" className="btn btn--primary btn--large" onClick={onContinue}>
        {buttonLabel}
      </button>
    </div>
  );
}
