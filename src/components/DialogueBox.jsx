export default function DialogueBox({ lines }) {
  return (
    <div className="dialogue-box">
      {lines.map((line, i) => (
        <p key={i} className={`dialogue-line dialogue-line--${line.speaker === '내레이션' ? 'narration' : 'speech'}`}>
          {line.speaker !== '내레이션' && <strong className="dialogue-line__speaker">{line.speaker}</strong>}
          <span>{line.text}</span>
        </p>
      ))}
    </div>
  );
}
