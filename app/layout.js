/* Yalnızca 404 sayfası için kullanılır; diğer tüm sayfalar public/ altındaki düz HTML'dir. */
export const metadata = { robots: { index: false } };

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="stylesheet" href="/assets/site.css" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
