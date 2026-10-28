// isTokenExpired — decode the JWT payload base64url with native atob
// true on expiry, and treat malformed tokens as expired (safe default)
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    // exp is seconds since epoch; 1000x to compare with Date.now()
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export default isTokenExpired;