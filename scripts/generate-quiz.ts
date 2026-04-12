import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import OpenAI from "openai";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

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

async function main() {
  const videos = await prisma.video.findMany({
    where: { questions: { none: {} } },
  });

  console.log(`Found ${videos.length} video(s) without questions`);

  const client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  });

  for (const video of videos) {
    console.log(`Generating quiz for: ${video.title}`);

    // Parse transcript to plain text
    let text: string;
    try {
      const segments = JSON.parse(video.transcript);
      text = segments.map((s: any) => s.text).join(" ");
    } catch {
      text = video.transcript;
    }

    try {
      const res = await client.chat.completions.create({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `字幕内容：\n${text.slice(0, 8000)}` },
        ],
      });

      const content = res.choices[0].message.content || "";
      console.log("Raw response:", content.slice(0, 200));

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response");
        continue;
      }

      const data = JSON.parse(jsonMatch[0]);
      const questions = data.questions;

      if (!questions?.length) {
        console.error("No questions in parsed data");
        continue;
      }

      for (let i = 0; i < questions.length; i++) {
        await prisma.question.create({
          data: {
            videoId: video.id,
            questionText: questions[i].questionText,
            optionA: questions[i].optionA,
            optionB: questions[i].optionB,
            optionC: questions[i].optionC,
            optionD: questions[i].optionD,
            correctAnswer: questions[i].correctAnswer,
            explanation: questions[i].explanation,
            orderIndex: i,
          },
        });
      }

      console.log(`✅ Created ${questions.length} questions`);
    } catch (e: any) {
      console.error(`❌ Failed:`, e.message);
    }
  }

  await prisma.$disconnect();
}

main();
