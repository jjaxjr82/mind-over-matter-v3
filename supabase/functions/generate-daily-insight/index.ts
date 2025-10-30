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

CRITICAL CONTEXT - READ THIS FIRST:
Current Situation: ${situation}

INSTRUCTIONS FOR MAJOR LIFE EVENTS:
- If the situation describes a MAJOR LIFE EVENT (divorce, separation, death, grief, job loss, health crisis, major transition, relationship ending, family crisis), this MUST be the PRIMARY FOCUS of your entire insight
- Major life events OVERRIDE normal challenge prioritization - they are the lens through which ALL advice should be given
- When a major situation is present:
  * Your quote MUST relate to resilience, grief, major transitions, or rebuilding
  * Your power question MUST address the emotional/practical aspects of this specific life event
  * Your metaphor MUST relate to major change, letting go, or rebuilding after loss
  * Your action items MUST include emotionally supportive actions (e.g., "Call a trusted friend", "Journal about your feelings", "Give yourself permission to rest")
  * Your anchor MUST be a story about someone who navigated this type of major life event
  * Your mantra MUST provide comfort and courage for someone in crisis or major transition
  * Recommendations MUST include resources specific to this type of life event (grief counseling, divorce recovery, career transition guides, etc.)
- Tone for major life events: Compassionate, grounded, realistic, and deeply human. Acknowledge the difficulty. No toxic positivity.

Additional Context:
- Active Challenges: ${challenges}
- Wisdom Sources: ${wisdomSources}
- Today's Schedule: ${schedule}
- Work Mode: ${workMode}
- Energy Level: ${energyLevel}
- Focus Areas: ${focusAreas}

Generate a structured daily insight in JSON format with these exact fields:
{
  "title": "Daily Insight",
  "quote": {
    "text": "A relevant inspirational quote (MUST relate to their major situation if present)",
    "author": "Author name"
  },
  "powerQuestion": "One powerful, specific question they should ask themselves today (MUST address major situation if present, otherwise relates to their challenges)",
  "metaphor": "A concrete, memorable metaphor or 2-sentence story that illustrates the day's theme (MUST relate to major situation if present)",
  "actionItems": [
    {"text": "Specific actionable item 1 (include emotionally supportive actions if major situation present)"},
    {"text": "Specific actionable item 2"},
    {"text": "Specific actionable item 3"}
  ],
  "todaysPitfall": "One specific behavior or pattern to actively avoid today (MUST consider major situation if present)",
  "theAnchor": "A short, memorable story or real example (2-3 sentences) tied directly to their specific situation/challenge that they can recall when struggling",
  "carryThis": "One single-sentence mantra to repeat when struggling (MUST provide comfort for major situation if present)",
  "recommendations": [
    {
      "type": "article or podcast",
      "title": "Specific title of real article/podcast",
      "description": "1-2 sentences explaining why this is relevant to their specific situation and context",
      "estimatedTime": "5 min read or 30 min listen"
    }
  ]
}

Recommendations Guidelines:
- Provide 2-3 SHORT, CONSUMABLE recommendations ONLY
- NEVER recommend full books - the user wants quick wins, not reading lists
- Article recommendations: 5-15 minute reads MAX (blog posts, essays, magazine articles)
- Podcast recommendations: 20-30 minute episodes MAX (specific episodes, not entire shows)
- If major situation present: Prioritize SHORT resources for that life event (10-min divorce recovery article, 20-min grief podcast episode)
- If no major situation: Base on challenges and wisdom sources, but keep it BRIEF
- Consider their work mode and energy level - they need bite-sized content
- Suggest real, specific content (not "read Meditations" but "read this 8-minute Daily Stoic article on...")
- Each recommendation must be directly relevant and actually consumable today

Return ONLY valid JSON, no markdown, no code blocks.`;
    } else {
      // Midday insight
      systemPrompt = `You are a personal growth advisor. The user is at midday and has shared their reflection. Generate a supportive midday insight to help them adjust and finish strong.

CRITICAL CONTEXT - MAJOR SITUATION:
Current Situation: ${situation}

IMPORTANT: If this situation involves a major life event (divorce, separation, death, job loss, health crisis), keep this as the PRIMARY lens for your midday advice. Major life transitions require ongoing compassion and realistic expectations throughout the day.

Morning Context:
- Morning Insight: ${JSON.stringify(morningInsight)}
- Focus Areas: ${focusAreas}

Midday Reflection:
${middayReflection}

Generate a JSON response with these exact fields:
{
  "title": "Brief title about adjustment/refocus (3-5 words)",
  "quote": {
    "text": "An inspiring quote about resilience or momentum (MUST relate to major situation if present)",
    "author": "Quote author"
  },
  "powerQuestion": "One powerful question to refocus their afternoon (acknowledge major situation if present)",
  "metaphor": "A concrete, memorable metaphor or 2-sentence story about adjustment/resilience (relate to major situation if present)",
  "actionItems": [
    {"text": "Adjusted action 1 for afternoon (be realistic about capacity if major situation present)"},
    {"text": "Adjusted action 2 for afternoon"},
    {"text": "Adjusted action 3 for afternoon"}
  ],
  "todaysPitfall": "One specific thing to avoid this afternoon (based on their midday reflection and major situation if present)",
  "theAnchor": "A short, memorable example (2-3 sentences) about recovery or momentum that relates to their situation",
  "carryThis": "One single-sentence mantra for the afternoon (provide comfort if major situation present)",
  "recommendations": [
    {
      "type": "article or podcast",
      "title": "Specific title",
      "description": "Why this helps with their afternoon focus (relate to major situation if present)",
      "estimatedTime": "time estimate"
    }
  ]
}

Guidelines:
- Acknowledge what they shared in their midday reflection
- If major situation present: Be compassionate about reduced capacity, acknowledge ongoing difficulty
- Be encouraging and realistic (especially if they're dealing with a major life event)
- Help them refocus and prioritize for the remaining day
- Reference morning action items if relevant
- Keep tone supportive and energizing (but grounded if major situation present)
- Provide 1-2 SHORT recommendations for afternoon listening/reading to support momentum and focus (5-15 min reads or 20-30 min listens MAX, prioritize situation-relevant resources if major situation present)

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
