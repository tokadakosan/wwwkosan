function FindProxyForURL(url, host) { 
  if (
    dnsDomainIs(host, "env.b4iine.net")  ||
    dnsDomainIs(host, "cloud.ielove.jp")  ||
    dnsDomainIs(host, "wp.svr.anabuki-kosan.co.jp")  ||
    dnsDomainIs(host, "manual.anabuki.ne.jp")
  ) {
    return "PROXY 162.43.87.170:8928"; 
  } else {
      return "DIRECT"; 
  }
}
