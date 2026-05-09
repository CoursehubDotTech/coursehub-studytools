import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let notes, locale;
    try {
      const body = await req.json();
      notes = body.notes;
      locale = body.locale;
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!notes) {
      return NextResponse.json({ error: "Notes are required" }, { status: 400 });
    }

    // Faster + more reliable fallback order
    const models = [
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",      
      "qwen/qwen3-coder:free",
      "openrouter/free"
    ];

    let aiResponse: any;
    let data;
    let success = false;
    let lastError = "";

    // Timeout helper
    const fetchWithTimeout = (url: string, options: any, timeoutMs = 15000) =>
      new Promise((resolve, reject) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        fetch(url, { ...options, signal: controller.signal })
          .then((res) => {
            clearTimeout(id);
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(id);
            reject(err);
          });
      });

    // Try models sequentially with timeouts
    for (const model of models) {
      try {
        aiResponse = await fetchWithTimeout(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.AI_KEY}`,
            },
            body: JSON.stringify({
              model,
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content: `You are a helpful study assistant. Generate exactly a JSON object with one property "flashcards" containing an array of objects like { "question": "string", "answer": "string" }. Use the user's locale (${locale}). No markdown. Output ONLY valid JSON.`
                },
                { role: "user", content: notes }
              ]
            })
          },
          8000 // 8 second timeout per model
        );

        data = await aiResponse.json();

        if (aiResponse.ok && data.choices?.length > 0) {
          success = true;
          break;
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
      return NextResponse.json(
        { error: "AI API error: All models failed. Last error: " + lastError },
        { status: 500 }
      );
    }

    const aiContent = data.choices?.[0]?.message?.content;
    let parsedCards = [];

    try {
      const parsed = JSON.parse(aiContent);

      if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        parsedCards = parsed.flashcards;
      } else if (Array.isArray(parsed)) {
        parsedCards = parsed;
      }
    } catch (e) {
      console.log("Could not parse JSON from AI", aiContent);
      return NextResponse.json(
        { error: "Could not parse AI response as JSON" },
        { status: 500 }
      );
    }

    // Retrieve existing user data
    const existingAccData = await prisma.accData.findUnique({
      where: { uid: userId }
    });

    let currentData: any = {};
    if (existingAccData?.data && typeof existingAccData.data === "object") {
      currentData = { ...existingAccData.data };
    }

    if (!Array.isArray(currentData.flashcards)) {
      currentData.flashcards = [];
    }

    const flashcardSetId = crypto.randomUUID();
    const newFlashcardSet = {
      id: flashcardSetId,
      originalText: notes,
      flashcards: parsedCards,
      createdAt: new Date().toISOString()
    };

    currentData.flashcards.push(newFlashcardSet);

    await prisma.accData.upsert({
      where: { uid: userId },
      update: { data: currentData },
      create: { uid: userId, data: currentData }
    });

    return NextResponse.json({ flashcardSet: newFlashcardSet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
