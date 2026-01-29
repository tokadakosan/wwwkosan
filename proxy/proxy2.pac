function FindProxyForURL(url, host) { 
  if (
    dnsDomainIs(host, "env.b4iine.net")  ||
    dnsDomainIs(host, "cloud.ielove.jp")  ||
    dnsDomainIs(host, "mirai-map.anabuki-kosan.co.jp")  ||
    dnsDomainIs(host, "wp.svr.anabuki-kosan.co.jp")  ||
    dnsDomainIs(host, "somu.anabuki-kosan.co.jp") ||
    dnsDomainIs(host, "www.releaseapps.jp") ||
    dnsDomainIs(host, "www.kyc.releaseapps.jp") ||
    dnsDomainIs(host, "auth.releaseapps.jp") ||
    dnsDomainIs(host, "anabuki-kosan.cybozu.com") ||
    dnsDomainIs(host, "eisui.anabuki-kosan.co.jp") ||
    dnsDomainIs(host, "manual.anabuki.ne.jp")
  ) {
    return "PROXY 162.43.87.170:8928"; 
  } else {
      return "DIRECT"; 
  }
}
