const asyncHandler = require("express-async-handler");
const OpenAI = require("openai");

//@desc دریافت سوالات چهارگزینه‌ای از OpenAI
//@route POST /api/v1/education/generateQuestion
//@access private
const generateQuestion = asyncHandler(async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body; // دریافت ورودی از درخواست کاربر

    if (!topic || !difficulty || !count) {
      return res.status(400).json({ message: "لطفاً همه فیلدها را ارسال کنید." });
    }

    const openai = new OpenAI({
      apiKey: process.env.openAIKey,
    });

    const prompt = `
    تو یک سیستم تولید سوالات چهارگزینه‌ای هستی. لطفاً بر اساس مشخصات زیر سوالات را تولید کن:

    - **موضوع:** ${topic}
    - **سطح دشواری:** ${difficulty}
    - **تعداد سوال:** ${count}
    - **فرمت خروجی:**  
    برای هر سوال، فرمت خروجی باید دقیقاً به شکل زیر باشد:
    {
      "question": "متن سوال",
      "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
      "correct_answer": "گزینه صحیح"
    }

    لطفاً خروجی را به‌صورت یک آرایه JSON بازگردان.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // مدل GPT-4o را استفاده کن
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content;
    
    // بررسی و تبدیل خروجی به JSON
    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch (error) {
      return res.status(500).json({ message: "خطا در پردازش پاسخ از OpenAI" });
    }

    console.log(questions)

    res.status(200).json({ questions });
  } catch (err) {
    console.error("خطا در دریافت سوالات:", err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

module.exports = {
  generateQuestion,
};
