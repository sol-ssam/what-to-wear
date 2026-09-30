export default function SoundToggle({ soundOn, onToggle }) {
  return (
    <button type="button" className="sound-toggle" onClick={onToggle} aria-pressed={soundOn}>
      {soundOn ? '🔊 효과음 켜짐' : '🔈 효과음 꺼짐'}
    </button>
  );
}
