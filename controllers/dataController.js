const asyncHandler = require("express-async-handler");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const PModel = require("../models/publicModel");
const educationModel = require("../models/educationModel");
const jdate = require('jdate').JDate();
const moodleOBJ = require("../utils/moodleApi");



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

//@desc get User dashboard data
//@route POST /api/v1/data/getDashboardData
//@access private
const getDashboardData = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let dashBoardData = await PModel.getDashboardData(userID);
    res.status(200).json({ data: dashBoardData });
  } catch (err) {
    // console.log(err);
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
    // console.log(err);
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
    // console.log(err);
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
    // console.log(err);
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

//---------------------------------------------------------------------------
//@desc courseCancelPreSignup
//@route get /api/v1/data/getJcenterChildCenters 
//@access private
const getJcenterChildCenters = asyncHandler(async (req, res) => {
  try {
    const { jmainCenterId, centerMood } = req.body;
    let allJcentersData = await PModel.getAllJcentersData(jmainCenterId, centerMood);
    res.status(200).json({ allJcentersData: allJcentersData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//---------------------------------------------------------------------------


//@desc courseCancelPreSignup
//@route get /api/v1/data/getAllJcentersData
//@access private
const getAllJcentersData = asyncHandler(async (req, res) => {
  try {
    const { jmainCenterId, centerMood } = req.body;
    let allJcentersData = await PModel.getAllJcentersData(jmainCenterId, centerMood);
    res.status(200).json({ allJcentersData: allJcentersData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc submit or update jahad center
//@route POST /api/v1/data/submitJcenter
//@access private
const submitJcenter = asyncHandler(async (req, res) => {
  try {
    const { jcenterData, centerMood } = req.body;
    let submitRS = 0;
    if (centerMood === 'main_center') {
      submitRS = await PModel.submitJmaincenter(jcenterData);
    } else if (centerMood === 'center') {
      submitRS = await PModel.submitJcenter(jcenterData);
    }

    if (submitRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc delete jahad center
//@route POST /api/v1/data/deleteJcenter
//@access private
const deleteJcenter = asyncHandler(async (req, res) => {
  try {
    const { jcenterId } = req.body;
    let deleteRS = await PModel.deleteJcenter(jcenterId);
    if (deleteRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در عملیات' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/changeJcenterStatus
//@access private
const changeJcenterStatus = asyncHandler(async (req, res) => {
  try {
    const { jcenterId, targetStatus } = req.body;
    await PModel.changeJcenterStatus(jcenterId, targetStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات!' });
  }
});

//@route POST /v1/education/resetJcenterPassword
//@access private
const resetJcenterPassword = asyncHandler(async (req, res) => {
  try {
    const { jcenterId } = req.body;
    let rs = await PModel.resetJcenterPassword(jcenterId);
    if (rs === -1) {
      res.status(500).json({ message: 'اطلاعات کاربری واحد یافت نشد!' });
    } else {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات!' });
  }
});

//@desc delete jahad center
//@route POST /api/v1/data/getJCenterOperatorList
//@access private
const getJCenterOperatorList = asyncHandler(async (req, res) => {
  try {
    const { jcenterId } = req.body;
    let operatorList = await PModel.getJCenterOperatorList(jcenterId);
    if (operatorList.length > 0) {
      res.status(200).json({ operatorList });
    } else {
      res.status(400).json({ message: 'خطا در عملیات' });
    }
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad departments Data
//@route get /api/v1/data/getJCenterWithSubCenters
//@access private
const getJCenterWithSubCenters = asyncHandler(async (req, res) => {
  try {
    const { userUJCId } = req.body;
    let JCenterData = await PModel.getJcentersData(userUJCId);
    let JCenterSubCenters = await PModel.getJcenterSubCentersData(userUJCId);
    let mergedArray = [...JCenterData, ...JCenterSubCenters];
    res.status(200).json({ JCenterSubCenters: mergedArray });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//---------------------------------------------------------------------------

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const getAllJbuildingsData = asyncHandler(async (req, res) => {
  try {
    const { jcenterId } = req.body;
    let allJbuildingsData = await PModel.getAllJbuildingsData(jcenterId);
    res.status(200).json({ allJbuildingsData: allJbuildingsData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const getAllJbuildingsRoomsData = asyncHandler(async (req, res) => {
  try {
    const { jcenterId } = req.body;
    let allJbuildingsRoomsData = await PModel.getAllJbuildingsRoomsData(jcenterId);
    res.status(200).json({ allJbuildingsRoomsData: allJbuildingsRoomsData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const getJbuildingsRoomsData = asyncHandler(async (req, res) => {
  try {
    const { jcenterId, buildingId } = req.body;
    let allJbuildingsRoomsData = await PModel.getAllJbuildingsRoomsData(jcenterId, buildingId);
    res.status(200).json({ allJbuildingsRoomsData: allJbuildingsRoomsData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const getClassHoldTimeData = asyncHandler(async (req, res) => {
  try {
    const { classId, mood } = req.body;
    let classHoldTime = await PModel.getClassHoldTimeData(classId, mood);
    res.status(200).json({ classHoldTime: classHoldTime });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const submitHoldTime = asyncHandler(async (req, res) => {
  try {
    const { holdTimeData, classId } = req.body;
    let insertResult = await PModel.submitHoldTime(classId, holdTimeData);
    res.status(200).json({ insertResult: insertResult });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const submitSession = asyncHandler(async (req, res) => {
  try {
    const { sessionTitle, sessionHoldTimeID, sessionDate, classId, sessionId } = req.body;
    let insertResult = await PModel.submitSession(sessionTitle, sessionHoldTimeID, sessionDate, classId, sessionId);
    res.status(200).json({ insertResult: insertResult });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const deleteSession = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.body;
    let deleteResult = await PModel.deleteSession(sessionId);
    res.status(200).json({ deleteResult: deleteResult });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const deleteAllSession = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.body;
    let deleteResult = await PModel.deleteAllSession(classId);
    res.status(200).json({ deleteResult: deleteResult });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const autoSessionGenerator = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.body;
    let sessionResult = await PModel.autoSessionGenerator(classId);
    res.status(200).json({ sessionResult: sessionResult });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get class session users
//@route get /api/v1/data/getClassSessionUserList
//@access private
const getClassSessionUserList = asyncHandler(async (req, res) => {
  try {
    const { classId, sessionId } = req.body;
    let classUserList = await PModel.getClassSessionUserList(classId, sessionId);
    res.status(200).json({ classUserList: classUserList });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get class registered users
//@route get /api/v1/data/getClassUserList
//@access private
const getClassUserList = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.body;
    let classUserList = await PModel.getClassUserList(classId);
    res.status(200).json({ classUserList: classUserList });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getClassUserList
//@access private
const getClassCancelationUserList = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.body;
    let classUserList = await PModel.getClassCancelationUserList(classId);
    res.status(200).json({ classUserList: classUserList });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/changeUserSessionStatus
//@access private
const changeUserSessionStatus = asyncHandler(async (req, res) => {
  try {
    const { userSessionId, targetStatus } = req.body;
    let classUserList = await PModel.changeUserSessionStatus(userSessionId, targetStatus);
    res.status(200).json({ classUserList: classUserList });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/acceptCancelRequest
//@access private
const acceptCancelRequest = asyncHandler(async (req, res) => {
  try {
    const { requestId, jcenterId, classId, userId } = req.body;
    const userID = req.user.ID;
    let classData = await educationModel.getClassData(classId);
    let acceptRequest = await PModel.acceptCancelRequest(requestId, jcenterId, classId, classData[0]['cancellation_penalty'], userID);
    let classDeliveryRS = await educationModel.loadClassDeliveryType(classId);
    classDeliveryRS.map(async row => {
      if (row['delivery_id'] === 3) {
        let userData = await educationModel.getUserDetail(userId);
        await moodleOBJ.unenrollUserInCourse(userData[0]['moodle_user_id'], classData[0]['moodle_course_id']);
      }
    });
    res.status(200).json({ acceptRequest: acceptRequest });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getPayBackData
//@access private
const getPayBackData = asyncHandler(async (req, res) => {
  try {
    const { jcenterId } = req.body;
    let payBackData = await PModel.getPayBackData(jcenterId);
    res.status(200).json({ payBackData: payBackData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc get jahad center buildings
//@route get /api/v1/data/acceptPayBack
//@access private
const acceptPayBack = asyncHandler(async (req, res) => {
  try {
    const { requestId, paymentCode, paymentDoc } = req.body;
    let acceptRequest = await PModel.acceptPayBack(requestId, paymentDoc, paymentCode);
    res.status(200).json({ acceptRequest: acceptRequest });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/submitUserListInfo
//@access private
const submitUserListInfo = asyncHandler(async (req, res) => {
  try {
    const { classUserList } = req.body;
    let classUserListResult = await PModel.submitUserListInfo(classUserList);
    res.status(200).json({ classUserListResult: classUserListResult });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const getClassHoldTime = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.body;
    let holdTime = await PModel.getClassHoldTime(classId);
    res.status(200).json({ holdTime: holdTime });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad center buildings
//@route get /api/v1/data/getClassSession
//@access private
const getClassSession = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.body;
    let classSession = await PModel.getClassSession(classId);
    res.status(200).json({ classSession: classSession });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@desc get jahad center buildings
//@route get /api/v1/data/getAllJbuildingsData
//@access private
const updateHoldTimeStatus = asyncHandler(async (req, res) => {
  try {
    const { needHoldTimeId, holdTimeStatus } = req.body;
    let insertResult = await PModel.updateHoldTimeStatus(needHoldTimeId, holdTimeStatus);
    res.status(200).json({ insertResult: insertResult });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@desc submit or update building
//@route POST /api/v1/data/submitJbuilding
//@access private
const submitJbuilding = asyncHandler(async (req, res) => {
  try {
    const { jbuildingData, jcenterId } = req.body;
    let submitRS = await PModel.submitJbuilding(jbuildingData, jcenterId);
    if (submitRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc change building status
//@route POST /api/v1/data/changeJbuildingStatus
//@access private
const changeJbuildingStatus = asyncHandler(async (req, res) => {
  try {
    const { jbuildingId, targetStatus } = req.body;
    await PModel.changeJbuildingStatus(jbuildingId, targetStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات!' });
  }
});



//@desc submit or update operator
//@route POST /api/v1/data/submitOperator
//@access private
const submitOperator = asyncHandler(async (req, res) => {
  try {
    const { operatorData, jcenterId } = req.body;
    let submitRS = await PModel.submitOperator(operatorData, jcenterId);
    if (submitRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc delete operator
//@route POST /api/v1/data/deleteOperator
//@access private
const deleteOperator = asyncHandler(async (req, res) => {
  try {
    const { operatorId } = req.body;
    let submitRS = await PModel.deleteOperator(operatorId);
    if (submitRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc change Operator status
//@route POST /api/v1/data/changeJOperatorStatus
//@access private
const changeJOperatorStatus = asyncHandler(async (req, res) => {
  try {
    const { jOperatorId, targetStatus } = req.body;
    await PModel.changeJOperatorStatus(jOperatorId, targetStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات!' });
  }
});

//@desc get rooms options
//@route POST /api/v1/data/getJRoomsOptionsData
//@access private
const getJRoomsOptionsData = asyncHandler(async (req, res) => {
  try {
    let roomsOption = await PModel.getJRoomsOptions();
    res.status(200).json({ roomsOption });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@desc submit or update building rooms
//@route POST /api/v1/data/submitBuildingRoomRel
//@access private
const submitBuildingRoomRel = asyncHandler(async (req, res) => {
  try {
    const { buildingId, roomTitle, roomOptions } = req.body;
    let relRS = await PModel.submitBuildingRoomRel(buildingId, roomTitle, roomOptions);
    if (relRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/data/getBuildingRoomRelationData
//@access private
const getBuildingRoomRelationData = asyncHandler(async (req, res) => {
  try {
    const { buildingId } = req.body;
    let relRS = await PModel.getBuildingRoomRelationData(buildingId);
    res.status(200).json({ relRS: relRS });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: 'Error in fetching data!' });
  }
});

//@route POST /v1/data/updateBuildingRoomRelStatus
//@access private
const updateBuildingRoomRelStatus = asyncHandler(async (req, res) => {
  try {
    const { buildingRoomRelRelId, buildingRoomRelStatus } = req.body;
    await PModel.updateBuildingRoomRelStatus(buildingRoomRelRelId, buildingRoomRelStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در انجام عملیات' });
  }
});

//---------------------------------------------------------------------------

//@desc get jahad exam centers Data
//@route get /api/v1/data/getAllExamcentersData
//@access private
const getAllExamcentersData = asyncHandler(async (req, res) => {
  try {
    let allExamcentersData = await PModel.getAllExamcentersData();
    res.status(200).json({ allExamcentersData: allExamcentersData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc submit or update jahad exam centers
//@route POST /api/v1/data/submitExamcenter
//@access private
const submitExamcenter = asyncHandler(async (req, res) => {
  try {
    const { examcenterData } = req.body;
    // console.log(jcenterData);
    let submitRS = await PModel.submitExamcenter(examcenterData);
    if (submitRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc delete jahad exam center
//@route POST /api/v1/data/deleteExamcenter
//@access private
const deleteExamcenter = asyncHandler(async (req, res) => {
  try {
    const { examcenterId } = req.body;
    let deleteRS = await PModel.deleteExamcenter(examcenterId);
    if (deleteRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
    } else {
      res.status(400).json({ message: 'خطا در عملیات' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/changeJexamcenterStatus
//@access private
const changeJexamcenterStatus = asyncHandler(async (req, res) => {
  try {
    const { jexamcenterId, targetStatus } = req.body;
    await PModel.changeJexamcenterStatus(jexamcenterId, targetStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات!' });
  }
});

//---------------------------------------------------------------------------

//@desc get jahad departments Data
//@route post /api/v1/data/getAllJdepartmentsData
//@access private
const getAllJdepartmentsData = asyncHandler(async (req, res) => {
  try {
    const { mood } = req.body;
    let allJdepartmentsData = await PModel.getAllJdepartmentsData(mood);
    res.status(200).json({ allJdepartmentsData: allJdepartmentsData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc get jahad departments Data
//@route get /api/v1/data/getJCenterDepartment
//@access private
const getJCenterDepartment = asyncHandler(async (req, res) => {
  try {
    const { userUJCId } = req.body;
    let JCenterDepartment = await PModel.getJCenterDepartment(userUJCId);
    res.status(200).json({ JCenterDepartment: JCenterDepartment });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc submit or update jahad department
//@route POST /api/v1/data/submitJdepartment
//@access private
const submitJdepartment = asyncHandler(async (req, res) => {
  try {
    const { jdepartmentData } = req.body;
    // console.log(jdepartmentData);
    let submitRS = await PModel.submitJdepartment(jdepartmentData);
    if (submitRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc delete jahad department
//@route POST /api/v1/data/deleteJdepartment
//@access private
const deleteJdepartment = asyncHandler(async (req, res) => {
  try {
    const { jdepartmentId } = req.body;
    let deleteRS = await PModel.deleteJdepartment(jdepartmentId);
    if (deleteRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
    } else {
      res.status(400).json({ message: 'خطا در عملیات' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@route POST /v1/education/changeLessonStatus
//@access private
const changeJdepartmentStatus = asyncHandler(async (req, res) => {
  try {
    const { jdepartmentId, targetStatus } = req.body;
    await PModel.updateJdepartmentStatus(jdepartmentId, targetStatus);
    res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات!' });
  }
});
//---------------------------------------------------------------------------

//@desc get jahad Requests Data
//@route get /api/v1/data/getRequestsFilters
//@access private
const getRequestsFilters = asyncHandler(async (req, res) => {
  try {
    let requestsFilters = await PModel.getRequestsFilters();
    res.status(200).json({ requestsFilters: requestsFilters });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad Requests Data
//@route get /api/v1/data/getRequestsData
//@access private
const getRequestsData = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { requestType } = req.body;
    let userDataRS = await PModel.getUserProfileData(userID);
    let requestsData = await PModel.getRequestsData(requestType, userDataRS);
    res.status(200).json({ requestsData: requestsData, UJCId: userDataRS[0]['jcenter_id'] });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc submit or update jahad department
//@route POST /api/v1/data/submitJdepartment
//@access private
const submitJRequestForm = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { jRequestData, jRequestType } = req.body;
    // console.log(jdepartmentData);
    let userDataRS = await PModel.getUserProfileData(userID);
    let submitRS = 0;
    if (jRequestType === 1) {//department request
      submitRS = await PModel.manageJAddDepartmentRequest(jRequestData, jRequestType, userDataRS);
    } else if (jRequestType === 2) {//education group request
      submitRS = await PModel.manageJEduGroupRequest(jRequestData, jRequestType, userDataRS);
    } else if (jRequestType === 5) {//teacher join request
      submitRS = await PModel.manageJAddTeacherRequest(jRequestData, jRequestType, userDataRS);
    } else if (jRequestType === 6) {//sub center request
      submitRS = await PModel.manageJNewCenterRequest(jRequestData, jRequestType, userDataRS);
    }
    if (submitRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(400).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc delete jahad requests
//@route POST /api/v1/data/deleteJrequest
//@access private
const deleteJrequest = asyncHandler(async (req, res) => {
  try {
    const { jrequestId } = req.body;
    let deleteRS = await PModel.deleteJrequest(jrequestId);
    if (deleteRS > 0) {
      res.status(200).json({ message: 'اطلاعات با موفقیت حذف شد' });
    } else {
      res.status(400).json({ message: 'خطا در عملیات' });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});



//@desc get jahad Requests Data
//@route get /api/v1/data/loadLastLogin
//@access private
const loadLastLogin = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let lastLogin = await PModel.loadLastLogin(userID);
    res.status(200).json({ lastLogin });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


//@desc get jahad Requests Data
//@route get /api/v1/data/loadDashboardData
//@access private
const loadDashboardData = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let dashboardData = await PModel.loadDashboardData(userID);
    res.status(200).json({ dashboardData });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc get jahad Requests Data
//@route get /api/v1/data/loadMemberWeekLyPlan
//@access private
const loadMemberWeekLyPlan = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    let memberWeekPlan = await PModel.loadMemberWeekLyPlan(userID);
    res.status(200).json({ memberWeekPlan });
  } catch (err) {
    // console.log(err);
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});





module.exports = {
  getCities,
  getCountries,
  getDashboardData,
  submitUserEventsCalendar,
  getUserEventsCalendar,
  getCoursesData,
  coursePreSignup,
  courseCancelPreSignup,
  getJcenterChildCenters,
  getAllJcentersData,
  submitJcenter,
  deleteJcenter,
  changeJcenterStatus,
  resetJcenterPassword,
  getJCenterWithSubCenters,
  getAllJbuildingsData,
  getJRoomsOptionsData,
  submitBuildingRoomRel,
  getBuildingRoomRelationData,
  updateBuildingRoomRelStatus,
  submitJbuilding,
  changeJbuildingStatus,
  getAllExamcentersData,
  submitExamcenter,
  deleteExamcenter,
  changeJexamcenterStatus,
  getAllJdepartmentsData,
  getJCenterDepartment,
  submitJdepartment,
  deleteJdepartment,
  changeJdepartmentStatus,
  getRequestsFilters,
  getRequestsData,
  submitJRequestForm,
  deleteJrequest,
  loadLastLogin,
  loadDashboardData,
  getAllJbuildingsRoomsData,
  getClassHoldTimeData,
  getJbuildingsRoomsData,
  submitHoldTime,
  updateHoldTimeStatus,
  getClassHoldTime,
  getClassSession,
  submitSession,
  deleteSession,
  deleteAllSession,
  autoSessionGenerator,
  getClassSessionUserList,
  getClassUserList,
  changeUserSessionStatus,
  submitUserListInfo,
  loadMemberWeekLyPlan,
  getJCenterOperatorList,
  submitOperator,
  deleteOperator,
  changeJOperatorStatus,
  getClassCancelationUserList,
  acceptCancelRequest,
  getPayBackData,
  acceptPayBack
};