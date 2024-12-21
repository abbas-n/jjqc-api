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
router.post("/submitJcenter", dataCtrl.submitJcenter);
router.post("/deleteJcenter", dataCtrl.deleteJcenter); 
//-----------------------------------------------------------------------------------
router.get("/getAllExamcentersData", dataCtrl.getAllExamcentersData);
router.post("/submitExamcenter", dataCtrl.submitExamcenter);
router.post("/deleteExamcenter", dataCtrl.deleteExamcenter);
//-----------------------------------------------------------------------------------
router.post("/submitJdepartment", dataCtrl.submitJdepartment);
router.post("/deleteJdepartment", dataCtrl.deleteJdepartment);
router.post("/getJCenterDepartment", dataCtrl.getJCenterDepartment);
router.get("/getAllJdepartmentsData", dataCtrl.getAllJdepartmentsData);
//-----------------------------------------------------------------------------------
router.get("/getRequestsFilters", dataCtrl.getRequestsFilters);
router.post("/getRequestsData", dataCtrl.getRequestsData); 
router.post("/submitJRequestForm", dataCtrl.submitJRequestForm);
router.post("/deleteJrequest", dataCtrl.deleteJrequest); 


//------------------------Dashboard---------------------------------------------
router.get("/loadLastLogin", dataCtrl.loadLastLogin);
router.get("/loadDashboardData", dataCtrl.loadDashboardData);




// router.route("/calculateOrder").post(orderCtrl.createContact);
// router.route("/:id").delete(orderCtrl.deleteContact);

module.exports = router; 