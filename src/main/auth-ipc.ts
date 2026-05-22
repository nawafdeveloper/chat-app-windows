import { app, ipcMain, safeStorage, session as electronSession } from "electron";
import { parseSetCookieHeader, splitSetCookieHeader } from "better-auth/cookies";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  AUTH_BASE_URL,
  AUTH_FETCH_CHANNEL,
  AUTH_FLOW_GET_CHANNEL,
  AUTH_FLOW_RESET_CHANNEL,
  AUTH_PROTOCOL_SCHEME,
  AUTH_SEND_PHONE_OTP_CHANNEL,
  AUTH_VERIFY_PHONE_OTP_CHANNEL,
  type AuthFlowState,
  type AuthFetchRequest,
  type AuthFetchResponse,
  type SendPhoneOtpRequest,
  type VerifyPhoneOtpRequest,
} from "../shared/auth-ipc";

type StoredCookie = {
  value: string;
  expires: string | null;
};

type CookieJar = Record<string, StoredCookie>;

type PersistedCookieJar = {
  encrypted: boolean;
  value: string;
};

const defaultAuthFlowState: AuthFlowState = {
  currentStep: "phoneForm",
  phone: "",
  dialCode: "",
};

let cookieJarCache: CookieJar | null = null;
let didMigrateElectronCookies = false;

function getCookieStorePath(): string {
  return join(app.getPath("userData"), "auth-session.json");
}

function getAuthFlowStorePath(): string {
  return join(app.getPath("userData"), "auth-flow.json");
}

function readAuthFlowState(): AuthFlowState {
  const storePath = getAuthFlowStorePath();

  if (!existsSync(storePath)) {
    return defaultAuthFlowState;
  }

  try {
    const state = JSON.parse(readFileSync(storePath, "utf8")) as Partial<AuthFlowState>;

    return {
      currentStep: state.currentStep === "otpForm" ? "otpForm" : "phoneForm",
      phone: typeof state.phone === "string" ? state.phone : "",
      dialCode: typeof state.dialCode === "string" ? state.dialCode : "",
    };
  } catch {
    return defaultAuthFlowState;
  }
}

function writeAuthFlowState(state: AuthFlowState): void {
  const storePath = getAuthFlowStorePath();
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(state), "utf8");
}

function resetAuthFlowState(): void {
  writeAuthFlowState(defaultAuthFlowState);
}

function readCookieJar(): CookieJar {
  if (cookieJarCache) {
    return cookieJarCache;
  }

  const storePath = getCookieStorePath();
  if (!existsSync(storePath)) {
    cookieJarCache = {};
    return cookieJarCache;
  }

  try {
    const persisted = JSON.parse(readFileSync(storePath, "utf8")) as PersistedCookieJar;
    const rawValue =
      persisted.encrypted && safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(Buffer.from(persisted.value, "base64"))
        : persisted.value;

    cookieJarCache = JSON.parse(rawValue) as CookieJar;
  } catch (error) {
    console.error("Failed to read stored auth cookies.", error);
    cookieJarCache = {};
  }

  return cookieJarCache;
}

function writeCookieJar(jar: CookieJar): void {
  cookieJarCache = jar;

  const storePath = getCookieStorePath();
  mkdirSync(dirname(storePath), { recursive: true });

  const rawValue = JSON.stringify(jar);
  const persisted: PersistedCookieJar = safeStorage.isEncryptionAvailable()
    ? {
        encrypted: true,
        value: safeStorage.encryptString(rawValue).toString("base64"),
      }
    : {
        encrypted: false,
        value: rawValue,
      };

  writeFileSync(storePath, JSON.stringify(persisted), "utf8");
}

async function migrateCookiesFromElectronSession(): Promise<void> {
  if (didMigrateElectronCookies) {
    return;
  }

  didMigrateElectronCookies = true;

  const jar = readCookieJar();
  if (Object.keys(jar).length > 0) {
    return;
  }

  try {
    const authUrl = new URL(AUTH_BASE_URL);
    const cookies = await electronSession.defaultSession.cookies.get({ url: authUrl.origin });
    let changed = false;

    for (const cookie of cookies) {
      const normalizedName = cookie.name.startsWith("__Secure-") ? cookie.name.slice(9) : cookie.name;

      if (!normalizedName.startsWith("better-auth")) {
        continue;
      }

      jar[cookie.name] = {
        value: cookie.value,
        expires: cookie.expirationDate
          ? new Date(cookie.expirationDate * 1000).toISOString()
          : null,
      };
      changed = true;
    }

    if (changed) {
      writeCookieJar(jar);
    }
  } catch (error) {
    console.error("Failed to migrate Electron auth cookies.", error);
  }
}

async function getCookieHeader(): Promise<string> {
  await migrateCookiesFromElectronSession();

  const jar = readCookieJar();
  const now = new Date();
  let changed = false;

  const cookies = Object.entries(jar).flatMap(([name, cookie]) => {
    if (cookie.expires && new Date(cookie.expires) <= now) {
      delete jar[name];
      changed = true;
      return [];
    }

    return [`${name}=${cookie.value}`];
  });

  if (changed) {
    writeCookieJar(jar);
  }

  return cookies.join("; ");
}

function getSetCookieHeaders(headers: Headers): string[] {
  const setCookieHeaders = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();

  if (setCookieHeaders?.length) {
    return setCookieHeaders;
  }

  const combinedSetCookie = headers.get("set-cookie");
  return combinedSetCookie ? splitSetCookieHeader(combinedSetCookie) : [];
}

function mergeSetCookieHeaders(setCookieHeaders: string[]): void {
  if (setCookieHeaders.length === 0) {
    return;
  }

  const jar = readCookieJar();
  const now = Date.now();

  for (const setCookieHeader of setCookieHeaders) {
    const parsedCookies = parseSetCookieHeader(setCookieHeader);

    for (const [name, cookie] of parsedCookies.entries()) {
      const maxAge = cookie["max-age"];
      const expires =
        typeof maxAge === "number"
          ? new Date(now + maxAge * 1000)
          : cookie.expires instanceof Date
            ? cookie.expires
            : null;

      if (maxAge === 0 || (expires && expires.getTime() <= now) || !cookie.value) {
        delete jar[name];
        continue;
      }

      jar[name] = {
        value: cookie.value,
        expires: expires ? expires.toISOString() : null,
      };
    }
  }

  writeCookieJar(jar);
}

function assertAuthUrl(url: string): URL {
  const requestUrl = new URL(url);
  const authUrl = new URL(AUTH_BASE_URL);

  if (requestUrl.origin !== authUrl.origin) {
    throw new Error(`Blocked non-auth request to ${requestUrl.origin}.`);
  }

  return requestUrl;
}

async function buildRequestHeaders(payloadHeaders?: [string, string][]): Promise<Headers> {
  const headers = new Headers(payloadHeaders);
  const cookieHeader = await getCookieHeader();

  headers.delete("cookie");
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.set("electron-origin", `${AUTH_PROTOCOL_SCHEME}:/`);
  headers.set("user-agent", app.userAgentFallback);

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  return headers;
}

function clearCookieJar(): void {
  writeCookieJar({});
}

function resolveAuthPath(path: string): string {
  return new URL(path.replace(/^\//, ""), AUTH_BASE_URL).toString();
}

async function fetchWithElectronSession(payload: AuthFetchRequest): Promise<AuthFetchResponse> {
  const requestUrl = assertAuthUrl(payload.url);
  const method = payload.init?.method?.toUpperCase() ?? "GET";
  const headers = await buildRequestHeaders(payload.init?.headers);
  const body = method === "GET" || method === "HEAD" ? undefined : payload.init?.body ?? undefined;

  const response = await fetch(requestUrl, {
    method,
    headers,
    body,
    redirect: payload.init?.redirect,
  });

  mergeSetCookieHeaders(getSetCookieHeaders(response.headers));

  if (requestUrl.pathname.endsWith("/sign-out")) {
    clearCookieJar();
    resetAuthFlowState();
  }

  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    headers: Array.from(response.headers.entries()).filter(
      ([key]) => !["set-cookie", "content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase()),
    ),
    body: response.body ? await response.text() : null,
  };
}

function parseJsonBody(body: string | null): unknown {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function getResponseErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const error = record.error;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object" && typeof (error as Record<string, unknown>).message === "string") {
      return (error as Record<string, string>).message;
    }
  }

  return fallback;
}

async function postAuthJson(path: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetchWithElectronSession({
    url: resolveAuthPath(path),
    init: {
      method: "POST",
      headers: [["content-type", "application/json"]],
      body: JSON.stringify(body),
    },
  });
  const payload = parseJsonBody(response.body);

  if (response.status < 200 || response.status >= 300) {
    throw new Error(getResponseErrorMessage(payload, response.statusText || "Request failed."));
  }

  return payload;
}

async function getElectronSession(): Promise<unknown | null> {
  const response = await fetchWithElectronSession({
    url: resolveAuthPath("/get-session"),
    init: {
      method: "GET",
      headers: [["accept", "application/json"]],
    },
  });

  if (response.status === 401) {
    return null;
  }

  const payload = parseJsonBody(response.body);
  return payload ?? null;
}

function normalizePhonePayload(phone: string, dialCode: string): { phone: string; dialCode: string; phoneNumber: string } {
  const normalizedPhone = phone.replace(/\D/g, "");
  const normalizedDialCode = dialCode.trim();

  if (!normalizedPhone) {
    throw new Error("Please enter your phone number.");
  }

  if (!normalizedDialCode) {
    throw new Error("Please select your country code.");
  }

  return {
    phone: normalizedPhone,
    dialCode: normalizedDialCode,
    phoneNumber: `${normalizedDialCode}${normalizedPhone}`,
  };
}

export function registerAuthIpc(): void {
  ipcMain.handle(AUTH_FETCH_CHANNEL, async (_event, payload: AuthFetchRequest) => fetchWithElectronSession(payload));
  ipcMain.handle(AUTH_FLOW_GET_CHANNEL, async (): Promise<AuthFlowState> => readAuthFlowState());
  ipcMain.handle(AUTH_FLOW_RESET_CHANNEL, async (): Promise<AuthFlowState> => {
    resetAuthFlowState();
    return readAuthFlowState();
  });
  ipcMain.handle(AUTH_SEND_PHONE_OTP_CHANNEL, async (_event, payload: SendPhoneOtpRequest): Promise<AuthFlowState> => {
    const phonePayload = normalizePhonePayload(payload.phone, payload.dialCode);

    await postAuthJson("/phone-number/send-otp", {
      phoneNumber: phonePayload.phoneNumber,
    });

    const nextState: AuthFlowState = {
      currentStep: "otpForm",
      phone: phonePayload.phone,
      dialCode: phonePayload.dialCode,
    };
    writeAuthFlowState(nextState);

    return nextState;
  });
  ipcMain.handle(AUTH_VERIFY_PHONE_OTP_CHANNEL, async (_event, payload: VerifyPhoneOtpRequest) => {
    const storedState = readAuthFlowState();
    const phonePayload = normalizePhonePayload(
      payload.phone || storedState.phone,
      payload.dialCode || storedState.dialCode,
    );

    if (!payload.otp) {
      throw new Error("Please enter OTP you received.");
    }

    await postAuthJson("/phone-number/verify", {
      phoneNumber: phonePayload.phoneNumber,
      code: payload.otp,
      disableSession: false,
      updatePhoneNumber: false,
    });

    resetAuthFlowState();

    return {
      session: await getElectronSession(),
    };
  });
}
