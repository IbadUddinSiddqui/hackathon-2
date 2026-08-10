// app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { serverClient as client } from "@/sanity/lib/server-client";
import { validateEmail, validatePassword, validateName } from "@/utils/validation";
import { enforceRateLimit } from "@/lib/rate-limit";


const sanityclient = client

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: "register", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { name, email, password } = await request.json();

    // Check if user already exists
    const existingUser = await sanityclient.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);


    // Add these checks before creating the user
if (!validateName(name)) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400 }
    );
  }
  
  if (!validateEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }
  
  if (!validatePassword(password)) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

    // Create new user (role defaults to "user"; admins are promoted via /api/promote)
    const newUser = await sanityclient.create({
      _type: "user",
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    return NextResponse.json(
      { message: "User created successfully", userId: newUser._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error occured" },
      { status: 500 }
    );
  }
}