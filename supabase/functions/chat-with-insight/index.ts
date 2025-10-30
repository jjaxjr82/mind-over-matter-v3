import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phase, question, insight, conversationHistory, userContext } = await req.json();
    
    console.log('Chat with insight request:', { phase, question, hasInsight: !!insight });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt
    const systemPrompt = `You are a personal growth coach having a conversation about today's insight.

Context of the original insight:
- Theme: ${insight.theme}
- Quote: "${insight.quote?.text}" - ${insight.quote?.author}
- Action items: ${insight.actionItems?.join(', ')}
${userContext.situation ? `- User's current situation: ${userContext.situation}` : ''}
${userContext.challenges?.length ? `- Active challenges: ${userContext.challenges.join(', ')}` : ''}
${userContext.wisdomSources?.length ? `- Wisdom sources: ${userContext.wisdomSources.join(', ')}` : ''}

Previous conversation:
${conversationHistory.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.text}`).join('\n')}

Guidelines:
- Keep responses concise (2-3 paragraphs max)
- Reference the original insight when relevant
- Be supportive and practical
- If they ask for additional recommendations, keep them SHORT (5-15 min reads, 20-30 min listens)
- Stay focused on actionable advice
- Use a warm, encouraging tone`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in chat-with-insight function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
