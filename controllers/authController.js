const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const PModel = require("../models/publicModel");
const educationModel = require("../models/educationModel");
const axios = require('axios');


function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30m" });
}
// refreshTokens
function generateRefreshToken(user) {
  const refreshToken =
    jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "35" });
  return refreshToken;
}


//@desc Send mobile verification code to user
//@route POST /api/v1/auth/sendVerifyCode
//@access public
const sendVerifyCode = asyncHandler(async (req, res) => {
  const mobile = req.body.mobile;

  try {

    let checkIsNumber = tools.is_number(mobile);
    let checkIsMobile = tools.is_mobile(mobile);
    if (!checkIsNumber || mobile == '' || !checkIsMobile) {
      res.status(400);
      throw new Error("شماره موبایل مجاز نیست");
    }

    const checkUser = "SELECT * FROM user__info WHERE mobile = ?";
    const checkUser_query = mysql.format(checkUser, [mobile]);
    let result = await PModel.dbQuery_promise(checkUser_query);
    if (result.length == 0) {
      res.status(403).json({ message: "شماره همراه وارد شده دارای حساب کاربری نمیباشد" });
    } else {
      const sqlSearch = "SELECT * FROM user__sms_code WHERE mobile=? ORDER BY ID DESC Limit 1";
      const search_query = mysql.format(sqlSearch, [mobile]);
      try {
        let result = await PModel.dbQuery_promise(search_query);
        if (result.length != 0) {
          var minutesDifference = await tools.nowTimeDif_min(result[0].insert_time.getTime());
          if (minutesDifference < 3) {
            res.status(403).json({ message: "تعداد درخواست بیش از حد مجاز است" });
            return;
          }
        }
        const code = tools.rand_numcode(6);
        const sqlInsert = "INSERT INTO user__sms_code(mobile,code) VALUES (?,?)";
        const insert_query = mysql.format(sqlInsert, [mobile, code]);

        result = await PModel.dbQuery_promise(insert_query);
        if (result.insertId <= 0) {
          res.status(500).json({ message: 'خطا در ارسال کد تایید' });
        } else {
          const msg = "سامانه جهاد دانشگاهی " + "\n" + "کد تایید:" + code;
          var smsRS = await tools.sendSMS_ir(msg, mobile);
          if (smsRS == 1) {
            res.status(200).json({ message: 'کد با موفقیت ارسال شد' });
          } else {
            res.status(500).json({ message: 'خطا در ارسال پیامک' });
          }
        }
      } catch (err) {
        res.status(500).json({ message: 'خطا در ارسال پیامک' });
      }
    }
  } catch (error) {

  }
});


//@desc Check mobile verification code
//@route POST /api/v1/auth/checkVerifyCode
//@access public
const checkVerifyCode = asyncHandler(async (req, res) => {
  const { mobile, verifyCode } = req.body;
  let statement, query, queryRS;
  let checkIsNumber = tools.is_number(mobile);
  let checkIsMobile = tools.is_mobile(mobile);

  if (!checkIsNumber || mobile == '' || !checkIsMobile) {
    res.status(400);
    throw new Error("شماره موبایل مجاز نیست");
  }

  const sqlSearch = "SELECT * FROM user__sms_code WHERE mobile=? ORDER BY ID DESC Limit 1";
  const search_query = mysql.format(sqlSearch, [mobile]);
  try {
    const result = await PModel.dbQuery_promise(search_query);

    if (result.length != 0) {
      if (result[0].code == verifyCode) {
        statement = `UPDATE user__sms_code set status='verify' WHERE ID=?`;
        query = mysql.format(statement, [result[0].ID]);
        queryRS = await PModel.dbQuery_promise(query);
        statement = `UPDATE user__info set status='Active' WHERE mobile=?`;
        query = mysql.format(statement, [mobile]);
        queryRS = await PModel.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
          res.status(200).json({ message: 'حساب کاربری با موفقیت فعال شد' });
        } else {
          res.status(400).json({ message: 'خطا در فعالسازی حساب کاربری' });
        }
      } else {
        res.status(400).json({ message: 'کد وارد شده معتبر نمیباشد' });
      }
    } else {
      res.status(500).json({ message: 'خطای بررسی' });
    }
  } catch (err) {
    res.status(500).json({ message: 'خطای بررسی' });
  }
});


//@desc Register a user
//@route POST /api/v1/auth/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  try {

    const { mobile, fname, lname, pass, nationalCode, selectedCenter } = req.body;

    if (!mobile || !pass || !fname || !lname, !nationalCode) {
      res.status(400);
      throw new Error("تمامی موارد فرم الزامی هستند");
    }
    let checkIsNumber = tools.is_number(mobile);
    let checkIsMobile = tools.is_mobile(mobile);
    if (!checkIsNumber || mobile == '' || !checkIsMobile) {
      res.status(400);
      throw new Error("شماره موبایل مجاز نیست");
    }

    checkIsNumber = tools.is_number(nationalCode);
    if (!checkIsNumber || nationalCode == '') {
      res.status(400);
      throw new Error("کد ملی مجاز نیست");
    }

    if (!tools.is_string(fname) || !tools.is_string(lname)) {
      res.status(400);
      throw new Error("نام و نام خانوادگی مجاز نیست");
    }

    const sqlSearch = "SELECT * FROM user__info WHERE mobile = ?";
    const search_query = mysql.format(sqlSearch, [mobile]);

    let result = await PModel.dbQuery_promise(search_query);
    if (result.length != 0) {
      res.status(400).json({ message: "کاربر با این اطلاعات قبلا ثبت شده است" });
    } else {
      const uCode = await tools.generateUniqueCode('user__info', 'code', 6, 'U');
      const hashedPassword = await bcrypt.hash(pass, 10);
      let sqlInsert = "INSERT INTO user__info(code,fname,lname,national_code,mobile,password,status,jcenter_id) VALUES (?,?,?,?,?,?,?,?)";
      let insert_query = mysql.format(sqlInsert, [uCode, fname, lname, nationalCode, mobile, hashedPassword, 'Not_Confirmed', selectedCenter]);
      let queryRS = await PModel.dbQuery_promise(insert_query);
      if (queryRS.insertId > 0) {
        sqlInsert = "INSERT INTO user__them_setting(user_id) VALUES (?)";
        insert_query = mysql.format(sqlInsert, [queryRS.insertId]);
        await PModel.dbQuery_promise(insert_query);
        sqlInsert = "INSERT INTO user__detail(user_id) VALUES (?)";
        insert_query = mysql.format(sqlInsert, [queryRS.insertId]);
        await PModel.dbQuery_promise(insert_query);
        await axios.post('https://api.jjqc.ir/api/v1/auth/sendVerifyCode', {
          mobile: mobile
        });
        res.status(200).json({ message: 'کاربر با موفقیت ثبت شد' });
      } else {
        res.status(400).json({ message: 'خطا در ثبت کاربر' });
      }
    }
  } catch (error) {

  }
});

//@desc Login user
//@route POST /api/v1/auth/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  try {

    let { mobile, password } = req.body;
    if (!mobile || !password) {
      res.status(400);
      throw new Error("لطفا فرم را تکمیل کنید");
    }
    // console.log(mobile);
    if (mobile == 'demo') {
      mobile = '09127635212'
    }
    if (mobile == 'edemo') {
      mobile = '09201250456'
    }

    const sqlSearch = `SELECT user__info.*,user__them_setting.active_mode,user__them_setting.active_theme 
    FROM user__info 
    INNER JOIN user__them_setting ON user__them_setting.user_id = user__info.ID
    WHERE user__info.status='Active' AND mobile = ?`;
    const search_query = mysql.format(sqlSearch, [mobile])
    let user = await PModel.dbQuery_promise(search_query);
    if (user.length == 0) {
      res.status(404).json({ message: 'کاربر با این مشخصات یافت نشد' });
    }
    else {
      const hashedPassword = user[0].password
      if (await bcrypt.compare(password, hashedPassword)) {
        const userDataForToken = {
          user: {
            username: user[0].fname + ' ' + user[0].lname,
            ID: user[0].ID,
            lightMode: user[0].active_mode,
            activeTheme: user[0].active_theme,
          }
        }
        const accessToken = generateAccessToken(userDataForToken);
        const refreshToken = generateRefreshToken(userDataForToken);

        const sqlDel = "DELETE FROM user__refresh_token WHERE user_id=?";
        const del_query = mysql.format(sqlDel, [user[0].ID]);
        await PModel.dbQuery_promise(del_query);

        const sqlInsert = "INSERT INTO user__refresh_token (user_id,token) VALUES (?,?)";
        const insert_query = mysql.format(sqlInsert, [user[0].ID, refreshToken]);
        await PModel.dbQuery_promise(insert_query);
        res.cookie('RToken', refreshToken, { httpOnly: true, secure: true, sameSite: "none" });

        const needUserData = userDataForToken.user;
        const sqllogInsert = "INSERT INTO `user__last_login`(`user_id`) VALUES (?)";
        const insertLogQuery = mysql.format(sqllogInsert, [user[0].ID]);
        await PModel.dbQuery_promise(insertLogQuery);

        res.status(200).json({ accessToken, needUserData });
      } else {
        res.status(400).json({ message: 'نام کاربری یا رمز عبور اشتباه است' })
      }
    }
  } catch (err) {
    console.log(err)
    res.status(404).json({ message: 'خطا در ورود به سیستم' });
  }
});

//@desc Refresh Token
//@route POST /api/v1/auth/refreshToken
//@access public
const refreshToken = asyncHandler(async (req, res) => {
  let rtoken = req.cookies;
  if (!rtoken) {
    res.status(401).json({ message: "User is not authorized or token is missing" });
  }
  rtoken = rtoken.RToken;
  jwt.verify(rtoken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      const sqlDel = "DELETE FROM user__refresh_token WHERE token=?";
      const del_query = mysql.format(sqlDel, [rtoken]);
      dbCon.query(del_query, async (err, result) => {
        res.clearCookie();
        res.status(401).json({ message: "Token is not authorized" });
      });
    } else {
      const user = decoded.user;
      const sqlDel = "DELETE FROM user__refresh_token WHERE user_id=?";
      const del_query = mysql.format(sqlDel, [user.ID]);
      dbCon.query(del_query, async (err, result) => {
        const accessToken = generateAccessToken({ user: user });
        const refreshToken = generateRefreshToken({ user: user });
        const sqlInsert = "INSERT INTO user__refresh_token(user_id,token) VALUES (?,?)";
        const insert_query = mysql.format(sqlInsert, [user.ID, refreshToken]);
        await dbCon.query(insert_query, (err, result) => { });
        res.cookie('RToken', refreshToken, { httpOnly: true, secure: true, sameSite: "none" });
        res.status(200).json({ accessToken });
      });
    }
  });

});

//@desc Log Out User
//@route POST /api/v1/auth/logOut
//@access private
const logOut = asyncHandler(async (req, res) => {
  const userID = req.body.userID;
  const del = "DELETE FROM user__refresh_token WHERE user_id=?";
  const del_query = mysql.format(del, [userID]);
  dbCon.query(del_query, (err, result) => {
    if (err) throw (err);
    res.clearCookie();
    res.status(200).json({ message: 'کاربر با موفقیت خارج شد' });
  });
});

//@desc Current user info
//@route POST /api/v1/auth/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

//@desc get user info
//@route GET /api/v1/auth/getUserProfileData
//@access private
const getUserProfileData = asyncHandler(async (req, res) => {
  const userID = req.user.ID;
  try {

    let profileData = await PModel.getUserProfileData(userID);
    res.status(200).json({ profileData: profileData[0] });
  } catch (err) {
    res.status(500).json({ message: 'خطا در عملیات' });
  }
});

//@desc update user pass
//@route POST /api/v1/auth//updatePassword
//@access private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPass, newPass, newPassRepeat } = req.body.passes;
  const userID = req.user.ID;
  try {
    if (newPass.length >= 8) {
      if (newPass == newPassRepeat) {
        let statement = "SELECT * FROM user__info WHERE ID = ?";
        let selectQuery = mysql.format(statement, [userID]);
        let userRS = await PModel.dbQuery_promise(selectQuery);

        const hashedPassword = userRS[0]['password'];
        if (await bcrypt.compare(currentPass, hashedPassword)) {
          let newHashPass = await bcrypt.hash(newPass, 10);
          statement = "UPDATE user__info SET password=? WHERE ID=?";
          let updateQuery = mysql.format(statement, [newHashPass, userID]);
          await PModel.dbQuery_promise(updateQuery);
          res.status(200).json({ message: 'رمز عبور با موفقیت تغییر کرد' });
        } else {
          res.status(400).json({ message: 'رمزعبور فعلی اشتباه است' });
        }

      } else {
        res.status(400).json({ message: 'رمز عبور و تکرار آن یکسان نیست' });
      }
    } else {
      res.status(400).json({ message: 'حداقل طول رمزعبور 8 کارکتر است' });
    }
  } catch (err) {
    res.status(500).json({ message: 'خطا در عملیات' });
  }
});

//@desc send code to user for pass recovery
//@route POST /api/v1/auth//sendCodeForPassForget
//@access public
const sendCodeForPassForget = asyncHandler(async (req, res) => {
  const mobile = req.body.mobile;
  let checkIsNumber = tools.is_number(mobile);
  let checkIsMobile = tools.is_mobile(mobile);
  try {

    if (!checkIsNumber || mobile == '' || !checkIsMobile) {
      res.status(400).json({ message: "شماره موبایل مجاز نیست" });
    }

    let checkUser = "SELECT * FROM user__info WHERE mobile = ?";
    let checkUser_query = mysql.format(checkUser, [mobile]);
    checkUser = await PModel.dbQuery_promise(checkUser_query);
    if (checkUser.length == 0) {
      res.status(403).json({ message: "حساب کاربری برای شمراه همراه وارد شده یافت نشد" });
    } else {
      const sqlSearch = "SELECT * FROM user__sms_code WHERE mobile=? ORDER BY ID DESC Limit 1";
      let search_query = mysql.format(sqlSearch, [mobile]);
      search_query = await PModel.dbQuery_promise(search_query);
      if (search_query.length != 0) {
        var minutesDifference = await tools.nowTimeDif_min(search_query[0].insert_time.getTime());
        if (minutesDifference < 2) {
          res.status(403).json({ message: "تعداد درخواست بیش از حد مجاز است" });
          return;
        }
      }

      const code = tools.rand_numcode(5);
      const sqlInsert = "INSERT INTO user__sms_code(mobile,code) VALUES (?,?)";
      let insert_query = mysql.format(sqlInsert, [mobile, code]);
      insert_query = await PModel.dbQuery_promise(insert_query);
      if (insert_query.insertId <= 0) {
        res.status(500).json({ message: 'خطا در ارسال کد تایید' });
      } else {
        const msg = "کالارسان پلاس" + "\n" + "کد تایید:" + code;
        var smsRS = await tools.sendSMS_ir(msg, mobile);
        smsRS = JSON.parse(smsRS);
        if (smsRS.IsSuccessful) {
          res.status(200).json({ message: 'کد با موفقیت ارسال شد' });
        } else {
          res.status(500).json({ message: 'خطا در ارسال پیامک' });
        }
      }
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'خطا در ارسال پیامک' });
  }

});



//@desc update user password
//@route POST /api/v1/auth//submitNewPass
//@access public
const submitNewPass = asyncHandler(async (req, res) => {
  const { mobile, pass } = req.body;
  let checkIsNumber = tools.is_number(mobile);
  let checkIsMobile = tools.is_mobile(mobile);
  try {
    if (!checkIsNumber || mobile == '' || !checkIsMobile) {
      res.status(400).json({ message: "شماره موبایل مجاز نیست" });
    }

    let checkUser = "SELECT * FROM user__info WHERE mobile = ?";
    let checkUser_query = mysql.format(checkUser, [mobile]);
    checkUser = await PModel.dbQuery_promise(checkUser_query);
    if (checkUser.length == 0) {
      res.status(403).json({ message: "حساب کاربری برای شمراه همراه وارد شده یافت نشد" });
    } else {
      const hashedPassword = await bcrypt.hash(pass, 10);
      let updateUser = "UPDATE user__info SET password=? WHERE ID=?";
      updateUser = mysql.format(updateUser, [hashedPassword, checkUser[0]['ID']]);
      updateUser = await PModel.dbQuery_promise(updateUser);
      if (updateUser.affectedRows == 1) {
        res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
      } else {
        res.status(500).json({ message: 'خطا در ثبت اطلاعات' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت اطلاعات' });
  }

});



//@desc update user password
//@route POST /api/v1/auth//submitChangePass
//@access private
const submitChangePass = asyncHandler(async (req, res) => {
  const userID = req.user.ID;
  const { newPass } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPass, 10);
    let updateUser = "UPDATE user__info SET password=? WHERE ID=?";
    updateUser = mysql.format(updateUser, [hashedPassword, userID]);
    updateUser = await PModel.dbQuery_promise(updateUser);
    if (updateUser.affectedRows == 1) {
      res.status(200).json({ message: 'اطلاعات با موفقیت ثبت شد' });
    } else {
      res.status(500).json({ message: 'خطا در ثبت اطلاعات' });
    }
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت اطلاعات' });
  }

});



//@desc get user permission related panel tabs
//@route POST /api/v1/auth/getMenuItems
//@access private
const getMenuItems = asyncHandler(async (req, res) => {
  const userID = req.user.ID;
  try {

    let checkUser = "SELECT * FROM user__info WHERE ID = ?";
    let checkUser_query = mysql.format(checkUser, [userID]);
    checkUser = await PModel.dbQuery_promise(checkUser_query);
    if (checkUser.length == 0) {
      res.status(403).json({ message: "خطا در دریافت اطلاعات" });
    } else {
      let getTabs = `SELECT
      panels__tabs.id,
      panels__tabs.title,
      panels__tabs.icon,
      panels__tabs.href,
      panels__tabs.bgcolor,
      panels__tabs.navlabel,
      panels__tabs.subheader,
      childTabs.id AS childTabID,
      childTabs.title AS childTitle,
      childTabs.href AS childHref,
      childTabs.icon AS childIcon
      FROM panels__tabs_permission_relation
      INNER JOIN panels__tabs ON panels__tabs.id = panels__tabs_permission_relation.tab_id
      LEFT JOIN panels__tabs AS childTabs ON childTabs.parent = panels__tabs.id
      WHERE panels__tabs_permission_relation.permission_id=? AND panels__tabs.parent = 0
      ORDER BY panels__tabs.priority ASC ,panels__tabs.id ASC, childTabs.priority ASC, childTabs.id ASC`;
      getTabs = mysql.format(getTabs, [checkUser[0]['permission']]);
      // console.log(getTabs)
      getTabs = await PModel.dbQuery_promise(getTabs);
      let tabsRS = [];
      let jsonObject = '';
      let jsonChildObject;
      let tempTabId = 0;
      for (var i = 0; i < getTabs.length; i++) {
        if (getTabs[i]['navlabel'] == 'true') {
          jsonObject = {
            navlabel: true,
            subheader: getTabs[i]['subheader'],
          };
          console.log('1');
          tabsRS.push(jsonObject);
          tempTabId = getTabs[i]['id'];
        }
        if (tempTabId != getTabs[i]['id']) {
          if (jsonObject != '') {
            tabsRS.push(jsonObject);
          }
          tempTabId = getTabs[i]['id'];
          if (getTabs[i]['childTabID'] == null) {
            jsonObject = {
              id: getTabs[i]['id'],
              title: getTabs[i]['title'],
              icon: getTabs[i]['icon'],
              href: getTabs[i]['href'],
              bgcolor: getTabs[i]['bgcolor'],
            };
          } else {
            jsonObject = {
              id: getTabs[i]['id'],
              title: getTabs[i]['title'],
              icon: getTabs[i]['icon'],
              href: getTabs[i]['href'],
              bgcolor: getTabs[i]['bgcolor'],
              children: [],
            };
          }
        }
        if (tempTabId == getTabs[i]['id'] && getTabs[i]['childTabID'] != null) {
          jsonChildObject = {
            id: getTabs[i]['childTabID'],
            title: getTabs[i]['childTitle'],
            href: getTabs[i]['childHref'],
          };
          jsonObject.children.push(jsonChildObject);
        }
      }
      tabsRS.push(jsonObject);
      if (tabsRS.length > 0) {
        res.status(200).json({ tabsRS: tabsRS });
      } else {
        res.status(403).json({ message: 'خطا در دریافت اطلاعات' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت اطلاعات' });
  }

});

//@desc set panel light dark them
//@route POST /api/v1/auth/setPanelLight
//@access private
const setPanelLight = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { needLightMode } = req.body;

    await PModel.setPanelLight(userID, needLightMode);
    res.status(200).json({ message: 'بروزرسانی با موفقیت انجام شد' });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc set panel active them
//@route POST /api/v1/auth/setPanelThem
//@access private
const setPanelThem = asyncHandler(async (req, res) => {
  try {
    const userID = req.user.ID;
    const { them } = req.body;

    await PModel.setPanelThem(userID, them);
    res.status(200).json({ message: 'بروزرسانی با موفقیت انجام شد' });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get jahad Requests Data
//@route get /api/v1/data/loadMemberWeekLyPlan
//@access private
const loadCistyOstan = asyncHandler(async (req, res) => {
  try {
    let cityOstan = await PModel.loadCistyOstan();
    res.status(200).json({ cityOstan });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});
//@desc post jahad Requests Data
//@route post /api/v1/data/loadJcenterForOstan
//@access private
const loadJcenterForOstan = asyncHandler(async (req, res) => {
  try {
    const { selectedOstan } = req.body;
    let ostanJcenter = await PModel.loadJcenterForOstan(selectedOstan);
    res.status(200).json({ ostanJcenter });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//----------------------------------------------------------------
//----------------------------------------------------------------
//-----------------------------------------------SITE LANDING APIS

//@desc get site landing banners
//@route post /api/v1/auth/landingBanners
//@access private
const getLandingBanners = asyncHandler(async (req, res) => {
  try {
    let statement, query, banners;
    statement = `SELECT
    classes__info.ID,
    classes__info.image_url
	  FROM site__banners
    INNER JOIN classes__info ON classes__info.ID = site__banners.class_id`;
    query = mysql.format(statement, []);
    banners = await PModel.dbQuery_promise(query);
    res.status(200).json({ banners });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get site starting classes 
//@route post /api/v1/auth/getSiteStartingClasses
//@access private
const getSiteStartingClasses = asyncHandler(async (req, res) => {
  try {

    let startingClasses = await PModel.getSiteStartingClasses(0);
    res.status(200).json({ startingClasses });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get site class Details 
//@route post /api/v1/auth/getLandingClassData
//@access private
const getLandingClassData = asyncHandler(async (req, res) => {
  try {

    const { classId } = req.body;
    let classHoldTime = await PModel.getClassHoldTimeData(classId, 'Active');
    let classTeacherRS = await educationModel.getClassTeacherData(classId);
    let classData = await PModel.getSiteStartingClasses(classId);
    res.status(200).json({ classData: classData, classHoldTime: classHoldTime, classTeacherRS: classTeacherRS });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get cities with centers
//@route post /api/v1/auth/getCitiesWithCenter
//@access public
const getCitiesWithCenter = asyncHandler(async (req, res) => {
  try {

    let citiesWithCenter = await PModel.getCitiesWithCenter();
    res.status(200).json({ citiesWithCenter: citiesWithCenter });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get centers By city ID
//@route post /api/v1/auth/getCentersByCity
//@access public
const getCentersByCity = asyncHandler(async (req, res) => {
  try {
    const { cityId } = req.body;
    let centersData = await PModel.getCentersByCity(cityId);
    res.status(200).json({ centersData: centersData });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get classes by centerId
//@route post /api/v1/auth/getClassesByCenter
//@access public
const getClassesByCenter = asyncHandler(async (req, res) => {
  try {
    const { centerId } = req.body;
    let classData = await PModel.getClassesByCenter(centerId);
    res.status(200).json({ classData: classData });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get classes by centerId
//@route post /api/v1/auth/getClassesByCenter
//@access public
const getMainWorkingGroups = asyncHandler(async (req, res) => {
  try {
    let mainGroups = await PModel.getMainWorkingGroups();
    res.status(200).json({ mainGroups: mainGroups });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get working groups by main groups
//@route post /api/v1/auth/getWorkingGroups
//@access public
const getWorkingGroups = asyncHandler(async (req, res) => {
  try {
    const { mainGroupId } = req.body;
    let workingGroups = await PModel.getWorkingGroups(mainGroupId);
    res.status(200).json({ workingGroups: workingGroups });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});

//@desc get classes by workingGroup id
//@route post /api/v1/auth/getClassesByWorkingGroup
//@access public
const getClassesByWorkingGroup = asyncHandler(async (req, res) => {
  try {
    const { workingGroupId } = req.body;
    let classData = await PModel.getClassesByWorkingGroup(workingGroupId);
    res.status(200).json({ classData: classData });
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت اطلاعات" });
  }
});


module.exports = {
  registerUser,
  loginUser,
  currentUser,
  sendVerifyCode,
  checkVerifyCode,
  refreshToken,
  logOut,
  getUserProfileData,
  updatePassword,
  sendCodeForPassForget,
  submitNewPass,
  submitChangePass,
  getMenuItems,
  setPanelLight,
  setPanelThem,
  loadCistyOstan,
  loadJcenterForOstan,
  getLandingBanners,
  getSiteStartingClasses,
  getLandingClassData,
  getCitiesWithCenter,
  getCentersByCity,
  getClassesByCenter,
  getMainWorkingGroups,
  getWorkingGroups,
  getClassesByWorkingGroup
};