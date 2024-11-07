const express = require("express");
const router = express.Router();
const educationCtrl = require("../controllers/educationController");
const validateToken = require("../middleware/validateTokenHandler");
router.use(validateToken);

//-------------------------Education Group---------------------------------
router.get("/getAllEducationCenter", educationCtrl.getAllEducationGroup);
router.get("/getMainGroup", educationCtrl.getMainGroup);
router.post("/uploadDocument", educationCtrl.uploadDocument);
router.post("/submitEducationGroup", educationCtrl.addEducationInfoToDb);
router.post("/deleteEducationGroup", educationCtrl.deleteEducationGroup);

//-------------------------Lesson------------------------------------
router.get("/getAllLesson", educationCtrl.getAllLesson);
router.get("/getLessonType", educationCtrl.getLessonType);
router.post("/submitLesson", educationCtrl.addLessonInfoToDb);
router.post("/deleteLesson", educationCtrl.deleteLesson);

//-------------------------Job------------------------------------
router.get("/getAllJob", educationCtrl.getAllJob);
router.get("/getJobType", educationCtrl.getJobType);
router.post("/submitJob", educationCtrl.addJobInfoToDb);
router.post("/deleteJob", educationCtrl.deleteJob);

//-------------------------Job Lesson Relation------------------------------------
router.get("/getAllJobLesson", educationCtrl.getAllJobLesson);
router.post("/submitJobLesson", educationCtrl.addJobLessonRelationToDb);
router.post("/deleteJobLesson", educationCtrl.deleteJobLessonRelation);



module.exports = router; 