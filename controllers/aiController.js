const asyncHandler = require("express-async-handler");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const educationModel = require("../models/educationModel");
const jdate = require('jdate').JDate();

const base64Obj = require("convert-base64-to-image")
const OpenAI = require("openai")



//@desc courseCancelPreSignup
//@route get /api/v1/education/getAllEducationGroup
//@access private
const generateQuestion = asyncHandler(async (req, res) => {
  try {

    const openai = new OpenAI({
        apiKey: process.env.openAIKey,
    });
    const completion = openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {"role": "user", "content": "write a haiku about ai"},
        ],
      });
      completion.then((result) => console.log(result.choices[0].message));
      //res.status(200).json({ 'GOOD' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

module.exports = {
    generateQuestion
};