import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video, { IVideo } from "@/models/Video";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('API: Starting GET request to /api/video');
    
    // Connect to database
    await connectToDatabase();
    console.log('API: Database connected successfully');
    
    // Fetch videos from database
    const videos = await Video.find({}).sort({ createdAt: -1 }).lean();
    console.log('API: Found videos:', videos?.length || 0);

    // Always return an array, even if empty
    const result = videos || [];
    console.log('API: Returning videos array with length:', result.length);
    
    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API: Error in GET /api/video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API: Error message:', errorMessage);
    
    return NextResponse.json(
      { error: "Failed to fetch videos", details: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting POST request to /api/video');
    
    // Get session
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('API: Unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('API: User authenticated:', session.user?.email);
    
    // Connect to database
    await connectToDatabase();
    console.log('API: Database connected for POST');

    // Parse request body
    const body: IVideo = await request.json();
    console.log('API: Received POST data:', {
      title: body.title,
      description: body.description?.substring(0, 50) + '...',
      hasVideoUrl: !!body.videoUrl,
      hasThumbnailUrl: !!body.thumbnailUrl
    });
    
    // Validate required fields
    if (!body.title || !body.description || !body.videoUrl || !body.thumbnailUrl) {
      console.log('API: Missing required fields:', {
        title: !!body.title,
        description: !!body.description,
        videoUrl: !!body.videoUrl,
        thumbnailUrl: !!body.thumbnailUrl
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare video data
    const videoData = {
      title: body.title.trim(),
      description: body.description.trim(),
      videoUrl: body.videoUrl,
      thumbnailUrl: body.thumbnailUrl,
      controls: body?.controls ?? true,
      transformation: {
        height: body.transformation?.height || 1920,
        width: body.transformation?.width || 1080,
        quality: body.transformation?.quality || 80,
      },
    };
    
    console.log('API: Creating video with processed data');
    
    // Create video in database
    const newVideo = await Video.create(videoData);
    console.log('API: Video created successfully with ID:', newVideo._id);

    return NextResponse.json(newVideo, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API: Error in POST /api/video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API: Error message:', errorMessage);
    
    return NextResponse.json(
      { error: "Failed to create video", details: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}