// Create this file: app/api/reset-password/route.ts
// This is a temporary endpoint to fix your specific user

import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and new password required" }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const normalizedEmail = email.trim().toLowerCase();
    console.log("🔍 Looking for user:", normalizedEmail);
    
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      // Show what users exist for debugging
      const allUsers = await User.find({}).select('email');
      console.log("📋 All users:", allUsers.map(u => u.email));
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log("👤 Found user:", user.email);
    
    // Update password - the pre-save middleware will hash it
    user.password = newPassword;
    await user.save();
    
    console.log("✅ Password updated for:", user.email);
    
    return NextResponse.json({ 
      message: "Password updated successfully",
      userEmail: user.email 
    });
    
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}