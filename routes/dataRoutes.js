const express = require("express");
const router = express.Router();
const dataCtrl = require("../controllers/dataController");
const validateToken = require("../middleware/validateTokenHandler");

router.use(validateToken);

router.get("/cities", dataCtrl.getCities);
router.get("/countries", dataCtrl.getCountries);
router.get("/getDashboardData", dataCtrl.getDashboardData);
router.post("/submitUserEventsCalendar", dataCtrl.submitUserEventsCalendar);
router.get("/getUserEventsCalendar", dataCtrl.getUserEventsCalendar);
router.get("/getCoursesData", dataCtrl.getCoursesData);
router.post("/coursePreSignup", dataCtrl.coursePreSignup);
router.post("/courseCancelPreSignup", dataCtrl.courseCancelPreSignup);
//-----------------------------------------------------------------------------------
router.post("/getJcenterChildCenters", dataCtrl.getJcenterChildCenters);
router.post("/getAllJcentersData", dataCtrl.getAllJcentersData); 
router.post("/submitJcenter", dataCtrl.submitJcenter);
router.post("/deleteJcenter", dataCtrl.deleteJcenter); 
router.post("/changeJcenterStatus", dataCtrl.changeJcenterStatus);
router.post("/resetJcenterPassword", dataCtrl.resetJcenterPassword);
router.post("/getJCenterOperatorList", dataCtrl.getJCenterOperatorList); 
router.post("/submitOperator", dataCtrl.submitOperator); 
router.post("/deleteOperator", dataCtrl.deleteOperator); 
router.post("/changeJOperatorStatus", dataCtrl.changeJOperatorStatus);
//-----------------------------------------------------------------------------------
router.post("/getAllJbuildingsData", dataCtrl.getAllJbuildingsData);
router.post("/submitJbuilding", dataCtrl.submitJbuilding); 
router.post("/changeJbuildingStatus", dataCtrl.changeJbuildingStatus);
router.get("/getJRoomsOptionsData", dataCtrl.getJRoomsOptionsData);
router.post("/submitBuildingRoomRel", dataCtrl.submitBuildingRoomRel);
router.post("/getBuildingRoomRelationData", dataCtrl.getBuildingRoomRelationData);
router.post("/updateBuildingRoomRelStatus", dataCtrl.updateBuildingRoomRelStatus);
router.post("/getAllJbuildingsRoomsData", dataCtrl.getAllJbuildingsRoomsData);
router.post("/getJbuildingsRoomsData", dataCtrl.getJbuildingsRoomsData);
router.post("/getClassHoldTimeData", dataCtrl.getClassHoldTimeData);
router.post("/submitHoldTime", dataCtrl.submitHoldTime);

router.post("/updateHoldTimeStatus", dataCtrl.updateHoldTimeStatus);
router.post("/getClassHoldTime", dataCtrl.getClassHoldTime);
router.post("/getClassSession", dataCtrl.getClassSession);
router.post("/submitSession", dataCtrl.submitSession);
router.post("/deleteSession", dataCtrl.deleteSession);
router.post("/deleteAllSession", dataCtrl.deleteAllSession);
router.post("/autoSessionGenerator", dataCtrl.autoSessionGenerator);
router.post("/getClassSessionUserList", dataCtrl.getClassSessionUserList);
router.post("/getClassUserList", dataCtrl.getClassUserList);
router.post("/getClassCancelationUserList", dataCtrl.getClassCancelationUserList);
router.post("/changeUserSessionStatus", dataCtrl.changeUserSessionStatus);
router.post("/submitUserListInfo", dataCtrl.submitUserListInfo);
router.post("/acceptCancelRequest", dataCtrl.acceptCancelRequest);
router.post("/getPayBackData", dataCtrl.getPayBackData);
router.post("/acceptPayBack", dataCtrl.acceptPayBack);
// router.post("/deleteJcenter", dataCtrl.deleteJcenter); 
//-----------------------------------------------------------------------------------
router.get("/getAllExamcentersData", dataCtrl.getAllExamcentersData);
router.post("/submitExamcenter", dataCtrl.submitExamcenter);
router.post("/deleteExamcenter", dataCtrl.deleteExamcenter);
router.post("/changeJexamcenterStatus", dataCtrl.changeJexamcenterStatus);
//-----------------------------------------------------------------------------------
router.post("/submitJdepartment", dataCtrl.submitJdepartment);
router.post("/deleteJdepartment", dataCtrl.deleteJdepartment);
router.post("/changeJdepartmentStatus", dataCtrl.changeJdepartmentStatus);
router.post("/getJCenterDepartment", dataCtrl.getJCenterDepartment);
router.post("/getJCenterWithSubCenters", dataCtrl.getJCenterWithSubCenters);
router.post("/getAllJdepartmentsData", dataCtrl.getAllJdepartmentsData);
//-----------------------------------------------------------------------------------
router.get("/getRequestsFilters", dataCtrl.getRequestsFilters);
router.post("/getRequestsData", dataCtrl.getRequestsData); 
router.post("/submitJRequestForm", dataCtrl.submitJRequestForm);
router.post("/deleteJrequest", dataCtrl.deleteJrequest); 


//------------------------Dashboard---------------------------------------------
router.get("/loadLastLogin", dataCtrl.loadLastLogin);
router.get("/loadDashboardData", dataCtrl.loadDashboardData);
router.get("/loadMemberWeekLyPlan", dataCtrl.loadMemberWeekLyPlan);





// router.route("/calculateOrder").post(orderCtrl.createContact);
// router.route("/:id").delete(orderCtrl.deleteContact);

module.exports = router; 