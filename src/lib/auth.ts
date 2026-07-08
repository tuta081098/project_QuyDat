const JWT_SECRET = process.env.JWT_SECRET || "default-fallback-secret-key-keep-it-safe";

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"]
  );
}

// Tạo Token Session thời hạn 24 giờ
export async function createToken(payload: { username: string }): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; 
  const encodedPayload = btoa(JSON.stringify({ ...payload, exp }));
  
  const key = await getKey();
  const partialToken = `${header}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(partialToken)
  );
  
  const b64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    
  return `${partialToken}.${b64Signature}`;
}

// Xác thực Token có bị sửa đổi hoặc quá hạn không
export async function verifyToken(token: string): Promise<any> {
  try {
    const [header, encodedPayload, signature] = token.split(".");
    if (!header || !encodedPayload || !signature) return null;
    
    const key = await getKey();
    const partialToken = `${header}.${encodedPayload}`;
    
    const b64 = signature.replace(/-/g, "+").replace(/_/g, "/");
    const binaryStr = atob(b64);
    const sigBuffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      sigBuffer[i] = binaryStr.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify("HMAC", key, sigBuffer, new TextEncoder().encode(partialToken));
    if (!isValid) return null;
    
    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    
    return payload;
  } catch {
    return null;
  }
}