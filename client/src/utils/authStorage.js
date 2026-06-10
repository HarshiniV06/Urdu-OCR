/** Session-only auth — cleared when browser/tab closes. */
const TOKEN_KEY = "urdu_ocr_token";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("token");
}
