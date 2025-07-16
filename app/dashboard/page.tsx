import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}! 
            Manage your PDF slugs below.
          </p>
        </header>

        {/* PDF Slugs Management Section */}
        <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your PDF Slugs</h2>
          
          {/* TODO: This will be populated with actual user data */}
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-4">No PDF slugs created yet.</p>
            <a 
              href="/" 
              className="inline-block bg-foreground text-background px-4 py-2 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200 dark:hover:text-black transition-colors"
            >
              Create Your First PDF Slug
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-foreground">0</h3>
            <p className="text-gray-600 dark:text-gray-400">Total PDFs</p>
          </div>
          <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-foreground">0</h3>
            <p className="text-gray-600 dark:text-gray-400">Total Views</p>
          </div>
          <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-foreground">0</h3>
            <p className="text-gray-600 dark:text-gray-400">Active Slugs</p>
          </div>
        </div>
      </div>
    </div>
  );
} 