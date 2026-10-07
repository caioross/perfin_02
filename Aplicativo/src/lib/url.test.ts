import { afterEach, describe, expect, it, vi } from "vitest";
import { urlDoSite } from "./url";

describe("urlDoSite", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("usa NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portal-perfin.vercel.app");
    expect(urlDoSite("/auth/callback")).toBe("https://portal-perfin.vercel.app/auth/callback");
  });

  it("não deixa um caminho absoluto trocar o domínio", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portal-perfin.vercel.app");
    expect(new URL(urlDoSite("/visao-geral")).origin).toBe("https://portal-perfin.vercel.app");
  });

  it("falha fechado sem a variável", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(() => urlDoSite("/x")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
