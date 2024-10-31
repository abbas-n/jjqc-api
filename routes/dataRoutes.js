const express = require("express");
const router = express.Router();
const dataCtrl = require("../controllers/dataController");
const validateToken = require("../middleware/validateTokenHandler");

router.use(validateToken);

router.get("/cities", dataCtrl.getCities);
router.get("/countries", dataCtrl.getCountries);
router.get("/resumeSeniorityLevels", dataCtrl.getSeniorityLevels);
router.get("/resumeGrades", dataCtrl.getGrades);
router.get("/resumeMajors", dataCtrl.getMajors);
router.get("/resumeActiveMajors", dataCtrl.getActiveMajors);
router.get("/resumeUniversities", dataCtrl.getUniversities);
router.get("/resumeJobs", dataCtrl.getJobs);
router.get("/resumeActiveJobs", dataCtrl.getActiveJobs);
router.get("/resumeIndustries", dataCtrl.getIndustires);
router.get("/resumeLangueges", dataCtrl.getLangueges);
router.get("/resumeSoftwareSkills", dataCtrl.getSoftwareSkills);
router.post("/submitResume", dataCtrl.submitResumeData);
router.post("/updateResume", dataCtrl.updateResume);
router.get("/getUserResumeData", dataCtrl.getUserResumeData);
router.get("/getDashboardData", dataCtrl.getDashboardData);
router.post("/submitUserEventsCalendar", dataCtrl.submitUserEventsCalendar);
router.get("/getUserEventsCalendar", dataCtrl.getUserEventsCalendar);
router.get("/getCoursesData", dataCtrl.getCoursesData);
router.post("/coursePreSignup", dataCtrl.coursePreSignup);
router.post("/courseCancelPreSignup", dataCtrl.courseCancelPreSignup);
//-----------------------------------------------------------------------------------
router.get("/getAllJcentersData", dataCtrl.getAllJcentersData);




// router.route("/calculateOrder").post(orderCtrl.createContact);
// router.route("/:id").delete(orderCtrl.deleteContact);

module.exports = router; 