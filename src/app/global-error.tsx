"use client";

import { useEffect } from "react";

// Последний рубеж: этот файл заменяет корневой layout, поэтому стили заданы
// инлайном, а не Tailwind-классами.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Критическая ошибка приложения", error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#F4F6FA",
          color: "#1F2937",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        <main
          style={{
            maxWidth: "480px",
            width: "100%",
            padding: "32px",
            borderRadius: "16px",
            background: "#FFFFFF",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "24px" }}>
            Приложение временно недоступно
          </h1>
          <p style={{ marginTop: "12px", fontSize: "14px", lineHeight: 1.6 }}>
            Произошла критическая ошибка. Попробуйте обновить страницу.
          </p>
          {error.digest ? (
            <p style={{ marginTop: "12px", fontSize: "12px", color: "#6B7280" }}>
              Код ошибки: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "24px",
              height: "44px",
              padding: "0 20px",
              border: 0,
              borderRadius: "10px",
              background: "#1D4ED8",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </main>
      </body>
    </html>
  );
}
