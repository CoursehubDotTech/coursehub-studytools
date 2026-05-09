import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notes, locale } = await req.json();
    if (!notes) {
      return NextResponse.json({ error: "Notes are required" }, { status: 400 });
    }

    // Call OpenRouter API with fallback models
    const models = [
      "openai/gpt-oss-120b:free",
      "nvidia/nemotron-3-super-120b-a12b:free"
    ];

    let aiResponse;
    let data;
    let success = false;
    let lastError = "";

    for (const model of models) {
      try {
        aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.AI_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: `You are a helpful study assistant. Summarize the following notes concisely in the locale given by the user's device (${locale}).` },
              { role: "user", content: notes }
            ]
          })
        });

        data = await aiResponse.json();
        
        if (aiResponse.ok && data.choices && data.choices.length > 0) {
          success = true;
          break; // Stop at first successful model
        } else {
          lastError = data.error?.message || "Unknown API error";
          console.warn(`Model ${model} failed:`, lastError);
        }
      } catch (err: any) {
        lastError = err.message || "Fetch failed";
        console.warn(`Model ${model} network error:`, lastError);
      }
    }

    if (!success) {
      console.error("All fallback models failed.");
      return NextResponse.json({ error: "AI API error: All models failed. Last error: " + lastError }, { status: 500 });
    }

    const summary = data.choices?.[0]?.message?.content || "No summary generated.";

    // Retrieve existing user data
    const existingAccData = await prisma.accData.findUnique({
      where: { uid: userId }
    });

    let currentData: any = {};
    if (existingAccData && typeof existingAccData.data === 'object' && existingAccData.data !== null) {
      currentData = { ...existingAccData.data };
    }

    if (!Array.isArray(currentData.studyNotes)) {
      currentData.studyNotes = [];
    }

    const newNote = {
      id: crypto.randomUUID(),
      originalText: notes,
      summaryText: summary,
      createdAt: new Date().toISOString(),
    };

    currentData.studyNotes.push(newNote);

    // Save back to AccData table
    await prisma.accData.upsert({
      where: { uid: userId },
      update: { data: currentData },
      create: { uid: userId, data: currentData }
    });

    return NextResponse.json({ summary, studyNote: newNote });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
