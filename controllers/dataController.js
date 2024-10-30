const asyncHandler = require("express-async-handler");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const PModel = require("../models/publicModel");
const jdate = require('jdate').JDate();



//@desc Get all cities
//@route GET /api/v1/order/getCities
//@access private
const getCities = asyncHandler(async (req, res) => {
  let cities = await PModel.getCities();
  res.status(200).json({ data: cities, message: "" });
});




//@desc Check relation status between origin and destination city from KBK API 
//@route POST /api/v1/order/checkOriginDestRelation
//@access private
const checkOriginDestRelation = asyncHandler(async (req, res) => {
  const userID = req.user.ID;
  const { originCity, destCity } = req.body;
  let citiesRelRS = await tools.checkSitiesRelation(originCity, destCity);
  if (citiesRelRS.status === 'ok') {
    res.status(200).json({ message: 'شهرهای مبدا و مقصد دارای سرویس ارسال هستند' });
  } else {
    await PModel.makeCityInactiveForService(destCity);
    res.status(400).json({ message: 'شهر مقصد انتخاب شده فاقد سرویس فعال هستند' });
  }
});

//@desc get Countries data  
//@route GET /api/v1/data/getCountries
//@access private
const getCountries = asyncHandler(async (req, res) => {
  try {
    let countriesRS = await PModel.getCountries();
    if (countriesRS.length > 0) {
      res.status(200).json({ countriesRS });
    } else {
      res.status(400).json({ message: 'خطا در دریافت اطلاعات کشورها' });
    }
  } catch (err) {
  }
});


//@desc get seniority levels 
//@route GET /api/v1/data/SeniorityLevels
//@access private
const getSeniorityLevels = asyncHandler(async (req, res) => {
  let SLevelsRS = await PModel.getResumeSeniorityLevels();
  if (SLevelsRS.length > 0) {
    res.status(200).json({ SLevelsRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت مقاطع تحصیلی' });
  }
});

//@desc get education grades  
//@route GET /api/v1/data/resumeGrades
//@access private
const getGrades = asyncHandler(async (req, res) => {
  let gradesRS = await PModel.getResumeGrades();
  if (gradesRS.length > 0) {
    res.status(200).json({ gradesRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت مقاطع تحصیلی' });
  }
});

//@desc get education majors  
//@route GET /api/v1/data/resumeMajors
//@access private
const getMajors = asyncHandler(async (req, res) => {
  let majorsRS = await PModel.getResumeMajors();
  if (majorsRS.length > 0) {
    res.status(200).json({ majorsRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت رشته تحصیلی' });
  }
});

//@desc get education majors which are active in system
//@route GET /api/v1/data/resumeActiveMajors
//@access private
const getActiveMajors = asyncHandler(async (req, res) => {
  let majorsRS = await PModel.getResumeActiveMajors();
  if (majorsRS.length > 0) {
    res.status(200).json({ majorsRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت رشته تحصیلی' });
  }
});

//@desc get universities 
//@route GET /api/v1/data/resumeUniversities
//@access private
const getUniversities = asyncHandler(async (req, res) => {
  let universitiesRS = await PModel.getResumeUniversities();
  if (universitiesRS.length > 0) {
    res.status(200).json({ universitiesRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت دانشگاه ها' });
  }
});


//@desc get jobs 
//@route GET /api/v1/data/resumeJobs
//@access private
const getJobs = asyncHandler(async (req, res) => {
  let jobsRS = await PModel.getResumeJobs();
  if (jobsRS.length > 0) {
    res.status(200).json({ jobsRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت شغل ها' });
  }
});

//@desc get active jobs 
//@route GET /api/v1/data/resumeActiveJobs
//@access private
const getActiveJobs = asyncHandler(async (req, res) => {
  let jobsRS = await PModel.getResumeActiveJobs();
  if (jobsRS.length > 0) {
    res.status(200).json({ jobsRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت شغل ها' });
  }
});

//@desc get company industry 
//@route GET /api/v1/data/resumeJobs
//@access private
const getIndustires = asyncHandler(async (req, res) => {
  let CINDRS = await PModel.getResumeIndustries();
  if (CINDRS.length > 0) {
    res.status(200).json({ CINDRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت زمینه شرکت ها' });
  }
});

//@desc get languages  
//@route GET /api/v1/data/resumeMajors
//@access private
const getLangueges = asyncHandler(async (req, res) => {
  let languagesRS = await PModel.getResumeLanguges();
  if (languagesRS.length > 0) {
    res.status(200).json({ languagesRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت زبان ها' });
  }
});

//@desc get software skills  
//@route GET /api/v1/data/resumeSoftwareSkills
//@access private
const getSoftwareSkills = asyncHandler(async (req, res) => {
  let SSMainGroupRS = await PModel.getResumeSoftwareSkills(0);
  let softwareSkillsRS = await PModel.getResumeSoftwareSkills(1);
  if (SSMainGroupRS.length > 0) {
    res.status(200).json({ SSMainGroupRS, softwareSkillsRS });
  } else {
    res.status(400).json({ message: 'خطا در دریافت مهارت های نرم افزاری' });
  }
});

//@desc save user resume data
//@route POST /api/v1/data/submitResume
//@access private
const submitResumeData = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let resumeData = req.body.resumeData;
    const sqlInsert = `INSERT INTO resume__user_data(user_id,fname,lname,gender,marriage,Bday,Bmonth,
      Byear,military_id,livingCity_id,livingCity,preferJobs,educationData,jobsData,langData,softwareSkillsData) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const insert_query = mysql.format(sqlInsert, [userID, resumeData['fname'], resumeData['lname'], resumeData['gender'], resumeData['marriage'], resumeData['Bday'],
      resumeData['Bmonth'], resumeData['Byear'], resumeData['military'], resumeData['livingCity']['id'], JSON.stringify(resumeData['livingCity']), JSON.stringify(resumeData['preferJobs']),
      JSON.stringify(resumeData['educationData']), JSON.stringify(resumeData['jobsData']), JSON.stringify(resumeData['langData']), JSON.stringify(resumeData['softwareSkillsData'])]);
    await PModel.dbQuery_promise(insert_query);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: "خطا در عملیات" });
  }
});

//@desc update user resume data
//@route POST /api/v1/data/updateResume
//@access private
const updateResume = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    // const userID = 1;
    let resumeData = req.body.resumeData;
    const sqlupdate = `UPDATE resume__user_data SET fname=?,lname=?,gender=?,marriage=?,Bday=?,Bmonth=?,
      Byear=?,military_id=?,livingCity_id=?,livingCity=?,preferJobs=?,educationData=?,jobsData=?,langData=?,softwareSkillsData=? 
      WHERE user_id=?`;
    const update_query = mysql.format(sqlupdate, [resumeData['fname'], resumeData['lname'], resumeData['gender'], resumeData['marriage'], resumeData['Bday'],
    resumeData['Bmonth'], resumeData['Byear'], resumeData['military'], resumeData['livingCity']['id'], JSON.stringify(resumeData['livingCity']), JSON.stringify(resumeData['preferJobs']),
    JSON.stringify(resumeData['educationData']), JSON.stringify(resumeData['jobsData']), JSON.stringify(resumeData['langData']), JSON.stringify(resumeData['softwareSkillsData']), userID]);
    await PModel.dbQuery_promise(update_query);
    res.status(200).json({ message: 'بروزرسانی با موفقیت انجام شد' });
  } catch (err) {
    res.status(500).json({ message: "خطا در بروزرسانی" });
  }
});

//@desc get user resume data
//@route GET /api/v1/data/getUserResumeData
//@access private
const getUserResumeData = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const userResume = await PModel.getUserResumeData(userID);
    res.status(200).json(userResume);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در بروزرسانی" });
  }
});



//@desc get User dashboard data
//@route POST /api/v1/data/getDashboardData
//@access private
const getDashboardData = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let dashBoardData = await PModel.getDashboardData(userID);
    res.status(200).json({ data: dashBoardData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در ثبت اطلاعات" });
  }
});


//@desc submit user events on calendar
//@route POST /api/v1/data/submitUserEventsCalendar
//@access private
const submitUserEventsCalendar = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { events } = req.body;
    await PModel.submitUserEventsCalendar(userID, events);
    res.status(200).json({ message: "اطلاعات با موفقیت ثبت شد" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در ثبت اطلاعات" });
  }
});

//@desc get user events on calendar
//@route POST /api/v1/data/getUserEventsCalendar
//@access private
const getUserEventsCalendar = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let eventsRS = await PModel.getUserEventsCalendar(userID);
    res.status(200).json({ eventsRS });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get courses data
//@route GET /api/v1/data/getCoursesData
//@access private
const getCoursesData = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let coursesRS = await PModel.getCoursesData();
    let userCoursesPreSignup = await PModel.getUserCoursesSignup(userID);
    res.status(200).json({ coursesRS, userCoursesPreSignup });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc coursePreSignup
//@route POST /api/v1/data/coursePreSignup
//@access private
const coursePreSignup = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { courseId } = req.body;

    await PModel.coursePreSignup(userID, courseId);
    let coursesRS = await PModel.getCoursesData();
    let userCoursesPreSignup = await PModel.getUserCoursesSignup(userID);
    res.status(200).json({ coursesRS, userCoursesPreSignup });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc courseCancelPreSignup
//@route POST /api/v1/data/courseCancelPreSignup
//@access private
const courseCancelPreSignup = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { courseId } = req.body;

    await PModel.courseCancelPreSignup(userID, courseId);
    let coursesRS = await PModel.getCoursesData();
    let userCoursesPreSignup = await PModel.getUserCoursesSignup(userID);
    res.status(200).json({ coursesRS, userCoursesPreSignup });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

module.exports = {
  getCities,
  getCountries,
  getSeniorityLevels,
  getGrades,
  getMajors,
  getActiveMajors,
  getUniversities,
  getJobs,
  getActiveJobs,
  getIndustires,
  getLangueges,
  getSoftwareSkills,
  submitResumeData,
  updateResume,
  getUserResumeData,
  getDashboardData,
  submitUserEventsCalendar,
  getUserEventsCalendar,
  getCoursesData,
  coursePreSignup,
  courseCancelPreSignup
};