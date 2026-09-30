import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "edge";

const ToneEnum = z.enum(["corporate-en", "humble-local", "manglish"]);

const RequestSchema = z.object({
  rawPrompt: z.string().min(1, "rawPrompt cannot be empty").max(4000),
  tone: ToneEnum,
});

type Tone = z.infer<typeof ToneEnum>;

function buildSystemPrompt(tone: Tone): string {
  switch (tone) {
    case "corporate-en":
      return `You are a senior communications strategist writing LinkedIn posts for a Malaysian corporate professional (think Mid Valley / KLCC financial and MNC circles).

Voice rules:
- Confident, precise, understated authority — never hype, never "broetry" line breaks, never fake vulnerability hooks.
- Standard Malaysian corporate English: correct grammar, formal register, no slang.
- Structure: a clear opening statement of the point, 2-4 short supporting paragraphs or a tight bullet list, a measured closing line. No emoji spam — at most one, if it fits naturally.
- Avoid American startup-Twitter cadence (no "Here's the thing:", no single-sentence paragraphs stacked for drama, no numbered "hot takes").
- Ground claims in specifics (numbers, outcomes, named initiatives) rather than motivational abstraction.`;

    case "humble-local":
      return `You are writing LinkedIn posts for a Malaysian professional whose personal brand is built on humility, ecosystem contribution, and respect for seniors, mentors, and collaborators.

Voice rules:
- Polished, professional English, but warm and grounded — never boastful even when sharing an achievement.
- Frequently acknowledge others: mentors, teams, clients, the broader industry/ecosystem. Use respect markers naturally (e.g., crediting seniors, thanking collaborators, framing wins as shared).
- Center the narrative on industry growth, community, and long-term contribution rather than individual accolades.
- Tone is reflective and sincere, not self-promotional. Avoid humblebragging clichés ("I'm humbled to announce...") — show humility through substance and specific credit-giving, not the stock opening phrase.
- Structure: a grounded opening observation, a short story or lesson, an outward-looking closing thought (what this means for the ecosystem/community, not just the author).`;

    case "manglish":
      return `You are writing LinkedIn posts in authentic Manglish, the natural code-switched register used by Malaysian startup founders and professionals in real posts — not textbook Bahasa Malaysia, not exaggerated caricature slang.

Voice rules:
- Natural blend of English sentence structure with Malaysian discourse particles and rhythm used sparingly and authentically: e.g. "lah", "one", "can already", "confirm", "walao", "steady" — use these like a real professional would in a casual-but-credible post, not stacked on every sentence.
- Casual, direct, conversational — like talking to a peer founder over coffee, but still coherent and readable to an international LinkedIn audience.
- Real local business framing: reference things like MDEC, local VC rounds, "the Klang Valley scene", F&B/retail context, or SME hustle where relevant, without forcing it.
- Do NOT overdo the slang to the point of being a stereotype or hard to read — authenticity means restraint, not maximum slang density.
- Structure: informal hook, a real anecdote or point told plainly, a closing line that feels like a genuine sign-off, not a corporate CTA voice.`;
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Please sign in." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = session.user.id;

  let parsedBody: z.infer<typeof RequestSchema>;
  try {
    const json = await request.json();
    parsedBody = RequestSchema.parse(json);
  } catch (err) {
    const message = err instanceof z.ZodError ? err.errors : "Invalid JSON body";
    return new Response(JSON.stringify({ error: "Validation failed", details: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { rawPrompt, tone } = parsedBody;

  const { env, ctx } = getRequestContext();

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const systemPrompt = buildSystemPrompt(tone);

  const styleResult = await env.DB.prepare(
    `SELECT styleProfile FROM user_profiles WHERE userId = ?1 LIMIT 1`
  )
    .bind(userId)
    .first<{ styleProfile: string | null }>();

  const finalSystemPrompt = styleResult?.styleProfile
    ? `${systemPrompt}\n\nAdditionally, here is a learned style guide based on this specific user's own past posts. Follow it closely so the output sounds authentically like them, layered on top of the tone rules above:\n${styleResult.styleProfile}`
    : systemPrompt;

  const postId = nanoid();

  await env.DB.prepare(
    `INSERT INTO posts (id, userId, rawPrompt, generatedContent, toneUsed, status)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  )
    .bind(postId, userId, rawPrompt, "", tone, "draft")
    .run();

  let openaiStream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  try {
    openaiStream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.85,
      max_tokens: 600,
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: rawPrompt },
      ],
    });
  } catch (err) {
    await env.DB.prepare(`UPDATE posts SET status = 'failed' WHERE id = ?1`)
      .bind(postId)
      .run();

    return new Response(
      JSON.stringify({ error: "Failed to reach OpenAI.", details: `${err}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of openaiStream) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (token) {
            fullText += token;
            controller.enqueue(encoder.encode(token));
          }
        }

        controller.close();

        ctx.waitUntil(
          env.DB.prepare(
            `UPDATE posts SET generatedContent = ?1 WHERE id = ?2`
          )
            .bind(fullText, postId)
            .run()
        );
      } catch (streamErr) {
        controller.error(streamErr);
        ctx.waitUntil(
          env.DB.prepare(`UPDATE posts SET status = 'failed' WHERE id = ?1`)
            .bind(postId)
            .run()
        );
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Post-Id": postId,
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
