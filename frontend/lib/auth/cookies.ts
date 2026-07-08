export function splitSetCookieHeader(header: string) {
  return header
    .split(/,(?=\s*[^;,\s]+=)/)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

export function getSetCookieHeaders(headers: Headers) {
  const headersWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithGetSetCookie.getSetCookie === "function") {
    return headersWithGetSetCookie.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? splitSetCookieHeader(setCookieHeader) : [];
}

export function rewriteCookieForFrontend(cookie: string) {
  const attributes = cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !part.toLowerCase().startsWith("domain="))
    .filter((part) => !part.toLowerCase().startsWith("path="));

  return [...attributes, "Path=/"].join("; ");
}

export function mergeSetCookiesIntoCookieHeader(
  cookieHeader: string,
  setCookieHeaders: string[],
) {
  const cookies = new Map<string, string>();

  cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const separatorIndex = cookie.indexOf("=");

      if (separatorIndex > 0) {
        cookies.set(cookie.slice(0, separatorIndex), cookie.slice(separatorIndex + 1));
      }
    });

  setCookieHeaders.forEach((setCookieHeader) => {
    const [nameValue] = setCookieHeader.split(";");
    const separatorIndex = nameValue.indexOf("=");

    if (separatorIndex > 0) {
      cookies.set(
        nameValue.slice(0, separatorIndex).trim(),
        nameValue.slice(separatorIndex + 1).trim(),
      );
    }
  });

  return Array.from(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}
