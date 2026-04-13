import OpenAI from "openai";

export interface QuizQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

const SYSTEM_PROMPT = `你是一位法语教学专家。根据提供的法语视频信息（标题、频道、描述），推断视频主题，生成5道与该主题相关的法语学习选择题。

题目类型可以包括：
- 与视频主题相关的词汇题
- 常用表达和句型
- 语法点（与主题相关）
- 文化知识

要求：
- 题目用法语写
- 4个选项用法语写
- 解释用中文写，帮助中国学习者理解
- 难度适中（B1-B2水平）

返回JSON格式：
{
  "questions": [
    {
      "questionText": "法语问题",
      "optionA": "选项A",
      "optionB": "选项B",
      "optionC": "选项C",
      "optionD": "选项D",
      "correctAnswer": "A",
      "explanation": "中文解释"
    }
  ]
}`;

export async function generateQuiz(videoInfo: {
  title: string;
  channel: string;
  description: string;
}): Promise<QuizQuestion[]> {
  const client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  });

  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `视频标题：${videoInfo.title}\n频道：${videoInfo.channel}\n描述：${videoInfo.description.slice(0, 2000)}`,
      },
    ],
  });

  const content = res.choices[0].message.content || "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  let questions: any[];
  try {
    questions = JSON.parse(jsonMatch?.[0] || "{}").questions || [];
  } catch {
    const cleaned = (jsonMatch?.[0] || "{}").replace(/[\x00-\x1f]/g, " ");
    questions = JSON.parse(cleaned).questions || [];
  }

  const required = ["questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "explanation"];
  return questions.filter(
    (q: any) => required.every((k) => typeof q[k] === "string" && q[k].trim())
  );
}
