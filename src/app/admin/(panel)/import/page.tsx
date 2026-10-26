import type { Metadata } from "next";
import { ImportWizard } from "@/components/admin/import-wizard";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import type { ImportRunSummary } from "@/lib/import/types";

export const metadata: Metadata = {
  title: "Импорт товаров",
};

export default async function AdminImportPage() {
  await requireAdmin();

  const run = await prisma.importRun.findFirst({
    where: { completed: true },
    orderBy: { createdAt: "desc" },
  });

  const latestRun: ImportRunSummary | null = run
    ? {
        fileName: run.fileName,
        createdAt: run.createdAt.toISOString(),
        createdCount: run.createdCount,
        updatedCount: run.updatedCount,
      }
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          title="Импорт товаров из Excel/CSV"
          description="Загрузите прайс-лист: программа сама найдёт заголовки, разберёт цены и остатки и покажет предпросмотр перед записью."
        />
        <ButtonLink href="/admin" variant="secondary" size="sm">
          Назад в админку
        </ButtonLink>
      </div>

      <ImportWizard latestRun={latestRun} />
    </div>
  );
}
