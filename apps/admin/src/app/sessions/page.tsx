import { CrudPage } from "@/components/CrudPage";
import { moduleConfigs, sessionConfigs } from "@/lib/adminConfig";

export default function Page() {
  return <CrudPage config={moduleConfigs.sessions} configs={sessionConfigs} />;
}
