/**
 * İSTEK BİLGİSİ — IP ve tarayıcı bilgisi
 *
 * IP, ip-allowlist.ts içindeki clientIpFromHeaders ile okunur: X-Forwarded-For
 * listesinin istemcinin taklit edebileceği BAŞI değil, vekilin eklediği SONU.
 */

import "server-only";
import { headers } from "next/headers";
import { clientIpFromHeaders } from "@/lib/ip-allowlist";

export type RequestInfo = { ip: string; userAgent: string };

export async function getRequestInfo(): Promise<RequestInfo> {
  const h = await headers();
  const ip = clientIpFromHeaders((name) => h.get(name)) || "0.0.0.0";
  const userAgent = (h.get("user-agent") ?? "").slice(0, 400);
  return { ip: ip.slice(0, 60), userAgent };
}

/** Tarayıcı bilgisinden okunabilir bir cihaz adı üretir. */
export function describeDevice(userAgent: string): string {
  const ua = userAgent || "";
  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : /Firefox\//.test(ua) ? "Firefox"
    : "Tarayıcı";
  const os =
    /iPhone|iPad/.test(ua) ? "iOS"
    : /Android/.test(ua) ? "Android"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Windows/.test(ua) ? "Windows"
    : /Linux/.test(ua) ? "Linux"
    : "Bilinmeyen sistem";
  return `${browser} · ${os}`;
}
