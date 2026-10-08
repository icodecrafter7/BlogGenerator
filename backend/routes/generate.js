import express from 'express';
import Groq from 'groq-sdk';
import Blog from '../models/Blog.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Check if Groq API key is properly configured
const isGroqConfigured = () => {
  const apiKey = process.env.GROQ_API_KEY;
  return apiKey && apiKey !== 'YOUR_GROQ_API_KEY_HERE' && apiKey.trim() !== '';
};

// Helper to initialize Groq
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE' || apiKey.trim() === '') {
    throw new Error('Groq API key is not configured in backend/.env');
  }
  return new Groq({ apiKey });
};

// @desc    Generate structured blog outline
// @route   POST /api/blogs/:id/outline
// @access  Private
router.post('/:id/outline', protect, async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, userId: req.user.id });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }

    if (!isGroqConfigured()) {
      console.log('Running in MOCK mode for Outline Generation');
      const mockOutline = {
        title: blog.title || "The Future of Agentic Software Architectures",
        sections: [
          { heading: "Introduction to Agentic Architectures", level: 2, brief_intent: "Define agents and their roles in modern software engineering." },
          { heading: "Core Communication Protocols", level: 2, brief_intent: "Examine how agents pass messages and coordinate state." },
          { heading: "Emerging Design Patterns", level: 3, brief_intent: "Analyze patterns like chains, routers, and multi-agent systems." },
          { heading: "Overcoming Latency and Reliability Hurdles", level: 2, brief_intent: "Discuss timeout configurations and fallback systems." },
          { heading: "Conclusion and Next Steps", level: 2, brief_intent: "Summarize future directions of autonomous coding teams." }
        ]
      };
      blog.outline = mockOutline.sections;
      blog.title = mockOutline.title;
      await blog.save();
      return res.status(200).json({ success: true, blog });
    }

    const groq = getGroqClient();

    const prompt = `
      You are an expert content strategist. Generate a structured blog outline for the topic: "${blog.title}".
      
      Target Audience Demographics: ${blog.configuration.targetAudience}
      Primary Objective: ${blog.configuration.objective}
      Narrative Tone: ${blog.configuration.tone}
      
      ${blog.configuration.groundingContext ? `[GROUNDING CONTEXT]: Use these facts and references:\n${blog.configuration.groundingContext}` : ''}
      
      Create a logical progression of headings (H2 and H3 levels) representing the structure of a premium article.
      
      You MUST respond with a JSON object matching this schema:
      {
        "title": "A refined/optimized blog title based on the input",
        "sections": [
          {
            "heading": "The section header title",
            "level": 2 or 3 (integer),
            "brief_intent": "A one-sentence summary of the main points to be covered in this section"
          }
        ]
      }
      Do not include any introductory or concluding comments, code block wrappers like \`\`\`json, or any text other than the JSON object itself.
    `;

    const chatCompletion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist. You only respond with valid JSON output matching the requested schema.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_object'
      }
    });

    const responseText = chatCompletion.choices[0].message.content;
    let cleanResponseText = responseText.trim();
    if (cleanResponseText.startsWith('```')) {
      cleanResponseText = cleanResponseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    const parsedOutline = JSON.parse(cleanResponseText);

    // Save outline to DB
    blog.outline = parsedOutline.sections || [];
    if (parsedOutline.title) {
      blog.title = parsedOutline.title;
    }
    await blog.save();

    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error(`Generate Outline Error: ${error.message}`);
    res.status(500).json({ error: `Failed to generate outline: ${error.message}` });
  }
});

// @desc    Initiate SSE stream for blog content generation
// @route   GET /api/blogs/:id/stream
// @access  Private
router.get('/:id/stream', protect, async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, userId: req.user.id });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }

    if (!isGroqConfigured()) {
      console.log('Running in MOCK mode for Text Streaming');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Content-Encoding', 'none');

      const mockContentText = `
        <h2>Introduction to Agentic Architectures</h2>
        <p>In the landscape of modern systems engineering, <strong>agentic architectures</strong> represent a paradigm shift. Unlike standard deterministic loops, agents operate with a high degree of autonomy, making decisions based on dynamic state environments.</p>
        <h2>Core Communication Protocols</h2>
        <p>For multi-agent systems to function effectively, reliable communication channels are mandatory. Message queues, structured JSON contracts, and state sync databases form the bedrock of interaction.</p>
        <h3>Emerging Design Patterns</h3>
        <p>Several patterns have gained prominence, including sequential chains, routing selectors, and hierarchical director-worker networks. These structures allocate tasks optimally to specialized models.</p>
        <h2>Overcoming Latency and Reliability Hurdles</h2>
        <p>A primary bottleneck in LLM applications is response latency. By optimizing streaming parsers and implementing robust local caches, developer teams can design systems that remain responsive under heavy loads.</p>
        <h2>Conclusion and Next Steps</h2>
        <p>The transition toward agent-assisted systems is accelerating. EmpathWrite AI stands at the forefront of this shift, pairing intuitive text canvas interfaces with high-performance systemic prompts to humanize collaborative drafting.</p>
      `;

      // Stream this mock text token-by-token (split by characters/words)
      const chunks = mockContentText.match(/.{1,16}/g) || [mockContentText];
      
      for (const chunk of chunks) {
        await new Promise(resolve => setTimeout(resolve, 20));
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Save fully generated text to MongoDB
      blog.content = mockContentText;
      await blog.save();

      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    const groq = getGroqClient();

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Encoding', 'none');

    const antiAIInstruction = `
      CRITICAL: You must bypass corporate clichés and robotic structural patterns. Never use introductory filler phrases like 'In today's fast-paced digital landscape', 'It is important to remember', 'Moreover', or 'Furthermore'. Avoid repeating the main keyword unnaturally. Write with conversational cadence, using varied sentence lengths (alternating short, punched statements with occasional descriptive complex sentences) to ensure a high human-readability profile.
      Always write directly in clean HTML format. Use <h2> and <h3> for headings, <p> for paragraphs, <strong> for emphasis, and <ul>/<li> for lists. Do not wrap the response in markdown code blocks like \`\`\`html.
    `;

    const prompt = `
      Systemic Persona: You are EmpathWrite AI, a world-class professional writer and subject matter expert.
      ${antiAIInstruction}

      Title: ${blog.title}
      Target Audience: ${blog.configuration.targetAudience}
      Objective: ${blog.configuration.objective}
      Tone: ${blog.configuration.tone}

      ${blog.configuration.groundingContext ? `[GROUNDING CONTEXT]: Write the article using the verified facts provided below. Avoid writing ungrounded claims:\n${blog.configuration.groundingContext}` : ''}

      Follow this structure/outline to draft the article:
      ${JSON.stringify(blog.outline)}

      Write the complete long-form blog post.
    `;

    const stream = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true
    });

    let fullText = '';
    
    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      if (chunkText) {
        fullText += chunkText;
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    // Save fully generated text to MongoDB
    blog.content = fullText;
    await blog.save();

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error(`Streaming Generative Error: ${error.message}`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// @desc    Modify highlighted text inline
// @route   POST /api/blogs/inline-edit
// @access  Private
router.post('/inline-edit', protect, async (req, res) => {
  try {
    const { text, action, tone } = req.body;

    if (!text || !action) {
      return res.status(400).json({ error: 'Please provide text and action properties' });
    }

    if (!isGroqConfigured()) {
      console.log('Running in MOCK mode for Inline Editing');
      let mockEditedText = '';
      if (action === 'humanize') {
        mockEditedText = `Truly, the shift towards autonomous agents is reshaping how software is crafted from the ground up, making development more organic and less rigid.`;
      } else if (action === 'expand') {
        mockEditedText = `${text} Expanding on this thought, when we look at the historical context of software layers, it becomes obvious that adding abstraction layers historically unlocks massive developer velocity benefits.`;
      } else if (action === 'condense') {
        mockEditedText = `Autonomous agents are redefining software engineering workflows.`;
      } else {
        mockEditedText = `Here is a refined segment in a ${tone || 'Witty'} tone: Let's face it, getting agents to talk to each other without causing a stack overflow is half the battle!`;
      }
      return res.status(200).json({ success: true, text: mockEditedText });
    }

    const groq = getGroqClient();

    let actionPrompt = '';

    switch (action) {
      case 'humanize':
        actionPrompt = `Humanize the following text block. Strip corporate buzzwords and robotic structures. Make the phrasing flow naturally with varied sentence lengths and conversational rhythm. Return ONLY the revised text with no extra commentary.
        Text: "${text}"`;
        break;
      case 'expand':
        actionPrompt = `Expand and elaborate on this text. Add context, interesting details, or analogies to enrich the insight. Ensure it matches a professional blog quality. Return ONLY the expanded text with no extra commentary.
        Text: "${text}"`;
        break;
      case 'condense':
        actionPrompt = `Condense and simplify this text to make it punchy and clear. Eliminate fluff. Return ONLY the condensed text with no extra commentary.
        Text: "${text}"`;
        break;
      case 'tone':
        if (!tone) {
          return res.status(400).json({ error: 'Please specify a tone option' });
        }
        actionPrompt = `Rewrite the following text using a strictly "${tone}" tone. Make it sound native and appropriate. Return ONLY the rewritten text with no extra commentary.
        Text: "${text}"`;
        break;
      default:
        return res.status(400).json({ error: `Unknown editing action: ${action}` });
    }

    const chatCompletion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'user',
          content: actionPrompt
        }
      ]
    });

    const updatedText = chatCompletion.choices[0].message.content.trim();

    res.status(200).json({ success: true, text: updatedText });
  } catch (error) {
    console.error(`Inline Edit Error: ${error.message}`);
    res.status(500).json({ error: `Failed to execute inline edit: ${error.message}` });
  }
});

export default router;
