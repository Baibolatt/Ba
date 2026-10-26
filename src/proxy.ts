import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  isValidAdminSessionToken,
} from "@/lib/admin-auth";

/**
 * Проверка до рендера: без неё layout и page выполняются параллельно и
 * страница успевает подготовить данные до redirect из layout. Здесь же
 * анонимный запрос получает честный 307 вместо потока с редиректом.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (token && isValidAdminSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
