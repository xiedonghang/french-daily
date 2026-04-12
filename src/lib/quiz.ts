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

const SYSTEM_PROMPT = `你是一位法语教学专家。根据提供的法语视频字幕，生成5道法语听力理解选择题。

要求：
- 题目用法语写
- 4个选项用法语写
- 解释用中文写，帮助中国学习者理解
- 题目应覆盖视频的不同部分
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

export async function generateQuiz(transcript: string): Promise<QuizQuestion[]> {
  const client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  });

  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `字幕内容：\n${transcript.slice(0, 8000)}` },
    ],
  });

  const content = res.choices[0].message.content || "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const data = JSON.parse(jsonMatch?.[0] || "{}");
  return data.questions || [];
}
