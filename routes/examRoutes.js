const express = require("express");
const router = express.Router();
const examCtrl = require("../controllers/examController");
const validateToken = require("../middleware/validateTokenHandler");

router.use(validateToken);

router.get("/getExamsAndUserExamsData", examCtrl.getExamsAndUserExamsData);
router.post("/getExamQuestions", examCtrl.getExamQuestions);
router.post("/submitExamAnswer", examCtrl.submitExamAnswer);
router.post("/getUserExamResult", examCtrl.getUserExamResult);

module.exports = router; 