import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";

// Кабинет доступен только по сессии: проверка cookie выполняется до отдачи
// страницы, без статической оболочки.
export const instant = false;

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return <>{children}</>;
}
