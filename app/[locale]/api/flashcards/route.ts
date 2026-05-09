import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingAccData = await prisma.accData.findUnique({
      where: { uid: userId }
    });

    let currentData: any = {};
    if (existingAccData && typeof existingAccData.data === 'object' && existingAccData.data !== null) {
      currentData = { ...existingAccData.data };
    }

    return NextResponse.json({ flashcards: currentData.flashcards || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
