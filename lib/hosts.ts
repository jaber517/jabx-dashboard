const DEFAULT_PRIVATE_HOSTS = "dash.jabx.me,dash.localhost";

export function hostnameWithoutPort(host: string): string {
  try {
    return new URL(`http://${host}`).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return "";
  }
}

export function privateHosts(): string[] {
  return (process.env.PRIVATE_HOSTS ?? DEFAULT_PRIVATE_HOSTS)
    .split(",")
    .map((host) => hostnameWithoutPort(host.trim()))
    .filter(Boolean);
}

export function isPrivateHost(host: string): boolean {
  return privateHosts().includes(hostnameWithoutPort(host));
}

export function privateNewsUrl(requestUrl: URL): URL {
  const first = privateHosts()[0];
  const local = !first || first === "localhost" || first.endsWith(".localhost") || !first.includes(".");
  if (!local) return new URL(`https://${first}/ai-news`);

  const url = new URL(requestUrl);
  url.hostname = first && (first === "localhost" || first.endsWith(".localhost")) ? first : "dash.localhost";
  url.pathname = "/ai-news";
  url.search = "";
  return url;
}
