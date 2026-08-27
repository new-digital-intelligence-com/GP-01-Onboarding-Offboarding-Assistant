import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { buildSystemPrompt } from '@/lib/skill';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-4-6-20260401';

const Body = z.object({
  prompt: z.string().min(1).max(4000),
});

/**
 * Runs the GP-01 skill through the Claude API with the same Zapier MCP endpoint the
 * skill uses in chat, and re-emits Claude's text as a simple SSE stream of
 * `data: {"text": "..."}` lines. The browser never sees the raw Anthropic event
 * shapes, so a change in the wire format does not break the console.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not set — the console cannot run.' },
      { status: 503 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Malformed request body.' }, { status: 400 });
  }
  const { prompt } = parsed.data;

  const mcpUrl = process.env.ZAPIER_MCP_URL;
  if (!mcpUrl) {
    return Response.json(
      {
        error:
          'ZAPIER_MCP_URL is not set. Without it the skill has no connectors and could only describe what it would do.',
      },
      { status: 503 },
    );
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const run = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 32000,
            system: buildSystemPrompt(),
            messages: [{ role: 'user', content: prompt }],
            mcp_servers: [
              {
                type: 'url',
                url: mcpUrl,
                name: 'zapier',
                ...(process.env.ZAPIER_MCP_TOKEN
                  ? { authorization_token: process.env.ZAPIER_MCP_TOKEN }
                  : {}),
              },
            ],
          },
          { headers: { 'anthropic-beta': 'mcp-client-2025-04-04' } },
        );

        for await (const event of run) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            send({ text: event.delta.text });
          }
        }

        const final = await run.finalMessage();
        if (final.stop_reason === 'max_tokens') {
          send({
            error:
              'Output limit reached — the run was cut off mid-step. Steps already marked DONE did happen; nothing after that point ran. Re-trigger to finish the remaining steps.',
          });
        }
      } catch (err) {
        send({ error: err instanceof Error ? err.message : 'The run failed upstream.' });
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
