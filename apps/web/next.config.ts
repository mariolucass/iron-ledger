import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Acesso ao dev server por outros dispositivos via Tailscale (IP 100.x.y.z ou MagicDNS)
  allowedDevOrigins: ["100.*.*.*", "*.ts.net", "**.ts.net"],

  // Requer: npm i -D babel-plugin-react-compiler
  reactCompiler: true,

  // Links tipados (<Link href> e router.push checados em build)
  typedRoutes: true,

  // Imagem Docker enxuta; remova se o deploy não for em container/Node próprio
  output: "standalone",

  // Opt-in consciente: muda o modelo de cache (ver notas abaixo)
  // cacheComponents: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // { protocol: "https", hostname: "cdn.seudominio.com" },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  agentRules: false,
};

export default nextConfig;
