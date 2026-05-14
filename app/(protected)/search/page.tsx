import { ToastMessage } from "@/components/feedback/toast-message";
import { PageHeader } from "@/components/page-header";
import { GlobalSearchWorkspace } from "@/components/search/global-search-workspace";
import { getGlobalSearchData } from "@/lib/data/search";
import { parseSearchFilters } from "@/lib/data/search-shared";

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseSearchFilters(params);
  const data = await getGlobalSearchData(filters);

  return (
    <>
      <ToastMessage code={typeof params.toast === "string" ? params.toast : undefined} />
      <PageHeader title="Busqueda global" description="Encontrar informacion en todos los modulos internos de Capitol Hub." />
      <GlobalSearchWorkspace data={data} />
    </>
  );
}
