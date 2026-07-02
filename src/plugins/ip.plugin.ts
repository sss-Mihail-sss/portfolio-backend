import { Elysia } from "elysia";

// Ordered by reliability: standard → CDN/cloud → misc proxies
const PROXY_HEADERS = [
  "x-real-ip",
  "x-client-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "fly-client-ip",
  "fastly-client-ip",
  "x-cluster-client-ip",
  "appengine-user-ip",
  "cf-pseudo-ipv4",
  "forwarded-for",
  "forwarded",
  "x-forwarded",
] as const;

// name → deduplication: plugin runs once even when used in multiple instances
export const ipPlugin = new Elysia({ name: "plugin/ip" }).derive(
  "global",
  ({ server, request }) => {
    // 1. Direct socket (no spoofing possible)
    const socket = server?.requestIP(request);
    if (socket) {
      return {
        ip: socket.address,
      };
    }

    // 2. Standard proxy header (nginx, AWS ALB, etc.)
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return {
        ip: forwarded.split(",")[0].trim(),
      };
    }

    // 3. Platform-specific headers
    for (const header of PROXY_HEADERS) {
      const value = request.headers.get(header);
      if (value) {
        return {
          ip: value.trim(),
        };
      }
    }

    return {
      ip: null,
    };
  },
);
