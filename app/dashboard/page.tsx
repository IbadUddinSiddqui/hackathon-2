
import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { redirect } from "next/navigation";
import { AvatarUpload } from "../components/AvatarUpload/AvatarUpload";
import LogoutButton from "../components/LogoutButton/LogoutButton";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Link from "next/link";

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
      <>
      <Header/>
      <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        </div>
        <nav className="mt-6">
          <ul>
            <li>
              <Link
                href="/"
                className="block px-6 py-3 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
              >
                Profile
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="block px-6 py-3 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
              >
                Settings
              </Link>
            </li>
            {/* Add more nav items as needed */}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user.name}
            </h1>
            <LogoutButton />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Card for Profile Photo */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Profile Photo
              </h2>
              <AvatarUpload userId={user._id} />
            </div>
          </div>
        </main>
      </div>
    </div>
      <Footer/>
      </> );
  }