const asyncHandler = require("express-async-handler");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const educationModel = require("../models/educationModel");
const jdate = require('jdate').JDate();

const base64Obj = require("convert-base64-to-image")

//@desc courseCancelPreSignup
//@route get /api/v1/education/getAllEducationCenter
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

  //@route POST /v1/p2pmarket/deleteAlarmItem
//@access private
const uploadDocument = asyncHandler(async (req, res) => { 
  try {
    const userID = req.user.ID;
    let documentInBase64 = req.body.documentFile;
    let stringLength = documentInBase64.length - 'data:image/png;base64,'.length;
    let sizeInBytes = 4 * Math.ceil((stringLength / 3))*0.5624896334383812;
    let docSize=sizeInBytes/1000;
    let docType = documentInBase64.split(';')[0].split('/')[1];
    let fileTarget = 'User_Upload/'+userID+'_'+makeid(10)+'.'+docType;
    const pathToSaveImage = '/home/jjqc_ir/jjqc-panel/public/'+fileTarget;
    base64Obj.converBase64ToImage(documentInBase64, pathToSaveImage)
    res.status(200).json({ fileTarget });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
}); 

//@route POST /v1/p2pmarket/deleteAlarmItem
//@access private
const addEducationInfoToDb = asyncHandler(async (req, res) => { 
  try {
    const userID = req.user.ID;
    educationModel.addEducationGroupToDb(req.body.educationGroupData , userID);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
}); 

//@route POST /v1/p2pmarket/deleteEducationGroup
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

//@route POST /v1/p2pmarket/addLessonInfoToDb
//@access private
const addLessonInfoToDb = asyncHandler(async (req, res) => { 
  try {
    const userID = req.user.ID;
    educationModel.addLessonToDb(req.body.lessonData , userID);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
}); 

//@route POST /v1/p2pmarket/deleteLesson
//@access private
const deleteLesson = asyncHandler(async (req, res) => { 
  try {
    const userID = req.user.ID;
    educationModel.deleteLesson(req.body.lessonId);
    res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
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

//@route POST /v1/p2pmarket/addJobInfoToDb
//@access private
const addJobInfoToDb = asyncHandler(async (req, res) => { 
  try {
    const userID = req.user.ID;
    educationModel.addJobToDb(req.body.JobData , userID);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'Error in fetching data!' });
  }
}); 

//@route POST /v1/p2pmarket/deleteJob
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
    let addRelation = await educationModel.addJobLessonRelation();
    res.status(200).json({ addRelation });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/p2pmarket/deleteJob
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
    getAllJob,
    getJobType,
    addJobInfoToDb,
    deleteJob,
    getAllJobLesson,
    addJobLessonRelationToDb,
    deleteJobLessonRelation
};