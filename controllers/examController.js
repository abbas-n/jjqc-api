const asyncHandler = require("express-async-handler");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const PModel = require("../models/publicModel");
const examModel = require("../models/examModel");
const jdate = require('jdate').JDate();


//@desc get system exams list and user exams data
//@route GET /api/v1/exam/getExamsAndUserExamsData
//@access private
const getExamsAndUserExamsData = asyncHandler(async (req, res) => {
    try {
        const userID = req.user.ID;
        let userExams = await examModel.getUserExams(userID);
        let activeExam = await examModel.getActiveExams();
        let userHasResume = await examModel.getUserResumeData();
        if (userHasResume) {
            userHasResume = true;
        } else {
            userHasResume = false;
        }
        res.status(200).json({ userExams: userExams, activeExam: activeExam, userHasResume: userHasResume });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "خطا در دریافت اطلاعات" });
    }
});

//@desc get exam questions
//@route POST /api/v1/exam/getExamQuestions
//@access private
const getExamQuestions = asyncHandler(async (req, res) => {
    try {
        const userID = req.user.ID;
        const { examId } = req.body;
        let userData = await examModel.getUserData(userID);
        let examQuestions = await examModel.getExamQuestions(examId, userData);
        if (!examQuestions) {
            res.status(400).json({ message: 'خطا در بارگذاری آزمون!' });
        } else {
            res.status(200).json({ examQuestions: examQuestions });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "خطا در دریافت اطلاعات!" });
    }
});

//@desc get exam questions
//@route POST /api/v1/exam/getExamQuestions
//@access private
const submitExamAnswer = asyncHandler(async (req, res) => {
    try {
        const userID = req.user.ID;
        const { examAnswer, examId } = req.body;
        let userData = await examModel.getUserData(userID);
        let submitRS = await examModel.submitExamAnswer(examAnswer, userData, userID, examId);
        if (!submitRS || submitRS == -1) {
            res.status(400).json({ message: 'خطا در ثبت اطلاعات!' });
        } else {
            res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد.' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "خطا در ثبت اطلاعات!" });
    }
});

//@desc get user exam result
//@route POST /api/v1/exam/getUserExamResult
//@access private
const getUserExamResult = asyncHandler(async (req, res) => {
    try {
        const userID = req.user.ID;
        const { userExamId } = req.body;
        let userData = await examModel.getUserData(userID);
        let examRS = await examModel.getUserExamResult(userExamId, userData);
        if (!examRS) {
            res.status(400).json({ message: 'خطا در ثبت اطلاعات!' });
        } else {
            res.status(200).json({ examRS: examRS });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "خطا در ثبت اطلاعات!" });
    }
});

module.exports = {
    getExamsAndUserExamsData,
    getExamQuestions,
    submitExamAnswer,
    getUserExamResult
};