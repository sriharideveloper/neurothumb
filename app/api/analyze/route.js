/* app/api/analyze/route.js */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 300;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PROCESSING_STATUS = "processing";
const STARTING_MODAL_STATUS = "starting_modal";
const FINALIZING_STATUS = "finalizing_gemini";
const COMPLETE_STATUS = "complete";
const ERROR_STATUS = "error";

// Lazily initialize Supabase Client inside handler to avoid build failures if env vars are missing
const getSupabaseClient = () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Lazily initialize Gemini Client inside handler with safety settings
const getGeminiClient = () => {
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  if (!geminiApiKey) return null;

  return new GoogleGenerativeAI(geminiApiKey);
};

function isLikelyHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function toFiniteNumber(value, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeModalMetrics(modalResult) {
  const m = modalResult?.metrics || {};
  return {
    visual_mean: toFiniteNumber(m.visual_mean, 0),
    attention_control_mean: toFiniteNumber(m.attention_control_mean, 0),
    language_semantic_mean: toFiniteNumber(m.language_semantic_mean, 0),
    peak_top_roi_score: toFiniteNumber(m.peak_top_roi_score, 0),
    // Preserve any other keys for debugging/forward-compat, but ensure required ones exist.
    ...m,
  };
}

function metricsStatus(metrics) {
  return typeof metrics?.status === "string" ? metrics.status : null;
}

function withStatus(metrics, status, extra = {}) {
  return { ...(metrics || {}), ...extra, status };
}

function fallbackAdviceForMetrics(metrics) {
  const visualMean = toFiniteNumber(metrics?.visual_mean, 0);
  const attentionControl = toFiniteNumber(metrics?.attention_control_mean, 0);
  const languageSemantic = toFiniteNumber(metrics?.language_semantic_mean, 0);
  const peakRoi = toFiniteNumber(metrics?.peak_top_roi_score, 0);
  const avgMetric = (visualMean + attentionControl + languageSemantic + peakRoi) / 4;

  const drivers = [
    { name: "visual salience", score: visualMean },
    { name: "attention control", score: attentionControl },
    { name: "language semantics", score: languageSemantic },
    { name: "ROI peak response", score: peakRoi },
  ];
  const dominantDriver = drivers.reduce((a, b) => (a.score > b.score ? a : b));

  if (avgMetric > 0.75) {
    return `HIGH COGNITIVE LOAD DETECTED - Reduce visual complexity around ${dominantDriver.name}. Simplify the focal element and strengthen one clear visual path. CTR lift: +8% (medium confidence)`;
  }

  if (avgMetric > 0.5) {
    return `BALANCED ATTENTION PROFILE - Boost ${dominantDriver.name} with stronger contrast, clearer framing, or a more emotionally specific focal point. CTR lift: +12% (high confidence)`;
  }

  return `LOW COGNITIVE LOAD - Increase attention capture with faces, novelty, contrast, or a clearer emotional trigger around the primary subject. CTR lift: +15% (medium confidence)`;
}

function pendingAdvice() {
  return "Analysis is running. Your thumbnail has been safely saved and the final recommendation will appear here when processing completes.";
}

function geminiSafetySettings() {
  return [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  ];
}

async function ensureProfile(supabase, user) {
  if (!user?.id) return;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || null,
      full_name: user.user_metadata?.full_name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
    },
    { onConflict: "id" },
  );

  if (error) return;
}

async function resolveAuthenticatedUser(request, supabase, claimedUserId = null) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    if (claimedUserId) {
      return { error: "Could not verify your sign-in. Please refresh and try again.", status: 401 };
    }
    return { user: null };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    return { error: "Your sign-in expired. Please sign in again.", status: 401 };
  }

  if (claimedUserId && claimedUserId !== data.user.id) {
    return { error: "Authenticated user does not match upload owner.", status: 403 };
  }

  await ensureProfile(supabase, data.user);
  return { user: data.user };
}

async function buildGeminiAdvice(genAI, metrics) {
  const fallbackAdvice = fallbackAdviceForMetrics(metrics);
  if (!genAI) return { advice: fallbackAdvice, latencyMs: null };

  const visualMean = toFiniteNumber(metrics?.visual_mean, 0);
  const attentionControl = toFiniteNumber(metrics?.attention_control_mean, 0);
  const languageSemantic = toFiniteNumber(metrics?.language_semantic_mean, 0);
  const peakRoi = toFiniteNumber(metrics?.peak_top_roi_score, 0);
  const avgMetric = (visualMean + attentionControl + languageSemantic + peakRoi) / 4;
  const cognitiveLoad = avgMetric > 0.75 ? "high" : avgMetric > 0.5 ? "moderate" : "low";
  const drivers = [
    { name: "visual salience", score: visualMean },
    { name: "attention control", score: attentionControl },
    { name: "language semantics", score: languageSemantic },
    { name: "ROI peak response", score: peakRoi },
  ];
  const dominantDriver = drivers.reduce((a, b) => (a.score > b.score ? a : b));

  const prompt = `You are a neuroscientist advising YouTube creators on TRIBE V2 attention modeling.

TRIBE V2 METRICS (normalized 0-1):
- Visual Salience (fusiform gyrus activation): ${visualMean.toFixed(3)}
- Attention Control (frontoparietal network): ${attentionControl.toFixed(3)}
- Language Semantics (superior temporal): ${languageSemantic.toFixed(3)}
- ROI Peak Response (amygdala engagement): ${peakRoi.toFixed(3)}

COGNITIVE LOAD PROFILE: ${cognitiveLoad}
DOMINANT ATTENTION DRIVER: ${dominantDriver.name} (${dominantDriver.score.toFixed(3)})

OUTPUT VALID JSON ONLY (no markdown, no backticks):
{
  "attention_node": "brain region targeted",
  "cognitive_pathway": "neural pathway engaged",
  "optimization": "specific, testable action",
  "mechanism": "why it works in 1 sentence (use plain English, no jargon)",
  "avoid_trap": "cognitive bias that kills CTR",
  "predicted_ctr_lift": "X%",
  "confidence": "high|medium|low"
}`;

  const modelCandidates = [
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];
  const required = [
    "attention_node",
    "cognitive_pathway",
    "optimization",
    "mechanism",
    "avoid_trap",
    "predicted_ctr_lift",
    "confidence",
  ];

  for (const modelName of modelCandidates) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: geminiSafetySettings(),
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const startedAt = Date.now();
        const result = await model.generateContent(prompt);
        const latencyMs = Date.now() - startedAt;
        const rawText = result.response.text().trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON object found in Gemini response");

        const parsed = JSON.parse(jsonMatch[0]);
        const missing = required.filter((key) => !(key in parsed));
        if (missing.length > 0) {
          throw new Error(`Gemini response missing fields: ${missing.join(", ")}`);
        }

        const lift = String(parsed.predicted_ctr_lift).replace(/^\+/, "");
        return {
          advice: `${String(parsed.attention_node).toUpperCase()} -> ${String(parsed.cognitive_pathway).toUpperCase()} - ${parsed.optimization}. Why: ${parsed.mechanism} Avoid: ${parsed.avoid_trap}. CTR lift: +${lift} (${parsed.confidence} confidence)`,
          latencyMs,
        };
      } catch (err) {
        const message = err?.message || String(err);
        const retryable = /500|503|timeout|temporar|rate/i.test(message);
        if (!retryable || attempt === 3) break;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return { advice: fallbackAdvice, latencyMs: null };
}

async function finalizeGenerationFromMetrics({ supabase, genAI, row, metrics, heatmap }) {
  const finalizingMetrics = withStatus(metrics, FINALIZING_STATUS, {
    modal_job_id: row.raw_metrics?.modal_job_id || null,
  });

  await supabase
    .from("generations")
    .update({
      raw_metrics: finalizingMetrics,
      heatmap_base64: heatmap,
      gemini_analysis: fallbackAdviceForMetrics(metrics),
    })
    .eq("id", row.id);

  const { advice, latencyMs } = await buildGeminiAdvice(genAI, metrics);
  const completeMetrics = withStatus(metrics, COMPLETE_STATUS);

  const { data: updatedRow, error } = await supabase
    .from("generations")
    .update({
      raw_metrics: completeMetrics,
      heatmap_base64: heatmap,
      gemini_analysis: advice,
      gemini_latency_ms: latencyMs,
    })
    .eq("id", row.id)
    .select("*")
    .single();

  if (error) throw error;
  return updatedRow;
}

const getCandidateModalChannelUrls = () => {
  const candidates = [];

  const explicit = process.env.MODAL_CHANNEL_ENDPOINT_URL;
  if (explicit) candidates.push(explicit);

  const analyzeUrl = process.env.MODAL_ENDPOINT_URL;
  if (analyzeUrl) {
    candidates.push(
      analyzeUrl.replace(/-analyze\.modal\.run$/, "-analyze-channel.modal.run"),
    );
    candidates.push(
      analyzeUrl.replace(/-analyze\.modal\.run$/, "-analyze_channel.modal.run"),
    );
  }

  candidates.push(
    "https://sriharideveloper--croissant-tribe-analyzer-analyze-channel.modal.run",
  );

  return [...new Set(candidates)].filter(Boolean);
};

const getModalAsyncUrl = () => {
  const explicit = process.env.MODAL_ASYNC_ENDPOINT_URL;
  if (explicit) return explicit;

  const analyzeUrl = process.env.MODAL_ENDPOINT_URL;
  if (!analyzeUrl) {
    return "https://sriharideveloper--croissant-tribe-analyzer-analyze-async.modal.run";
  }

  // Best-effort transformation: https://...-analyze.modal.run -> ...-analyze-async.modal.run
  return analyzeUrl.replace(/-analyze\.modal\.run$/, "-analyze-async.modal.run");
};

const getModalResultUrl = () => {
  const explicit = process.env.MODAL_RESULT_ENDPOINT_URL;
  if (explicit) return explicit;

  const analyzeUrl = process.env.MODAL_ENDPOINT_URL;
  if (!analyzeUrl) {
    return "https://sriharideveloper--croissant-tribe-analyzer-analyze-result.modal.run";
  }

  return analyzeUrl.replace(/-analyze\.modal\.run$/, "-analyze-result.modal.run");
};

async function callModalChannel(payload) {
  const candidates = getCandidateModalChannelUrls();
  let lastErr = null;

  for (const modalUrl of candidates) {
    try {
      const modalResponse = await fetch(modalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!modalResponse.ok) {
        const text = await modalResponse.text().catch(() => "");
        throw new Error(
          `Modal server returned status ${modalResponse.status}${text ? `: ${text}` : ""}`,
        );
      }

      return await modalResponse.json();
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("Unable to reach Modal channel endpoint");
}

// Get client IP from request
function getClientIP(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request) {
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "check-trial") {
    // For now, just allow all trials (table migration pending)
    return NextResponse.json({ canUseTrial: true, used: false });
  }

  if (action === "check-status") {
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    try {
      const auth = await resolveAuthenticatedUser(request, supabase);
      if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
      const genAI = getGeminiClient();

      // Query generations table for this session
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        return NextResponse.json(
          { processing: true, step: "Processing in background..." },
          { status: 200 },
        );
      }

      const row = Array.isArray(data) ? data[0] : null;

      if (row) {
        if (row.user_id && row.user_id !== auth.user?.id) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const pendingJobId = row.raw_metrics?.modal_job_id;
        const status = metricsStatus(row.raw_metrics);

        if (status === FINALIZING_STATUS) {
          try {
            const finalRow = await finalizeGenerationFromMetrics({
              supabase,
              genAI,
              row,
              metrics: safeModalMetrics({ metrics: row.raw_metrics }),
              heatmap: row.heatmap_base64,
            });

            return NextResponse.json({
              complete: true,
              result: {
                id: finalRow.id,
                imageUrl: finalRow.image_url,
                heatmap: finalRow.heatmap_base64,
                metrics: finalRow.raw_metrics,
                advice: finalRow.gemini_analysis,
              },
            });
          } catch (e) {
            return NextResponse.json({
              processing: true,
              step: "Finalizing recommendations...",
            });
          }
        }

        if (pendingJobId && status === PROCESSING_STATUS) {
          try {
            const modalResultUrl = getModalResultUrl();
            const modalRes = await fetch(modalResultUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ job_id: pendingJobId }),
            });

            const modalJson = await modalRes.json().catch(() => null);
            if (modalRes.ok && modalJson?.status === "complete" && modalJson?.result) {
              const completedMetrics = safeModalMetrics(modalJson.result);
              const completedHeatmap =
                typeof modalJson.result?.heatmap_base64 === "string"
                  ? modalJson.result.heatmap_base64
                  : null;

              const finalRow = await finalizeGenerationFromMetrics({
                supabase,
                genAI,
                row,
                metrics: completedMetrics,
                heatmap: completedHeatmap,
              });

              return NextResponse.json({
                complete: true,
                result: {
                  id: finalRow.id,
                  imageUrl: finalRow.image_url,
                  heatmap: finalRow.heatmap_base64,
                  metrics: finalRow.raw_metrics,
                  advice: finalRow.gemini_analysis,
                },
              });
            }
            if (modalRes.ok && modalJson?.status === "error") {
              await supabase
                .from("generations")
                .update({
                  raw_metrics: withStatus(row.raw_metrics, ERROR_STATUS, {
                    modal_error: modalJson?.error || "Analysis job failed",
                  }),
                  gemini_analysis:
                    "Croissant analysis failed before completion. Please try this thumbnail again.",
                })
                .eq("id", row.id);

              return NextResponse.json(
                { error: modalJson?.error || "Analysis job failed" },
                { status: 502 },
              );
            }
          } catch (e) {
            // Keep the durable row pending; the next poll can retry Modal.
          }

          return NextResponse.json({
            processing: true,
            step: "Running Meta's frontier neuro model...",
          });
        }

        if (status === STARTING_MODAL_STATUS) {
          return NextResponse.json({
            processing: true,
            step: "Starting Meta's frontier neuro model...",
          });
        }

        if (status === ERROR_STATUS) {
          return NextResponse.json(
            { error: row.raw_metrics?.modal_error || "Analysis failed" },
            { status: 502 },
          );
        }

        // Analysis complete
        return NextResponse.json({
          complete: true,
          result: {
            id: row.id,
            imageUrl: row.image_url,
            heatmap: row.heatmap_base64,
            metrics: row.raw_metrics,
            advice: row.gemini_analysis,
          },
        });
      }

      // Still processing
      return NextResponse.json({
        processing: true,
        step: "Running Meta's frontier neuro model...",
      });
    } catch (err) {
      return NextResponse.json({ processing: true, error: err.message });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request) {
  try {
    const supabase = getSupabaseClient();

    const contentType = request.headers.get("content-type") || "";

    // JSON requests = channel analysis
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const channelHandle = String(
        body.channel_handle || body.channelHandle || body.handle || "",
      ).trim();

      if (!channelHandle) {
        return NextResponse.json(
          { error: "Missing channel_handle (e.g. @veritasium)" },
          { status: 400 },
        );
      }

      const payload = {
        channel_handle: channelHandle,
        total_videos: Number(body.total_videos ?? body.totalVideos ?? 10),
        days_old_min: Number(body.days_old_min ?? body.daysOldMin ?? 14),
        min_duration_sec: Number(
          body.min_duration_sec ?? body.minDurationSec ?? 180,
        ),
        playlist_end: Number(body.playlist_end ?? body.playlistEnd ?? 80),
      };

      try {
        const modalResult = await callModalChannel(payload);
        return NextResponse.json(modalResult);
      } catch (modalErr) {
        return NextResponse.json(
          {
            error: modalErr?.message || "Channel analysis failed.",
            hint: "Set MODAL_CHANNEL_ENDPOINT_URL (or MODAL_ENDPOINT_URL) in your environment.",
          },
          { status: 502 },
        );
      }
    }

    // 1. Parse Request File + Get Auth Context
    const formData = await request.formData();
    const file = formData.get("file");
    const claimedUserId = formData.get("userId") || null;
    const sessionId = formData.get("sessionId") || `session_${Date.now()}_${crypto.randomUUID()}`;
    const auth = await resolveAuthenticatedUser(request, supabase, claimedUserId);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.user?.id || null;

    if (!file) {
      return NextResponse.json(
        { error: "No thumbnail file uploaded." },
        { status: 400 },
      );
    }

    // Hard limits BEFORE reading into memory (prevents buffer blowups)
    if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    if (file.type && !ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 415 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("thumbnails")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Get public URL (and create a signed URL for Modal to fetch if needed)
    const {
      data: { publicUrl },
    } = supabase.storage.from("thumbnails").getPublicUrl(fileName);

    // Save the analysis row before Modal/Gemini so the upload appears in history
    // even if a browser tab closes during the external processing phase.
    const pendingMetrics = withStatus({}, STARTING_MODAL_STATUS);
    const { data: insertedRow, error: preInsertError } = await supabase
      .from("generations")
      .insert({
        image_url: publicUrl,
        heatmap_base64: null,
        raw_metrics: pendingMetrics,
        gemini_analysis: pendingAdvice(),
        user_id: userId,
        is_anonymous: !userId,
        session_id: sessionId,
      })
      .select("id")
      .single();

    if (preInsertError) {
      return NextResponse.json(
        { error: `Could not save analysis record: ${preInsertError.message}` },
        { status: 500 },
      );
    }

    // Create a signed URL to ensure Modal can access the object even if bucket is private
    let signedUrl = null;
    let signedUrlForClient = null;
    try {
      const [signedForModal, signedForClientRes] = await Promise.all([
        supabase.storage.from("thumbnails").createSignedUrl(fileName, 300), // 5 minutes
        supabase.storage.from("thumbnails").createSignedUrl(fileName, 3600), // 1 hour
      ]);
      signedUrl = signedForModal.data?.signedUrl || null;
      signedUrlForClient = signedForClientRes.data?.signedUrl || null;
    } catch (e) {
      signedUrl = null;
      signedUrlForClient = null;
    }

    // 3. Call Modal.com Serverless Python Endpoint
    const modalAsyncUrl = getModalAsyncUrl();

    let modalJobId = null;
    try {
      const payload = { image_url: signedUrl || publicUrl };
      const modalStartResponse = await fetch(modalAsyncUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!modalStartResponse.ok) {
        const text = await modalStartResponse.text().catch(() => "");
        throw new Error(
          `Modal server returned status ${modalStartResponse.status}${text ? `: ${text}` : ""}`,
        );
      }

      const startJson = await modalStartResponse.json();
      modalJobId = startJson?.job_id || null;
      if (!modalJobId) throw new Error("Modal did not return job_id");
    } catch (modalErr) {
      await supabase
        .from("generations")
        .update({
          raw_metrics: withStatus(pendingMetrics, ERROR_STATUS, {
            modal_error: modalErr?.message || "Modal start failed",
          }),
          gemini_analysis:
            "Croissant analysis could not start. Please try again in a moment.",
        })
        .eq("id", insertedRow.id);

      return NextResponse.json(
        {
          error:
            "Croissant analysis service is temporarily unavailable. Please try again shortly.",
          details: modalErr?.message,
        },
        { status: 502 },
      );
    }

    const metrics = withStatus({}, PROCESSING_STATUS, { modal_job_id: modalJobId });
    const { error: processingUpdateError } = await supabase
      .from("generations")
      .update({ raw_metrics: metrics })
      .eq("id", insertedRow.id);

    if (processingUpdateError) {
      return NextResponse.json(
        { error: `Could not queue analysis: ${processingUpdateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      imageUrl: signedUrlForClient || publicUrl,
      heatmap: null,
      metrics,
      advice: pendingAdvice(),
      id: insertedRow.id,
      processing: true,
      sessionId,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Future Subscription Hook (Razorpay Webhook Placeholder)
// ---------------------------------------------------------------------------
/**
 * POST /api/webhooks/razorpay
 *
 * This is the exact integration route that will receive Razorpay payment webhooks.
 * It is fully structured for simple transition to monetization.
 *
 * export async function POST(req) {
 *   try {
 *     const body = await req.json();
 *     const signature = req.headers.get('x-razorpay-signature');
 *
 *     // 1. Verify webhook signature using Razorpay webhook secret
 *     // const isValid = Razorpay.validateWebhookSignature(JSON.stringify(body), signature, process.env.RAZORPAY_WEBHOOK_SECRET);
 *     // if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
 *
 *     // 2. Identify event type (e.g. payment.captured or subscription.charged)
 *     const event = body.event;
 *     const paymentData = body.payload.payment.entity;
 *     const email = paymentData.email;
 *
 *     if (event === 'payment.captured') {
 *       // 3. Find the profile and update subscription tier / credits
 *       const { data: profile, error } = await supabase
 *         .from('profiles')
 *         .update({
 *           subscription_tier: 'pro',
 *           credits: 50 // Grant premium tokens
 *         })
 *         .eq('email', email)
 *         .select();
 *
 *       // Update subscription tier for the matching profile.
 *     }
 *
 *     return NextResponse.json({ received: true });
 *   } catch (error) {
 *     return NextResponse.json({ error: error.message }, { status: 500 });
 *   }
 * }
 */
