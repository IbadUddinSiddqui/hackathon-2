import ECommerce from "../components/Dashboard/E-commerce";
import DefaultLayout from "../components/Layouts/DefaultLayout";
import { requireAdmin } from "@/lib/admin";

export default async function Home() {
  // Admin-only guard — redirects to /denied when not authorized.
  await requireAdmin();

  return (
    <>
      <DefaultLayout>
        <ECommerce />
      </DefaultLayout>
    </>
  );
}
