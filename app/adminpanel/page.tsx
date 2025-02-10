import ECommerce from "../components/Dashboard/E-commerce";
import DefaultLayout from "../components/Layouts/DefaultLayout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
export default async function  Home() {
const session = await auth();
    if (session?.user.role === "user") redirect("/denied");

  // If no session or user is not admin, redirect to home page

  
    return (
      <>
        <DefaultLayout>
          <ECommerce />
        </DefaultLayout>
      </>
    );
  
}