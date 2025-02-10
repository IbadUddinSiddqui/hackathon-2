import ECommerce from "../components/Dashboard/E-commerce";
import DefaultLayout from "../components/Layouts/DefaultLayout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
export default async function Home() {
  // Get the session
  const session = await auth();


console.log(session?.user,"Admin session user")
  // If there's no session or the user is not an admin, redirect to the denied page
  if (!session || session?.user.email !== "ibaduddinsiddiqui418@gmail.com") {
    redirect("/denied");
  }

  // If the user is an admin, render the admin panel
  return (
    <>
      <DefaultLayout>
        <ECommerce />
      </DefaultLayout>
    </>
  );
}