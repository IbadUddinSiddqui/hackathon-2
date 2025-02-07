import ECommerce from "../components/Dashboard/E-commerce";
import DefaultLayout from "../components/Layouts/DefaultLayout";

export default async function  Home() {


  // If no session or user is not admin, redirect to home page

  
    return (
      <>
        <DefaultLayout>
          <ECommerce />
        </DefaultLayout>
      </>
    );
  
}
