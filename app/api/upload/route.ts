// app/api/upload/route.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

const sanityclient = client;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Find user document by email
    const user = await sanityclient.fetch(
      `*[_type == "user" && email == $email][0]{_id}`,
      { email: session.user.email }
    );

    if (!user?._id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Handle file upload
    const formData = await request.formData();
    const file = formData.get("avatar") as File;
    
    // 3. Upload image asset
    const imageAsset = await sanityclient.assets.upload("image", file, {
      contentType: file.type,
      filename: file.name,
    });

    // 4. Update user document with proper reference
    const updatedUser = await sanityclient
      .patch(user._id) // Use Sanity document ID
      .set({
        avatar: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: imageAsset._id,
          },
        },
      })
      .commit();

    return NextResponse.json({
      success: true,
      url: imageAsset.url,
      user: updatedUser
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}