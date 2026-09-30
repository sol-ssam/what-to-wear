export default function ProgressBar({ storyLabel, current, total, location, title }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__top">
        <span className="progress-bar__story">{storyLabel}</span>
        <span className="progress-bar__count">
          {current} / {total}
        </span>
      </div>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${(current / total) * 100}%` }} />
      </div>
      <p className="progress-bar__location">{location}</p>
      <h2 className="progress-bar__title">{title}</h2>
    </div>
  );
}
