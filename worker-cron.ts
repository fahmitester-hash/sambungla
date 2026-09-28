export interface Env {
  DB: D1Database;
  APP_BASE_URL: string;
  OPENAI_API_KEY: string;
}

interface DueQueueItem {
  queueId: string;
  postId: string;
  userId: string;
  generatedContent: string;
  linkedinAccessToken: string | null;
  linkedinExpiresAt: number | null;
  linkedinPersonId: string | null;
}

export default {
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(processDueQueue(env));
  },
};

async function processDueQueue(env: Env): Promise<void> {
  const dueItems = await env.DB.prepare(
    `SELECT
       sq.id AS queueId,
       sq.postId AS postId,
       sq.userId AS userId,
       p.generatedContent AS generatedContent,
       acc.access_token AS linkedinAccessToken,
       acc.expires_at AS linkedinExpiresAt,
       acc.providerAccountId AS linkedinPersonId
     FROM scheduling_queue sq
     JOIN posts p ON p.id = sq.postId
     LEFT JOIN accounts acc ON acc.userId = sq.userId AND acc.provider = 'linkedin'
     WHERE sq.status = 'pending' AND sq.scheduledFor <= CURRENT_TIMESTAMP
     ORDER BY sq.scheduledFor ASC
     LIMIT 25`
  ).all<DueQueueItem>();

  const rows = dueItems.results ?? [];

  for (const item of rows) {
    await handleQueueItem(item, env);
  }
}

async function handleQueueItem(item: DueQueueItem, env: Env): Promise<void> {
  try {
    if (!item.linkedinAccessToken || !item.linkedinPersonId) {
      await markNeedsReauth(env, item);
      return;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!item.linkedinExpiresAt || item.linkedinExpiresAt <= nowSeconds) {
      await markNeedsReauth(env, item);
      return;
    }

    const publishResponse = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${item.linkedinAccessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        // LinkedIn versions its REST API by release month — verify this
        // against LinkedIn's current developer docs before deploying.
        "LinkedIn-Version": "202409",
      },
      body: JSON.stringify({
        author: `urn:li:person:${item.linkedinPersonId}`,
        commentary: item.generatedContent,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!publishResponse.ok) {
      const isAuthError =
        publishResponse.status === 401 || publishResponse.status === 403;

      await env.DB.prepare(
        `UPDATE scheduling_queue SET status = ?1, executedAt = CURRENT_TIMESTAMP WHERE id = ?2`
      )
        .bind(isAuthError ? "needs_reauth" : "failed", item.queueId)
        .run();

      await env.DB.prepare(`UPDATE posts SET status = ?1 WHERE id = ?2`)
        .bind(isAuthError ? "needs_reauth" : "failed", item.postId)
        .run();
      return;
    }

    await env.DB.batch([
      env.DB.prepare(
        `UPDATE scheduling_queue SET status = 'success', executedAt = CURRENT_TIMESTAMP WHERE id = ?1`
      ).bind(item.queueId),
      env.DB.prepare(`UPDATE posts SET status = 'published' WHERE id = ?1`).bind(
        item.postId
      ),
    ]);

    await captureWritingSample(env, item.userId, item.generatedContent);
  } catch (_err) {
    await env.DB.prepare(
      `UPDATE scheduling_queue SET status = 'failed', executedAt = CURRENT_TIMESTAMP WHERE id = ?1`
    )
      .bind(item.queueId)
      .run();
  }
}

async function markNeedsReauth(env: Env, item: DueQueueItem): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE scheduling_queue SET status = 'needs_reauth', executedAt = CURRENT_TIMESTAMP WHERE id = ?1`
    ).bind(item.queueId),
    env.DB.prepare(`UPDATE posts SET status = 'needs_reauth' WHERE id = ?1`).bind(
      item.postId
    ),
  ]);
}

async function captureWritingSample(
  env: Env,
  userId: string,
  content: string
): Promise<void> {
  try {
    const sampleId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO writing_samples (id, userId, content, source) VALUES (?1, ?2, ?3, 'auto')`
    )
      .bind(sampleId, userId, content)
      .run();

    await regenerateStyleProfileFromWorker(userId, env);
  } catch {
    // Style learning is a background enhancement — never let it block
    // or fail the publish flow that already succeeded above.
  }
}

async function regenerateStyleProfileFromWorker(
  userId: string,
  env: Env
): Promise<void> {
  const MIN_SAMPLES = 3;
  const MAX_IN_PROMPT = 12;

  const samples = await env.DB.prepare(
    `SELECT content FROM writing_samples WHERE userId = ?1 ORDER BY createdAt DESC LIMIT ?2`
  )
    .bind(userId, MAX_IN_PROMPT)
    .all<{ content: string }>();

  const rows = samples.results ?? [];

  const totalCount = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM writing_samples WHERE userId = ?1`
  )
    .bind(userId)
    .first<{ count: number }>();

  if (rows.length < MIN_SAMPLES) {
    await env.DB.prepare(
      `UPDATE user_profiles SET styleSampleCount = ?1 WHERE userId = ?2`
    )
      .bind(totalCount?.count ?? rows.length, userId)
      .run();
    return;
  }

  const numberedSamples = rows
    .map((row, i) => `Post ${i + 1}:\n${row.content}`)
    .join("\n\n---\n\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 350,
      messages: [
        {
          role: "system",
          content:
            "You are analyzing a professional's past LinkedIn posts to build a concise style guide an AI writing assistant can follow when drafting new posts in their voice. Output 6-10 short bullet points covering: typical opening style, sentence length and rhythm, vocabulary or phrases they favor, use of emoji or formatting, how they structure arguments or stories, and their sign-off style. Describe patterns only — do not quote their posts verbatim. Keep the whole output under 200 words.",
        },
        { role: "user", content: numberedSamples },
      ],
    }),
  });

  if (!response.ok) return;

  const data = await response.json<{
    choices: { message: { content: string } }[];
  }>();
  const styleProfile = data.choices[0]?.message?.content ?? null;

  await env.DB.prepare(
    `UPDATE user_profiles SET styleProfile = ?1, styleSampleCount = ?2 WHERE userId = ?3`
  )
    .bind(styleProfile, totalCount?.count ?? rows.length, userId)
    .run();
}
