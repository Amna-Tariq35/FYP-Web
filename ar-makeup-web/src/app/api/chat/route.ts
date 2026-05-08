import { streamText, tool, UIMessage, convertToModelMessages } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are a makeup assistant for an AR makeup e-commerce store.
STRICT RULES:
1. ALWAYS call 'recommendProducts' tool before ANY response. No exceptions.
2. For vague queries like "recommend blush", call tool with just category="blush".
3. NEVER list product names in text. Keep response to 1-2 lines max.
4. If user says "blush" → category="blush", "lipstick" → category="lipstick", etc.
5. Always extract whatever info is available — missing fields just leave empty.`,
    messages: await convertToModelMessages(messages),
    tools: {
      recommendProducts: tool({
        description:
          "Fetch makeup products and their specific shades from the Supabase database.",
        inputSchema: z.object({
          category: z
            .string()
            .optional()
            .describe("e.g., foundation, lipstick, blush"),
          skinType: z
            .string()
            .optional()
            .describe("e.g., Oily, Dry, Combination, Normal"),
          itemForm: z
            .string()
            .optional()
            .describe("e.g., Liquid, Powder, Stick, Cream"),
          colorFamily: z
            .string()
            .optional()
            .describe("e.g., Red, Pink, Nude, Brown"),
          skinTone: z
            .string()
            .optional()
            .describe("e.g., Fair, Light, Medium, Tan, Deep"),
          undertone: z
            .string()
            .optional()
            .describe("e.g., Warm, Cool, Neutral"),
        }),
        execute: async ({
          category,
          skinType,
          itemForm,
          colorFamily,
          skinTone,
          undertone,
        }) => {
          const supabase = await createSupabaseServerClient();

          let query = supabase
            .from("makeup_products")
            .select("*, product_shades!inner(*)")
            .limit(5);

          if (category) query = query.ilike("category", `%${category}%`);
          if (skinType) query = query.ilike("skin_type", `%${skinType}%`);
          if (itemForm) query = query.ilike("item_form", `%${itemForm}%`);
          if (colorFamily)
            query = query.ilike(
              "product_shades.color_family",
              `%${colorFamily}%`,
            );
          if (skinTone)
            query = query.ilike("product_shades.skin_tone", `%${skinTone}%`);
          if (undertone)
            query = query.ilike("product_shades.undertone", `%${undertone}%`);

          const { data, error } = await query;

          if (error) {
            console.error("Supabase Query Error:", error);
            return { error: "Failed to fetch products from database" };
          }

          return data ?? [];
        },
      }),
    },
    stopWhen: ({ steps }) => steps.length >= 5, // ✅ Zaroori — tool call ke baad AI wapas aata hai aur user ko answer deta hai
    providerOptions: {
    groq: {
      parallel_tool_calls: false, // ✅ Tool calling reliable ho jati hai
    },
  },
  });

  return result.toUIMessageStreamResponse();
}
