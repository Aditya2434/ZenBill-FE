const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  return emailRegex.test(String(email || "").trim());
}

export function validatePassword(password) {
  return String(password || "").length > 0;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fakeAuth(payload) {
  await sleep(800);
  // Simulate basic failure
  if (payload?.email && !validateEmail(payload.email)) {
    throw new Error("Invalid email address");
  }
  if (payload?.password && !validatePassword(payload.password)) {
    throw new Error("Password too short");
  }
  return { ok: true };
}
