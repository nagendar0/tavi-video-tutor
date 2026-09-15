import fs from 'fs';
import path from 'path';
import net from 'net';
import { promises as dns } from 'dns';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

/**
 * Parses an IPv4 address (dotted decimal, integer, hex, or octal) into a 32-bit unsigned integer.
 * Returns null if invalid.
 */
export const parseIPv4ToUint32 = (ipStr) => {
  if (!ipStr || typeof ipStr !== 'string') return null;
  const clean = ipStr.trim();

  // Pure integer / decimal representation (e.g. "2130706433")
  if (/^\d+$/.test(clean)) {
    const num = Number(clean);
    if (Number.isSafeInteger(num) && num >= 0 && num <= 0xffffffff) {
      return num >>> 0;
    }
  }

  // Hexadecimal notation (e.g. "0x7f000001")
  if (/^0x[0-9a-fA-F]+$/i.test(clean)) {
    const num = Number(clean);
    if (Number.isSafeInteger(num) && num >= 0 && num <= 0xffffffff) {
      return num >>> 0;
    }
  }

  const parts = clean.split('.');
  if (parts.length === 4) {
    let result = 0;
    for (let i = 0; i < 4; i++) {
      const part = parts[i];
      let val;
      if (/^0x[0-9a-fA-F]+$/i.test(part)) {
        val = parseInt(part, 16);
      } else if (/^0[0-7]+$/.test(part)) {
        val = parseInt(part, 8);
      } else if (/^\d+$/.test(part)) {
        val = parseInt(part, 10);
      } else {
        return null;
      }
      if (val < 0 || val > 255 || isNaN(val)) return null;
      result = (result << 8) | val;
    }
    return result >>> 0;
  }

  return null;
};

/**
 * Checks if a 32-bit IPv4 address belongs to private, loopback, link-local, multicast, or reserved ranges.
 */
export const isPrivateIPv4Uint32 = (ipUint32) => {
  if (ipUint32 === null || ipUint32 === undefined) return false;

  const firstOctet = (ipUint32 >>> 24) & 0xff;
  const secondOctet = (ipUint32 >>> 16) & 0xff;

  // 0.0.0.0/8 (Current network / "this host")
  if (firstOctet === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (firstOctet === 127) return true;

  // 10.0.0.0/8 (Private)
  if (firstOctet === 10) return true;

  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255 Private)
  if (firstOctet === 172 && (secondOctet >= 16 && secondOctet <= 31)) return true;

  // 192.168.0.0/16 (Private)
  if (firstOctet === 192 && secondOctet === 168) return true;

  // 169.254.0.0/16 (Link-local)
  if (firstOctet === 169 && secondOctet === 254) return true;

  // 100.64.0.0/10 (Carrier-Grade NAT)
  if (firstOctet === 100 && (secondOctet >= 64 && secondOctet <= 127)) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (firstOctet === 192 && secondOctet === 0 && ((ipUint32 >>> 8) & 0xff) === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (firstOctet === 192 && secondOctet === 0 && ((ipUint32 >>> 8) & 0xff) === 2) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (firstOctet === 198 && (secondOctet === 18 || secondOctet === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (firstOctet === 198 && secondOctet === 51 && ((ipUint32 >>> 8) & 0xff) === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (firstOctet === 203 && secondOctet === 0 && ((ipUint32 >>> 8) & 0xff) === 113) return true;

  // 224.0.0.0/4 (Multicast 224-239) and 240.0.0.0/4 (Reserved 240-255)
  if (firstOctet >= 224) return true;

  return false;
};

/**
 * Expands an IPv6 address string into an array of 8 16-bit hex integers.
 * Returns null if invalid.
 */
export const expandIPv6 = (ipStr) => {
  if (!ipStr || typeof ipStr !== 'string') return null;
  let clean = ipStr.trim().toLowerCase();

  // Strip brackets if present
  if (clean.startsWith('[') && clean.endsWith(']')) {
    clean = clean.slice(1, -1);
  }

  // Handle IPv4-mapped IPv6 (e.g. "::ffff:127.0.0.1" or "0:0:0:0:0:ffff:127.0.0.1")
  const v4Match = clean.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Match) {
    const v4Uint = parseIPv4ToUint32(v4Match[2]);
    if (v4Uint === null) return null;
    const high = (v4Uint >>> 16) & 0xffff;
    const low = v4Uint & 0xffff;
    clean = `${v4Match[1]}${high.toString(16)}:${low.toString(16)}`;
  }

  const doubleColonCount = (clean.match(/::/g) || []).length;
  if (doubleColonCount > 1) return null;

  let parts;
  if (doubleColonCount === 1) {
    const [head, tail] = clean.split('::');
    const headParts = head ? head.split(':') : [];
    const tailParts = tail ? tail.split(':') : [];
    const missing = 8 - (headParts.length + tailParts.length);
    if (missing < 1) return null;
    const zeroes = new Array(missing).fill('0');
    parts = [...headParts, ...zeroes, ...tailParts];
  } else {
    parts = clean.split(':');
  }

  if (parts.length !== 8) return null;

  const words = [];
  for (const p of parts) {
    if (!/^[0-9a-f]{1,4}$/i.test(p)) return null;
    words.push(parseInt(p, 16));
  }

  return words;
};

/**
 * Comprehensive SSRF validator for IP addresses and hostnames.
 */
export const isPrivateHost = (hostname) => {
  if (!hostname || typeof hostname !== 'string') return true;
  let hostClean = String(hostname).trim().toLowerCase();

  // Strip port if present (when passing raw host header string)
  if (hostClean.includes(':') && !hostClean.startsWith('[') && (hostClean.match(/:/g) || []).length === 1) {
    hostClean = hostClean.split(':')[0];
  }

  // Strip brackets for IPv6
  if (hostClean.startsWith('[') && hostClean.endsWith(']')) {
    hostClean = hostClean.slice(1, -1);
  }

  // 1. Hostname Domain Pattern Checks
  if (
    hostClean === 'localhost' ||
    hostClean.endsWith('.localhost') ||
    hostClean.endsWith('.local') ||
    hostClean.endsWith('.internal') ||
    hostClean.endsWith('.lan') ||
    hostClean.endsWith('.home.arpa') ||
    hostClean.endsWith('.localdomain') ||
    hostClean.endsWith('.corp') ||
    hostClean === '0.0.0.0' ||
    hostClean === '::'
  ) {
    return true;
  }

  // 2. IPv4 Checks (including decimal, octal, hex)
  const v4Uint = parseIPv4ToUint32(hostClean);
  if (v4Uint !== null) {
    return isPrivateIPv4Uint32(v4Uint);
  }

  // 3. IPv6 Checks
  const v6Words = expandIPv6(hostClean);
  if (v6Words !== null) {
    const isAllZero = v6Words.every(w => w === 0);
    if (isAllZero) return true; // Unspecified ::

    // Loopback ::1
    if (v6Words.slice(0, 7).every(w => w === 0) && v6Words[7] === 1) {
      return true;
    }

    // IPv4-mapped IPv6 (::ffff:x.x.x.x) or IPv4-compatible (::x.x.x.x)
    const isV4Mapped = v6Words.slice(0, 5).every(w => w === 0) && (v6Words[5] === 0xffff || v6Words[5] === 0);
    if (isV4Mapped) {
      const embeddedV4 = ((v6Words[6] << 16) | v6Words[7]) >>> 0;
      return isPrivateIPv4Uint32(embeddedV4);
    }

    const firstWord = v6Words[0];

    // Unique Local fc00::/7 (fc00: - fdff:)
    if ((firstWord & 0xfe00) === 0xfc00) return true;

    // Link-Local fe80::/10 (fe80: - febf:)
    if ((firstWord & 0xffc0) === 0xfe80) return true;

    // Site-Local deprecated fec0::/10 (fec0: - feff:)
    if ((firstWord & 0xffc0) === 0xfec0) return true;

    // Discard Prefix 100::/64
    if (firstWord === 0x0100 && v6Words.slice(1, 4).every(w => w === 0)) return true;

    // Documentation 2001:db8::/32
    if (firstWord === 0x2001 && v6Words[1] === 0x0db8) return true;

    // Benchmarking 2001:2::/48
    if (firstWord === 0x2001 && v6Words[1] === 0x0002) return true;

    // 6to4 mapped 2002::/16
    if (firstWord === 0x2002) {
      const embeddedV4 = ((v6Words[1] << 16) | v6Words[2]) >>> 0;
      if (isPrivateIPv4Uint32(embeddedV4)) return true;
    }

    return false;
  }

  return false;
};

export const redactUrlSecrets = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  try {
    const urlObj = new URL(rawUrl);
    const sensitiveKeys = ['token', 'signature', 'key', 'expires', 'auth', 'sig', 'access_token', 'apiKey'];
    urlObj.searchParams.forEach((_, paramKey) => {
      if (sensitiveKeys.some(k => paramKey.toLowerCase().includes(k))) {
        urlObj.searchParams.set(paramKey, '[REDACTED]');
      }
    });
    return urlObj.toString();
  } catch (_) {
    return rawUrl;
  }
};

export const validateRemoteUrl = (rawUrl, options = {}) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch (err) {
    throw new Error(`INVALID_URL: Failed to parse URL '${redactUrlSecrets(rawUrl)}': ${err.message}`);
  }

  // 1. Protocol Policy Check: ONLY http: and https: are permitted
  const protocol = parsedUrl.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`BLOCKED_PROTOCOL: Protocol '${protocol}' is not supported. Only http: and https: are allowed.`);
  }

  // 2. SSRF Private / Loopback / Link-Local IP Protection
  const hostname = parsedUrl.hostname;
  if (!options.allowPrivateNetwork && isPrivateHost(hostname)) {
    throw new Error(`SSRF_BLOCKED: Hostname '${hostname}' resolves to a restricted private or loopback network address.`);
  }

  return parsedUrl;
};

/**
 * Reject hostnames that resolve to a restricted address. This complements the
 * literal-host check above and prevents a public-looking DNS name from being
 * used as a proxy to a private network.
 */
export const validateResolvedRemoteHost = async (rawUrl, options = {}) => {
  const parsedUrl = validateRemoteUrl(rawUrl, options);
  if (options.allowPrivateNetwork || net.isIP(parsedUrl.hostname)) {
    return parsedUrl;
  }

  let addresses;
  try {
    addresses = await dns.lookup(parsedUrl.hostname, { all: true, verbatim: true });
  } catch (err) {
    throw new Error(`SSRF_DNS_FAILED: Unable to resolve '${parsedUrl.hostname}': ${err.message}`);
  }

  if (!addresses.length || addresses.some(({ address }) => isPrivateHost(address))) {
    throw new Error(`SSRF_BLOCKED: Hostname '${parsedUrl.hostname}' resolves to a restricted private or loopback network address.`);
  }

  return parsedUrl;
};

export const resolveDirectMediaSource = (videoEntry, tempWorkspace, options = {}) => {
  const src = videoEntry.src;

  // 1. Local file path handling
  if (!src.startsWith('http://') && !src.startsWith('https://')) {
    let localPath = path.isAbsolute(src) ? src : path.join(tempWorkspace.cwd, src);
    if (!fs.existsSync(localPath) && src.startsWith('/')) {
      const publicPath = path.join(tempWorkspace.cwd, 'public', src.slice(1));
      if (fs.existsSync(publicPath)) {
        localPath = publicPath;
      }
    }
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local video file not found at path: ${localPath}`);
    }
    return {
      type: 'local',
      filePath: localPath,
      isDirectUrl: false,
      isTemporary: false
    };
  }

  // 2. Direct HTTP/HTTPS Remote URL Validation
  validateRemoteUrl(src, options);

  return {
    type: 'remote',
    filePath: src,
    redactedUrl: redactUrlSecrets(src),
    isDirectUrl: true,
    isTemporary: false
  };
};

export const resolveVideoSource = async (videoEntry, tempWorkspace, options = {}) => {
  const direct = resolveDirectMediaSource(videoEntry, tempWorkspace, options);
  if (direct.type === 'local') {
    return direct;
  }

  const ext = path.extname(videoEntry.src.split('?')[0]) || '.mp4';
  const targetPath = tempWorkspace.getPath(`input${ext}`);
  const maxRedirects = options.maxRedirects || 5;

  let currentUrl = videoEntry.src;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    await validateResolvedRemoteHost(currentUrl, options);

    try {
      const controller = new AbortController();
      const timeoutMs = options.timeoutMs || 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
        },
        redirect: 'manual',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle Redirects with Security Re-validation
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error(`HTTP ${response.status} redirect missing Location header.`);
        }
        const resolvedRedirect = new URL(location, currentUrl).toString();
        redirectCount++;
        if (redirectCount > maxRedirects) {
          throw new Error(`REDIRECT_LIMIT: Exceeded maximum allowed redirects (${maxRedirects}).`);
        }
        currentUrl = resolvedRedirect;
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}: Failed to fetch media from ${redactUrlSecrets(currentUrl)}`);
      }

      const maxDownloadBytes = options.maxDownloadBytes ?? 2 * 1024 * 1024 * 1024;
      const contentLength = Number(response.headers.get('content-length') || 0);
      if (Number.isFinite(contentLength) && contentLength > maxDownloadBytes) {
        throw new Error(`MEDIA_TOO_LARGE: Remote media declares ${contentLength} bytes; limit is ${maxDownloadBytes} bytes.`);
      }

      const fileStream = fs.createWriteStream(targetPath);
      let downloadedBytes = 0;
      const sizeGuard = new Transform({
        transform(chunk, encoding, callback) {
          downloadedBytes += chunk.length;
          if (downloadedBytes > maxDownloadBytes) {
            callback(new Error(`MEDIA_TOO_LARGE: Remote media exceeded ${maxDownloadBytes} bytes.`));
            return;
          }
          callback(null, chunk);
        }
      });
      await pipeline(Readable.fromWeb(response.body), sizeGuard, fileStream);

      return {
        type: 'downloaded',
        filePath: targetPath,
        redactedUrl: redactUrlSecrets(videoEntry.src),
        isDirectUrl: false,
        isTemporary: true
      };
    } catch (err) {
      if (err.message.startsWith('SSRF_BLOCKED') || err.message.startsWith('BLOCKED_PROTOCOL')) {
        throw err;
      }
      throw new Error(`MEDIA_FETCH_FAILED: ${err.message}`);
    }
  }

  throw new Error(`REDIRECT_LIMIT: Exceeded maximum allowed redirects (${maxRedirects}).`);
};
