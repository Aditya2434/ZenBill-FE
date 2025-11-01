const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  return emailRegex.test(String(email || "").trim());
}

export function validatePassword(password) {
  const value = String(password || "");
  return value.length >= 6;
}

export function validateName(name) {
  return String(name || "").trim().length >= 2;
}

export function validateNonEmpty(value) {
  return String(value || "").trim().length > 0;
}

export function passwordsMatch(password, confirm) {
  return String(password || "") === String(confirm || "");
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fakeSignup(payload) {
  await sleep(900);
  if (payload?.email && !validateEmail(payload.email)) {
    throw new Error("Invalid email address");
  }
  if (payload?.password && !validatePassword(payload.password)) {
    throw new Error("Password too weak");
  }
  if (!validateNonEmpty(payload?.name)) {
    throw new Error("Name is required");
  }
  if (!validateNonEmpty(payload?.companyName)) {
    throw new Error("Company name is required");
  }
  if (!validateNonEmpty(payload?.state)) {
    throw new Error("State is required");
  }
  if (!validateNonEmpty(payload?.code)) {
    throw new Error("Code is required");
  }
  return { ok: true };
}


