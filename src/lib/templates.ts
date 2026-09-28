export type TemplateCategory =
  | "career-lesson"
  | "achievement"
  | "industry-take"
  | "team-credit"
  | "how-to";

export interface TemplateEntry {
  id: string;
  type: "hook" | "template";
  category: TemplateCategory;
  label: string;
  seedText: string;
}

export const TEMPLATE_LIBRARY: TemplateEntry[] = [
  {
    id: "hook-mistake-01",
    type: "hook",
    category: "career-lesson",
    label: "A mistake that taught you something",
    seedText:
      "Write about a mistake I made earlier in my career, what it cost me, and the one lesson I'd pass on to someone junior.",
  },
  {
    id: "hook-mistake-02",
    type: "hook",
    category: "career-lesson",
    label: "Something you believed, then stopped believing",
    seedText:
      "Write about something I used to firmly believe about my industry, and what specific experience changed my mind.",
  },
  {
    id: "hook-achievement-01",
    type: "hook",
    category: "achievement",
    label: "A milestone, without bragging",
    seedText:
      "Write about a recent milestone or win, framed around what it took to get there rather than the achievement itself.",
  },
  {
    id: "hook-team-01",
    type: "hook",
    category: "team-credit",
    label: "Crediting someone who helped you",
    seedText:
      "Write about a mentor, colleague, or team member who helped me get somewhere, and specifically what they did that mattered.",
  },
  {
    id: "hook-industry-01",
    type: "hook",
    category: "industry-take",
    label: "An unpopular opinion in your field",
    seedText:
      "Write about an opinion I hold about my industry that most people in my field would disagree with, and why I hold it anyway.",
  },
  {
    id: "hook-industry-02",
    type: "hook",
    category: "industry-take",
    label: "A trend you're skeptical of",
    seedText:
      "Write about a trend everyone in my industry is excited about right now, and why I think it's overrated or misunderstood.",
  },
  {
    id: "hook-howto-01",
    type: "hook",
    category: "how-to",
    label: "A process you'd teach a beginner",
    seedText:
      "Write a short walkthrough of one process or skill I'm good at, explained simply enough for someone new to my field.",
  },
  {
    id: "hook-achievement-02",
    type: "hook",
    category: "achievement",
    label: "A number that tells a story",
    seedText:
      "Write about a specific result or number from recent work, and the story behind how we got there.",
  },
  {
    id: "template-before-after",
    type: "template",
    category: "career-lesson",
    label: "Before / after structure",
    seedText:
      "Write using a before-and-after structure: describe how I used to approach [a specific work situation], what changed, and how I approach it now.",
  },
  {
    id: "template-three-things",
    type: "template",
    category: "how-to",
    label: "Three things I learned",
    seedText:
      "Write as a list of three specific things I learned from a recent project or experience, each with one concrete example.",
  },
  {
    id: "template-question-open",
    type: "template",
    category: "industry-take",
    label: "Open with a direct question",
    seedText:
      "Write starting with a direct question to the reader about a common challenge in my industry, then share my perspective on it.",
  },
  {
    id: "template-story-lesson",
    type: "template",
    category: "career-lesson",
    label: "Short story, then the takeaway",
    seedText:
      "Write as a short, specific story from my work (2-3 sentences of what happened), followed by the one takeaway I want the reader to walk away with.",
  },
];

export function getTemplatesByType(type: "hook" | "template"): TemplateEntry[] {
  return TEMPLATE_LIBRARY.filter((entry) => entry.type === type);
}
