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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phase = "morning", challenges, wisdomSources, schedule, workMode, energyLevel, focusAreas, situation, morningInsight, middayReflection } = await req.json();

    let systemPrompt = '';
    
    if (phase === "morning") {
      systemPrompt = `You are a personal growth advisor combining stoic wisdom with modern psychology. 
Generate a structured daily insight in JSON format with these exact fields:
{
  "title": "Daily Insight",
  "quote": {
    "text": "A relevant inspirational quote",
    "author": "Author name"
  },
  "powerQuestion": "One powerful, specific question they should ask themselves today (relates directly to their challenges)",
  "metaphor": "A concrete, memorable metaphor or 2-sentence story that illustrates the day's theme (make it visual and relatable)",
  "actionItems": [
    {"text": "Specific actionable item 1"},
    {"text": "Specific actionable item 2"},
    {"text": "Specific actionable item 3"}
  ],
  "todaysPitfall": "One specific behavior or pattern to actively avoid today (based on their challenges)",
  "theAnchor": "A short, memorable story or real example (2-3 sentences) tied directly to their specific challenge that they can recall when struggling",
  "carryThis": "One single-sentence mantra to repeat when struggling (make it personal and powerful)",
  "recommendations": [
    {
      "type": "article or podcast",
      "title": "Specific title of real article/podcast",
      "description": "1-2 sentences explaining why this is relevant to their specific challenges and context",
      "estimatedTime": "5 min read or 30 min listen"
    }
  ]
}

User Context:
- Active Challenges: ${challenges}
- Wisdom Sources: ${wisdomSources}
- Today's Schedule: ${schedule}
- Work Mode: ${workMode}
- Energy Level: ${energyLevel}
- Focus Areas: ${focusAreas}
- Current Situation: ${situation}

Recommendations Guidelines:
- Provide 2-3 high-quality recommendations (mix of articles and podcasts)
- Base recommendations on their active challenges and wisdom sources (suggest similar quality content)
- Consider their work mode, energy level, and focus areas
- Suggest real, actionable content from trusted sources (similar to their wisdom library)
- Match content to their current situation (e.g., WFH-friendly for home workers)
- Vary between quick reads (5-10 min) and longer podcasts (30-60 min)
- Make each recommendation directly relevant to a specific challenge or focus area
- Prioritize practical, actionable content over theoretical

Return ONLY valid JSON, no markdown, no code blocks.`;
    } else {
      // Midday insight
      systemPrompt = `You are a personal growth advisor. The user is at midday and has shared their reflection. Generate a supportive midday insight to help them adjust and finish strong.

Morning Context:
- Morning Insight: ${JSON.stringify(morningInsight)}
- Focus Areas: ${focusAreas}

Midday Reflection:
${middayReflection}

Generate a JSON response with these exact fields:
{
  "title": "Brief title about adjustment/refocus (3-5 words)",
  "quote": {
    "text": "An inspiring quote about resilience or momentum",
    "author": "Quote author"
  },
  "powerQuestion": "One powerful question to refocus their afternoon",
  "metaphor": "A concrete, memorable metaphor or 2-sentence story about adjustment/resilience",
  "actionItems": [
    {"text": "Adjusted action 1 for afternoon"},
    {"text": "Adjusted action 2 for afternoon"},
    {"text": "Adjusted action 3 for afternoon"}
  ],
  "todaysPitfall": "One specific thing to avoid this afternoon (based on their midday reflection)",
  "theAnchor": "A short, memorable example (2-3 sentences) about recovery or momentum that relates to their situation",
  "carryThis": "One single-sentence mantra for the afternoon",
  "recommendations": [
    {
      "type": "article or podcast",
      "title": "Specific title",
      "description": "Why this helps with their afternoon focus",
      "estimatedTime": "time estimate"
    }
  ]
}

Guidelines:
- Acknowledge what they shared in their midday reflection
- Be encouraging and realistic
- Help them refocus and prioritize for the remaining day
- Reference morning action items if relevant
- Keep tone supportive and energizing
- Provide 1-2 recommendations for afternoon listening/reading to support momentum and focus

Return ONLY valid JSON, no markdown, no code blocks.`;
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate my daily insight based on the context provided.' }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits exhausted. Please add credits to your workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\n?/g, '');
    }
    
    const parsedInsight = JSON.parse(cleanContent);
    
    return new Response(
      JSON.stringify(parsedInsight), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
