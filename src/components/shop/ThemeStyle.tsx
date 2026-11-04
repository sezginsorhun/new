/**
 * TEMA STİLİ — panelden yazılan CSS'i sayfaya basar
 *
 * Sunucuda render edilir: stil HTML ile birlikte gelir, sayfa önce
 * varsayılan renklerle açılıp sonra zıplamaz.
 *
 * Yalnızca vitrinde kullanılır. Panelde BİLEREK yok — hatalı bir CSS
 * siteyi bozduğunda onu düzelteceğin ekran sağlam kalsın diye.
 */

import { getSettings } from "@/lib/settings";
import { buildThemeCss } from "@/lib/theme";

export default async function ThemeStyle() {
  const settings = await getSettings();
  const css = buildThemeCss(settings);
  if (!css) return null;

  return (
    <style
      id="tema"
      // İçerik lib/theme.ts içinde temizlenir: </style> kaçışı, script,
      // @import ve javascript: kalıpları ayıklanmış olarak gelir.
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
