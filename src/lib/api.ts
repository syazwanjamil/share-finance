export class ApiRequestError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function apiFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data?.error;
    throw new ApiRequestError(error?.code ?? "UNKNOWN_ERROR", error?.message ?? "Something went wrong. Please try again.");
  }

  return data as T;
}

export function toE164(localNumber: string): string {
  return `+60${localNumber.replace(/\D/g, "")}`;
}

interface RequestOtpResponse {
  phone: string;
  expiresInSeconds: number;
  debugCode?: string;
}

export function requestOtp(phone: string): Promise<RequestOtpResponse> {
  return apiFetch<RequestOtpResponse>("/auth/otp/request", { phone });
}

interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string | null;
    phone: string;
    phoneVerified: boolean;
    mykadVerified: boolean;
  };
}

export function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>("/auth/otp/verify", { phone, code });
}
