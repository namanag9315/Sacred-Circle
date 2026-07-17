import { CrudPage } from "@/components/CrudPage";
import { moduleConfigs } from "@/lib/adminConfig";

export default function Page() {
  return <CrudPage config={moduleConfigs.announcements} />;
}
