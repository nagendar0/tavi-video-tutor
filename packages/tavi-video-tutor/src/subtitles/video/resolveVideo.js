import fs from 'fs';
import path from 'path';
import net from 'net';
import http from 'http';
import https from 'https';
import { promises as dns } from 'dns';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

/**
 * Parses an individual IPv4 address part (decimal, hex, or octal).
 */
const parseIPv4Part = (partStr) => {
  if (!partStr || typeof partStr !== 'string') return null;
  const p = partStr.trim();
  if (!p) return null;
  let val;
  if (/^0x[0-9a-fA-F]+$/i.test(p)) {
    val = parseInt(p, 16);
  } else if (/^0[0-7]+$/.test(p)) {
    val = parseInt(p, 8);
  } else if (/^\d+$/.test(p)) {
    val = parseInt(p, 10);
  } else {
    return null;
  }
  if (!Number.isSafeInteger(val) || val < 0 || isNaN(val)) return null;
  return val;
};

/**
 * Parses an IPv4 address (dotted decimal, integer, hex, or octal in 1, 2, 3, or 4 parts)
 * into a 32-bit unsigned integer per POSIX inet_aton standard.
 * Returns null if invalid.
 */
export const parseIPv4ToUint32 = (ipStr) => {
  if (!ipStr || typeof ipStr !== 'string') return null;
  const clean = ipStr.trim();

  const parts = clean.split('.');
  if (parts.length < 1 || parts.length > 4) return null;

  const parsedParts = [];
  for (const part of parts) {
    const val = parseIPv4Part(part);
    if (val === null) return null;
    parsedParts.push(val);
  }

  // 1 part (a): 32-bit integer (e.g. "2130706433" or "0x7f000001")
  if (parsedParts.length === 1) {
    if (parsedParts[0] > 0xffffffff) return null;
    return parsedParts[0] >>> 0;
  }

  // 2 parts (a.b): a is 8 bits (0..255), b is 24 bits (0..16777215) (e.g. "127.1")
  if (parsedParts.length === 2) {
    if (parsedParts[0] > 255 || parsedParts[1] > 0xffffff) return null;
    return (((parsedParts[0] << 24) >>> 0) | parsedParts[1]) >>> 0;
  }

  // 3 parts (a.b.c): a is 8 bits, b is 8 bits, c is 16 bits (0..65535) (e.g. "127.0.1")
  if (parsedParts.length === 3) {
    if (parsedParts[0] > 255 || parsedParts[1] > 255 || parsedParts[2] > 0xffff) return null;
    return (((parsedParts[0] << 24) >>> 0) | (parsedParts[1] << 16) | parsedParts[2]) >>> 0;
  }

  // 4 parts (a.b.c.d): each is 8 bits (0..255)
  if (parsedParts.length === 4) {
    if (parsedParts.some(p => p > 255)) return null;
    return (((parsedParts[0] << 24) >>> 0) | (parsedParts[1] << 16) | (parsedParts[2] << 8) | parsedParts[3]) >>> 0;
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
    parsedUrl.address = parsedUrl.hostname;
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

  parsedUrl.address = addresses[0].address;
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
    const validatedUrl = await validateResolvedRemoteHost(currentUrl, options);
    const pinnedIp = validatedUrl.address || validatedUrl.hostname;

    try {
      const isHttps = validatedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const agent = isHttps
        ? new https.Agent({
            keepAlive: false,
            lookup: (_hostname, _opts, cb) => {
              cb(null, pinnedIp, net.isIP(pinnedIp));
            }
          })
        : new http.Agent({
            keepAlive: false,
            lookup: (_hostname, _opts, cb) => {
              cb(null, pinnedIp, net.isIP(pinnedIp));
            }
          });

      const timeoutMs = options.timeoutMs || 30000;
      const maxDownloadBytes = options.maxDownloadBytes ?? 2 * 1024 * 1024 * 1024;

      const response = await new Promise((resolve, reject) => {
        const req = client.request(validatedUrl, {
          method: 'GET',
          agent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
          },
          timeout: timeoutMs
        });

        const timer = setTimeout(() => {
          req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        req.on('error', (err) => {
          clearTimeout(timer);
          agent.destroy();
          reject(err);
        });

        req.on('response', (res) => {
          clearTimeout(timer);
          resolve({ res, agent });
        });

        req.end();
      });

      const res = response.res;
      const resAgent = response.agent;

      // Handle Redirects with Security Re-validation
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        resAgent.destroy();
        const location = res.headers['location'];
        if (!location) {
          throw new Error(`HTTP ${res.statusCode} redirect missing Location header.`);
        }
        const resolvedRedirect = new URL(location, currentUrl).toString();
        redirectCount++;
        if (redirectCount > maxRedirects) {
          throw new Error(`REDIRECT_LIMIT: Exceeded maximum allowed redirects (${maxRedirects}).`);
        }
        currentUrl = resolvedRedirect;
        continue;
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        resAgent.destroy();
        throw new Error(`HTTP_${res.statusCode}: Failed to fetch media from ${redactUrlSecrets(currentUrl)}`);
      }

      const contentLength = Number(res.headers['content-length'] || 0);
      if (Number.isFinite(contentLength) && contentLength > maxDownloadBytes) {
        resAgent.destroy();
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

      await pipeline(res, sizeGuard, fileStream);
      resAgent.destroy();

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
