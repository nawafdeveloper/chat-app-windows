const statusItems = [
  ["Electron", window.electronAPI.versions.electron],
  ["Chrome", window.electronAPI.versions.chrome],
  ["Node", window.electronAPI.versions.node],
  ["Platform", window.electronAPI.platform],
] as const;

export function RuntimeStatus() {
  return (
    <section className="status-panel" aria-labelledby="status-title">
      <h2 id="status-title">Runtime</h2>
      <ul>
        {statusItems.map(([label, value]) => (
          <li key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
