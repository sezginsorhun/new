export const metadata = { title: "Sayfa bulunamadı | NİLSER Alüminyum" };

export default function NotFound() {
  return (
    <main>
      <section className="section">
        <div className="wrap center">
          <a href="/" style={{ display: "inline-block", marginBottom: 48 }}>
            <img src="/assets/img/logo-ink.svg" alt="NİLSER Alüminyum Sistemleri" width="235" height="69" />
          </a>
          <br />
          <span className="eyebrow">404</span>
          <h1 className="h1" style={{ margin: "18px 0" }}>Bu ölçü tutmadı.</h1>
          <p className="lead" style={{ marginInline: "auto" }}>Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p>
          <div className="hero__actions" style={{ justifyContent: "center" }}>
            <a className="btn" href="/">Ana sayfa</a>
            <a className="btn btn--ghost" href="/iletisim/">İletişim</a>
          </div>
        </div>
      </section>
    </main>
  );
}
