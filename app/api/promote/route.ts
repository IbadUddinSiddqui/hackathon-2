// app/api/promote/route.ts
import { serverClient as client } from "@/sanity/lib/server-client";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";


export async function POST(req: Request) {
  const session = await auth();
  
  if (!isAdmin(session)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await req.json();
  
  try {
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    );

    if (!user) throw new Error('User not found');

    await client
      .patch(user._id)
      .set({ role: 'admin' })
      .commit();

    return Response.json({ success: true });
  } catch (error) {
    console.log('Promotion failed:', error);
    return Response.json(
      { error: "Promotion failed" },
      { status: 500 }
    );
  }
}