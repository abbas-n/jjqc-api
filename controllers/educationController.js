const asyncHandler = require("express-async-handler");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const moodleOBJ = require("../utils/moodleApi");
const educationModel = require("../models/educationModel");
const jdate = require('jdate').JDate();

const base64Obj = require("convert-base64-to-image")

//@desc courseCancelPreSignup
//@route get /api/v1/education/getAllEducationGroup
//@access private
const getAllEducationGroup = asyncHandler(async (req, res) => {
  try {
    let allEducationGroup = await educationModel.loadEducationGroup(0);
    res.status(200).json({ allEducationGroup });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

const getMainGroup = asyncHandler(async (req, res) => {
  try {
    let mainGroup = await educationModel.getMainGroup();
    res.status(200).json({ mainGroup });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/deleteAlarmItem
//@access private
const uploadDocument = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let documentInBase64 = req.body.documentFile;
    let stringLength = documentInBase64.length - 'data:image/png;base64,'.length;
    let sizeInBytes = 4 * Math.ceil((stringLength / 3)) * 0.5624896334383812;
    let docSize = sizeInBytes / 1000;
    let docType = documentInBase64.split(';')[0].split('/')[1];
    let fileTarget = 'User_Upload/' + userID + '_' + makeid(10) + '.' + docType;
    const pathToSaveImage = '/home/jjqc_ir/jjqc-panel/public/' + fileTarget;
    base64Obj.converBase64ToImage(documentInBase64, pathToSaveImage)
    res.status(200).json({ fileTarget });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/deleteAlarmItem
//@access private
const addEducationInfoToDb = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let eduData = req.body.educationGroupData;

    let eduRS = educationModel.addEducationGroupToDb(req.body.educationGroupData, userID);
    if (eduData.moodle_category_id != null) {
      let moodleRS = await moodleOBJ.manageEduGroup_category(eduData.moodle_category_id, eduData.title, eduData.ID, eduData.description, 1);
    } else {
      let moodleRS = await moodleOBJ.manageEduGroup_category(0, eduData.title, (eduData.ID > 0 ? eduData.ID : eduRS.insertId), eduData.description, 0);
    }

    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'خطا در انجام عملیات' });
  }
});

//@route POST /v1/education/deleteEducationGroup
//@access private
const deleteEducationGroup = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    educationModel.deleteEducationGroup(req.body.educationGroupId);
    res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}


//@desc courseCancelPreSignup
//@route get /api/v1/education/allLesson
//@access private
const getAllLesson = asyncHandler(async (req, res) => {
  try {
    let allLesson = await educationModel.loadLesson(0);
    res.status(200).json({ allLesson });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

const getLessonType = asyncHandler(async (req, res) => {
  try {
    let lessonType = await educationModel.getLeesonType();
    res.status(200).json({ lessonType });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/addLessonInfoToDb
//@access private
const addLessonInfoToDb = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    await educationModel.addLessonToDb(req.body.lessonData, userID);
    if (req.body.lessonData.ID) {
      await moodleOBJ.updateSubcategory(req.body.lessonData.ID);
    }
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'خطا در انجام عملیات!' });
  }
});

//@route POST /v1/education/deleteLesson
//@access private
const deleteLesson = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    await educationModel.deleteLesson(req.body.lessonId);
    res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/getLessonEduGroupRelationData
//@access private
const getLessonEduGroupRelationData = asyncHandler(async (req, res) => {
  try {
    const { lessonId } = req.body;
    let relRS = await educationModel.getLessonEduGroupRelationData(lessonId);
    res.status(200).json({ relRS: relRS });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/submitLessonEduGroupRel
//@access private
const submitLessonEduGroupRel = asyncHandler(async (req, res) => {
  try {
    const { lessonId, eduGroupId } = req.body;
    let relRS = await educationModel.submitLessonEduGroupRel(lessonId, eduGroupId);
    if (relRS > 0) {
      let lessonData = await educationModel.loadLesson(lessonId);
      let eduGroupData = await educationModel.loadEducationGroup(eduGroupId);
      if (eduGroupData[0]['moodle_category_id'] > 0) {
        await moodleOBJ.createSubcategory(eduGroupData[0]['moodle_category_id'], lessonData[0]['title'], relRS, lessonData[0]['description']);
      }
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'خطا در ثبت اطلاعات' });
  }
});
//@route POST /v1/education/updateLessonEduGroupRelStatus
//@access private
const updateLessonEduGroupRelStatus = asyncHandler(async (req, res) => {
  try {
    const { lessonEduGroupRelId, lessonEduGroupRelStatus } = req.body;
    await educationModel.updateLessonEduGroupRelStatus(lessonEduGroupRelId, lessonEduGroupRelStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در انجام عملیات' });
  }
});




//@desc courseCancelPreSignup
//@route get /api/v1/education/allJob
//@access private
const getAllJob = asyncHandler(async (req, res) => {
  try {
    let allJob = await educationModel.loadJob(0);
    res.status(200).json({ allJob });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

const getJobType = asyncHandler(async (req, res) => {
  try {
    let JobType = await educationModel.getJobType();
    res.status(200).json({ JobType });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/addJobInfoToDb
//@access private
const addJobInfoToDb = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    educationModel.addJobToDb(req.body.JobData, userID);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/deleteJob
//@access private
const deleteJob = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    educationModel.deleteJob(req.body.JobId);
    res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});


//@desc courseCancelPreSignup
//@route get /api/v1/education/getAllJobLesson
//@access private
const getAllJobLesson = asyncHandler(async (req, res) => {
  try {
    let allJobLesson = await educationModel.loadJobLesson(0);
    res.status(200).json({ allJobLesson });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc courseCancelPreSignup
//@route get /api/v1/education/getAllJobLesson
//@access private
const addJobLessonRelationToDb = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let addRelation = await educationModel.addJobLessonRelationToDb(req.body.jobLessonData, userID);
    res.status(200).json({ addRelation });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/deleteJob
//@access private
const deleteJobLessonRelation = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    educationModel.deleteJobLessonRelation(req.body);
    res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});


//@route Get /v1/education/getAllTeacher
//@access private
const getAllTeacher = asyncHandler(async (req, res) => {
  try {
    let allTeacher = await educationModel.loadTeacher();
    res.status(200).json({ allTeacher });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getAllTeacher
//@access private
const getAllJCenter = asyncHandler(async (req, res) => {
  try {
    let allJCenter = await educationModel.loadJcenter();
    res.status(200).json({ allJCenter });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getAllTeacher
//@access private
const getTeacherDegree = asyncHandler(async (req, res) => {
  try {
    let teacherDegree = await educationModel.loadTeacherDegree();
    res.status(200).json({ teacherDegree });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getTeacherJob
//@access private
const getTeacherJob = asyncHandler(async (req, res) => {
  try {
    let teacherJob = await educationModel.loadTeacherJob();
    res.status(200).json({ teacherJob });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getTeacherDepartment
//@access private
const getTeacherDepartment = asyncHandler(async (req, res) => {
  try {
    let teacherDepartment = await educationModel.loadDepartment();
    res.status(200).json({ teacherDepartment });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getJcenterEducationGroups
//@access private
const getJcenterEducationGroups = asyncHandler(async (req, res) => {
  try {
    const { jcenterId } = req.body;
    let JCEducationGroup = await educationModel.getJcenterEducationGroups(jcenterId);
    res.status(200).json({ JCEducationGroup: JCEducationGroup });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@route Get /v1/education/getEducationGroupLessonData
//@access private
const getEducationGroupLessonData = asyncHandler(async (req, res) => {
  try {
    const { eduGroupId } = req.body;
    let eduGroupLessonRS = await educationModel.getEducationGroupLessonData(eduGroupId);
    res.status(200).json({ eduGroupLessonRS: eduGroupLessonRS });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getLessonTeacherData
//@access private
const getLessonTeacherData = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.body;
    let relRS = await educationModel.getLessonTeacherData(classId);
    res.status(200).json({ relRS: relRS });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@desc courseCancelPreSignup
//@route get /api/v1/education/addTeacherToDb
//@access private
const addTeacherToDb = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let addTeacher = await educationModel.addTeacherInfoToDb(req.body.TeachersData, userID);
    res.status(200).json({ addTeacher });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/deleteJob
//@access private
const deleteTeacher = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    educationModel.deleteTeacher(req.body);
    res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/getLessonEduGroupRelationData
//@access private
const getTeacherLessonRelationData = asyncHandler(async (req, res) => {
  try {
    const { teacherId } = req.body;
    let relRS = await educationModel.getTeacherLessonRelationData(teacherId);
    res.status(200).json({ relRS: relRS });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/submitTeacherLessonRel
//@access private
const submitTeacherLessonRel = asyncHandler(async (req, res) => {
  try {
    const { teacherId, eduGroupId, lessonId } = req.body;
    let relRS = await educationModel.submitTeacherLessonRel(teacherId, eduGroupId, lessonId);
    if (relRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت اطلاعات' });
  }
});


//@route POST /v1/education/submitClassTeacherRel
//@access private
const submitClassTeacherRel = asyncHandler(async (req, res) => {
  try {
    const { teacherId, classId } = req.body;
    let relRS = await educationModel.submitClassTeacherRel(teacherId, classId);
    if (relRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت اطلاعات' });
  }
});


//@route POST /v1/education/updateTeacherLessonRelStatus
//@access private
const updateTeacherLessonRelStatus = asyncHandler(async (req, res) => {
  try {
    const { teacherLessonRelId, teacherLessonRelStatus } = req.body;
    await educationModel.updateTeacherLessonRelStatus(teacherLessonRelId, teacherLessonRelStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/updateClassTeacherRelStatus
//@access private
const updateClassTeacherRelStatus = asyncHandler(async (req, res) => {
  try {
    const { classTeacherRelId, classTeacherRelStatus } = req.body;
    await educationModel.updateClassTeacherRelStatus(classTeacherRelId, classTeacherRelStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/getUserClassesToCheckForRegister
//@access private
const getUserClassesToCheckForRegister = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let userClassesRS=await educationModel.getUserClassesToCheckForRegister(userID);
    res.status(200).json({ userClassesRS: userClassesRS });
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت اطلاعات' });
  }
});


//@route POST /v1/education/getAllClasses
//@access private
const getAllClasses = asyncHandler(async (req, res) => {
  try {
    const { jcenter_id } = req.body;
    let allClasses = await educationModel.loadClasses(jcenter_id);
    res.status(200).json({ allClasses });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getClassesDelivery
//@access private
const getClassesDelivery = asyncHandler(async (req, res) => {
  try {
    let classeDelivery = await educationModel.loadDeliveryType();
    res.status(200).json({ classeDelivery });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getClassesType
//@access private
const getClassesType = asyncHandler(async (req, res) => {
  try {
    let classeType = await educationModel.loadClassType();
    res.status(200).json({ classeType });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc courseCancelPreSignup
//@route get /api/v1/education/addTeacherToDb
//@access private
const addClassInfoToDb = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { ClassesData } = req.body;
    let classRS = await educationModel.addClassInfoToDb(ClassesData, userID);
    let lessonHasRelData = await educationModel.getLessonEduGroupRelShortData(ClassesData.lesson_id, ClassesData.group_id);
    if (lessonHasRelData.length > 0 && ClassesData.delivery_id == 3) {
      if (ClassesData.ID) {
        await moodleOBJ.updateCourse(ClassesData.ID, ClassesData.title, ClassesData.description, ClassesData.status, lessonHasRelData[0]['moodle_subcategory_id'], ClassesData.moodle_course_id);
        // await moodleOBJ.duplicateCourse(relRS, lessonHasRelData[0]['moodle_course_id'], lessonData[0]['title'], eduGroupData[0]['title'], eduGroupData[0]['moodle_category_id']);
      } else {

        await moodleOBJ.createCourse(classRS.insertId, ClassesData.title, ClassesData.description, lessonHasRelData[0]['moodle_subcategory_id']);
      }
    }
    res.status(200).json({ classRS });
  } catch (err) {
    console.error('Error details:', error);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/deleteClass
//@access private
const deleteClass = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    educationModel.deleteClass(req.body);
    res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/education/getEducationGroupForClass
//@access private
const getEducationGroupForClass = asyncHandler(async (req, res) => {
  try {
    const { jCenter } = req.body;
    let educationGroup = await educationModel.loadClassEducationGroup(jCenter);
    res.status(200).json({ educationGroup });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Post /v1/education/getEducationGroupForClass
//@access private
const getEducationDepartmentForClass = asyncHandler(async (req, res) => {
  try {
    const { jCenter } = req.body;
    let classDepartment = await educationModel.loadClassDepartMent(jCenter);
    res.status(200).json({ classDepartment });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Post /v1/education/getEducationGroupForClass
//@access private
const getClassLesson = asyncHandler(async (req, res) => {
  try {
    const { groupId } = req.body;
    let classDepartment = await educationModel.getClassLesson(groupId);
    res.status(200).json({ classDepartment });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getCertificateInfo
//@access private
const getCertificateInfo = asyncHandler(async (req, res) => {
  try {
    let allCertificate = await educationModel.loadCertificateInfo();
    res.status(200).json({ allCertificate });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Get /v1/education/getCertificateStructure
//@access private
const getCertificateStructure = asyncHandler(async (req, res) => {
  try {
    let certificateStructure = await educationModel.loadCertificateStructure();
    res.status(200).json({ certificateStructure });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@route Get /v1/education/getmemberInfo
//@access private
const getmemberInfo = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let memberInfo = await educationModel.getmemberInfo(userID);
    res.status(200).json({ memberInfo });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route get /api/v1/education/addTeacherToDb
//@access private
const submitMember = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let addTeacher = await educationModel.submitMemberInfoToDb(req.body.membersData, userID);
    res.status(200).json({ 'message': 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@route Post /v1/education/getEducationGroupForClass
//@access private
const getClassListForMembers = asyncHandler(async (req, res) => {
  try {
    const { listMood } = req.body;
    const userID = req.user.ID;
    let membersClass = await educationModel.loadClassListForMember(listMood, userID);
    res.status(200).json({ membersClass });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@route Post /v1/education/addClassToUserCart
//@access private
const addClassToUserCart = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { classItem } = req.body;
    let addCartRS = await educationModel.addClassToUserCart(userID, classItem.ID, classItem.expense);
    if (addCartRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد', addCartRS: addCartRS });
    } else {
      res.status(500).json({ message: "خطا در ثبت اطلاعات" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در ثبت اطلاعات" });
  }
});

//@route GET /v1/education/loadUserCart
//@access private
const loadUserCart = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let cart_item = await educationModel.loadUserCart(userID);
    res.status(200).json({ cart_item });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route Post /v1/education/removeFromCart
//@access private
const removeFromCart = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let removeFromCart = await educationModel.removeFromCart(userID, req.body.classId);
    res.status(200).json({ removeFromCart });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@route Post /v1/education/applyDiscountCode
//@access private
const applyDiscountCode = asyncHandler(async (req, res) => {
  try {
    console.log(req.body);
    const { ID } = req.body;
    const userID = req.user.ID;
    let removeFromCart = await educationModel.applyDiscountCode(userID, req.body);
    res.status(200).json({ removeFromCart });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@route Post /v1/education/successPayment
//@access private
const successPayment = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let removeFromCart = await educationModel.applyDiscountCode(userID, req.body);
    res.status(200).json({ removeFromCart });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در ثبت اطلاعات" });
  }
});

//@route Post /v1/education/getEducationGroupForClass
//@access private
const sendMoodleReq = asyncHandler(async (req, res) => {
  try {
    let statement = `SELECT * FROM user__info WHERE ID=6`;
    let query = mysql.format(statement, []);
    let userData = await educationModel.dbQuery_promise(query);
    // let membersClass =  await moodleOBJ.unenrollUserInCourse(userData[0]['moodle_user_id'],15);
    let membersClass = await moodleOBJ.enrollUserInCourse(userData[0]['moodle_user_id'], 15);
    // await moodleOBJ.createUser(userData[0]['ID'], userData[0]['mobile'], userData[0]['fname'], userData[0]['lname'], userData[0]['mobile'] + '@jjqc.ir');
    res.status(200).json({ membersClass });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


module.exports = {
  getAllEducationGroup,
  getMainGroup,
  uploadDocument,
  addEducationInfoToDb,
  deleteEducationGroup,
  getAllLesson,
  getLessonType,
  addLessonInfoToDb,
  deleteLesson,
  getLessonEduGroupRelationData,
  submitLessonEduGroupRel,
  updateLessonEduGroupRelStatus,
  getAllJob,
  getJobType,
  addJobInfoToDb,
  deleteJob,
  getAllJobLesson,
  addJobLessonRelationToDb,
  deleteJobLessonRelation,
  getAllTeacher,
  addTeacherToDb,
  getTeacherDegree,
  getTeacherJob,
  deleteTeacher,
  getTeacherLessonRelationData,
  getTeacherDepartment,
  getJcenterEducationGroups,
  getEducationGroupLessonData,
  submitTeacherLessonRel,
  updateTeacherLessonRelStatus,
  getAllJCenter,
  getUserClassesToCheckForRegister,
  getAllClasses,
  getClassesDelivery,
  getClassesType,
  addClassInfoToDb,
  deleteClass,
  getEducationGroupForClass,
  getCertificateInfo,
  getCertificateStructure,
  getEducationDepartmentForClass,
  getClassLesson,
  getmemberInfo,
  submitMember,
  getClassListForMembers,
  sendMoodleReq,
  addClassToUserCart,
  loadUserCart,
  removeFromCart,
  applyDiscountCode,
  successPayment,
  getLessonTeacherData,
  submitClassTeacherRel,
  updateClassTeacherRelStatus
};