import { ApiError } from "./database.mjs";

export function isLoopbackAddress(value) {
  if (typeof value !== "string") return false;
  const address = value.toLowerCase().split("%", 1)[0];
  return address === "::1"
    || address === "127.0.0.1"
    || address.startsWith("127.")
    || address === "::ffff:127.0.0.1"
    || address.startsWith("::ffff:127.");
}

export function assertLoopbackRequest(request) {
  const address = request.socket?.remoteAddress;
  if (!isLoopbackAddress(address)) {
    throw new ApiError(403, "LOCAL_ONLY", "This endpoint is only available on this device");
  }
}
