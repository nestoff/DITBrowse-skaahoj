import type { ReactElement } from "react";

export function App(): ReactElement {
  return (
    <main className="app-shell">
      <header className="top-bar">
        <strong>DITBrowse</strong>
      </header>
      <section className="empty-start">Tiled camera browser workspace</section>
    </main>
  );
}
