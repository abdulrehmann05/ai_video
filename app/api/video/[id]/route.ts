import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API: Starting DELETE request for video ID:', params.id);
    
    // Get session
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('API: Unauthorized delete attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('API: User authenticated for delete:', session.user?.email);
    
    // Connect to database
    await connectToDatabase();
    console.log('API: Database connected for DELETE');

    // Find and delete the video
    const deletedVideo = await Video.findByIdAndDelete(params.id);
    
    if (!deletedVideo) {
      console.log('API: Video not found for ID:', params.id);
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    console.log('API: Video deleted successfully:', params.id);

    return NextResponse.json(
      { message: "Video deleted successfully", id: params.id },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('API: Error in DELETE /api/video/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API: Error message:', errorMessage);
    
    return NextResponse.json(
      { error: "Failed to delete video", details: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}