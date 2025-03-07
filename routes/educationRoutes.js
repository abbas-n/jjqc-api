const express = require("express");
const router = express.Router();
const educationCtrl = require("../controllers/educationController");
const validateToken = require("../middleware/validateTokenHandler");
router.use(validateToken);

//-------------------------Education Group---------------------------------
router.get("/getAllEducationGroup", educationCtrl.getAllEducationGroup);
router.get("/getMainGroup", educationCtrl.getMainGroup);
router.post("/uploadDocument", educationCtrl.uploadDocument);
router.post("/submitEducationGroup", educationCtrl.submitEducationGroup);
router.post("/deleteEducationGroup", educationCtrl.deleteEducationGroup);
router.post("/changeEduGroupStatus", educationCtrl.changeEduGroupStatus);

//-------------------------Lesson------------------------------------
router.get("/getAllLesson", educationCtrl.getAllLesson);
router.get("/getLessonType", educationCtrl.getLessonType);
router.post("/submitLesson", educationCtrl.addLessonInfoToDb);
router.post("/deleteLesson", educationCtrl.deleteLesson);
router.post("/changeLessonStatus", educationCtrl.changeLessonStatus);
router.post("/getLessonEduGroupRelationData", educationCtrl.getLessonEduGroupRelationData);
router.post("/submitLessonEduGroupRel", educationCtrl.submitLessonEduGroupRel);
router.post("/updateLessonEduGroupRelStatus", educationCtrl.updateLessonEduGroupRelStatus);

//-------------------------Job------------------------------------
router.get("/getAllJob", educationCtrl.getAllJob);
router.get("/getWithExamJob", educationCtrl.getWithExamJob);
router.get("/getWithExamLesson", educationCtrl.getWithExamLesson);
router.get("/getAllExam", educationCtrl.getAllExam);
router.get("/getJobType", educationCtrl.getJobType);
router.post("/submitJob", educationCtrl.addJobInfoToDb);
router.post("/deleteJob", educationCtrl.deleteJob);
router.post("/loadJobLesson", educationCtrl.loadJobLesson);
router.post("/submitJobExamRelation", educationCtrl.submitJobExamRelation);
router.get("/loadExamPlanForCenter", educationCtrl.loadExamPlanForCenter);
router.post("/submitExamPlan", educationCtrl.submitExamPlan);

//-------------------------Job Lesson Relation------------------------------------
router.get("/getAllJobLesson", educationCtrl.getAllJobLesson);
router.post("/submitJobLesson", educationCtrl.addJobLessonRelationToDb);
router.post("/deleteJobLesson", educationCtrl.deleteJobLessonRelation);


//-------------------------Teachers------------------------------------
router.post("/getAllTeacher", educationCtrl.getAllTeacher);
router.post("/submitTeachers", educationCtrl.addTeacherToDb);
router.get("/getAllTeacherDegree", educationCtrl.getTeacherDegree);
router.get("/getAllTeacherJob", educationCtrl.getTeacherJob);
router.get("/getAllTeacherDepartment", educationCtrl.getTeacherDepartment);
router.get("/getAllJCenter", educationCtrl.getAllJCenter);
router.post("/deleteTeacher", educationCtrl.deleteTeacher);
router.post("/getJcenterEducationGroups", educationCtrl.getJcenterEducationGroups);
router.post("/getEducationGroupLessonData", educationCtrl.getEducationGroupLessonData);
router.post("/getTeacherLessonRelationData", educationCtrl.getTeacherLessonRelationData);
router.get("/getTeacherLessonRelationData", educationCtrl.getTeacherLesson);
router.post("/submitTeacherLessonRel", educationCtrl.submitTeacherLessonRel);
router.post("/updateTeacherLessonRelStatus", educationCtrl.updateTeacherLessonRelStatus);
router.post("/getLessonTeacher", educationCtrl.getLessonTeacher);
router.post("/getTeacherClass", educationCtrl.getTeacherClass);
router.get("/getTeacherInfo", educationCtrl.getTeacherInfo);
router.get("/getTeacherWeeklySchedule", educationCtrl.getTeacherWeeklySchedule);
router.get("/getTeacherCenter", educationCtrl.getTeacherCenter);
router.post("/addCenterToTeacher", educationCtrl.addCenterToTeacher);
router.post("/serachTeacherByNationalCode", educationCtrl.serachTeacherByNationalCode);
router.post("/submitAddTeacherRequest", educationCtrl.submitAddTeacherRequest);


//-------------------------Cart------------------------------------
router.post("/addClassToCart", educationCtrl.addClassToUserCart);
router.get("/loadUserCart", educationCtrl.loadUserCart);
router.post("/removeFromCart", educationCtrl.removeFromCart);
router.post("/applyDiscountCode", educationCtrl.applyDiscountCode);
router.get("/goForCartPayment", educationCtrl.goForCartPayment);


//-------------------------Classes------------------------------------
router.post("/getAllClasses", educationCtrl.getAllClasses);
router.get("/getAllClassesDelivery", educationCtrl.getClassesDelivery);
router.get("/getAllClassesType", educationCtrl.getClassesType);
router.post("/getClassEducationGroup", educationCtrl.getEducationGroupForClass);
router.post("/getDepartmentForClass", educationCtrl.getEducationDepartmentForClass);
router.post("/getClassLesson", educationCtrl.getClassLesson);
router.post("/submitClasses", educationCtrl.addClassInfoToDb);
router.post("/deleteClasses", educationCtrl.deleteClass);
router.get("/getCertificateInfo", educationCtrl.getCertificateInfo);
router.get("/getCertificateStructure", educationCtrl.getCertificateStructure);
router.get("/getUserClassesToCheckForRegister", educationCtrl.getUserClassesToCheckForRegister);
router.post("/getLessonTeacherData", educationCtrl.getLessonTeacherData);
router.post("/submitClassTeacherRel", educationCtrl.submitClassTeacherRel);
router.post("/updateClassTeacherRelStatus", educationCtrl.updateClassTeacherRelStatus);
router.post("/changeClassStatus", educationCtrl.changeClassStatus);
router.post("/getClassDeliveryType", educationCtrl.getClassDeliveryType);
router.post("/handleEnterMoodle", educationCtrl.handleEnterMoodle);
router.post("/handleEnterOnlineClass", educationCtrl.handleEnterOnlineClass);
router.post("/getMeetingRecordings", educationCtrl.getMeetingRecordings);
router.post("/playRecordedSessionVideo", educationCtrl.playRecordedSessionVideo);
router.get("/loadCenterInfo", educationCtrl.loadCenterInfo);




//-------------------------Member------------------------------------
router.get("/getmemberInfo", educationCtrl.getmemberInfo);
router.post("/submitMember", educationCtrl.submitMember);
router.post("/getClassListForMembers", educationCtrl.getClassListForMembers);
router.post("/submitUserCancelRequest", educationCtrl.submitUserCancelRequest);
router.get("/loadAllDepartment", educationCtrl.loadAllDepartment);

router.get("/sendMoodleReq", educationCtrl.sendMoodleReq);
router.get("/sendAdobeReq", educationCtrl.sendAdobeReq);


module.exports = router; 