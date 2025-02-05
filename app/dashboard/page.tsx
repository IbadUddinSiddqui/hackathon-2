
import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { redirect } from "next/navigation";
import { AvatarUpload } from "../components/AvatarUpload/AvatarUpload";
import LogoutButton from "../components/LogoutButton/LogoutButton";

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");
  
    // Proper GROQ query with parameter binding
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0]{
        _id,
        name,
        avatar{
          asset->{
            url
          }
        }
      }`,
      { email: session.user.email } // $email parameter binding
    );
  
    if (!user) {
      // Handle case where user isn't found
      return redirect("/login");
    }
  
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Welcome {user.name}</h1>
          <LogoutButton />
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Profile Photo</h2>
          <AvatarUpload userId={user._id} />
        </div>
      </div>
    );
  }