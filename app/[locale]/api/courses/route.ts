import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const { userId } = await auth();

  // Check if user is authenticated
  if (!userId) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const courses = await prisma.course.findMany();
    return Response.json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return Response.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

