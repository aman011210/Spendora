export default function LoadingIndicator({ label = "Loading your data..." }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
