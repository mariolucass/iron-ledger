import { Construction } from "lucide-react";
import Link from "next/link";
import type { PlannedPage } from "@/shared/config/planned-page";
import { EmptyState, PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";

/** Tela temporária para rotas planejadas que ainda não têm conteúdo. */
export function ComingSoonPage({ title, description, back, action }: PlannedPage) {
  return (
    <Layout title={title}>
      <PageHeader title={title} description={description} back={back} />
      <div className="rounded-xl border border-ink/10 bg-ink/[0.025]">
        <EmptyState
          icon={Construction}
          message="Esta página ainda será implementada."
          action={action && <Link href={action.href} className={secondaryActionClass}>{action.label}</Link>}
        />
      </div>
    </Layout>
  );
}
