import { CrudPage } from "@/components/CrudPage";
import { moduleConfigs, pageContentConfigs } from "@/lib/adminConfig";

export default function Page() {
  return <CrudPage config={moduleConfigs.pages} configs={pageContentConfigs} />;
}
