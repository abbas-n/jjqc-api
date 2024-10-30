const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const PModel = require("../models/publicModel");


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

  let checkIsNumber = tools.is_number(mobile);
  let checkIsMobile = tools.is_mobile(mobile);

  if (!checkIsNumber || mobile == '' || !checkIsMobile) {
    res.status(400);
    throw new Error("شماره موبایل مجاز نیست");
  }

  const checkUser = "SELECT * FROM user__info WHERE mobile = ?";
  const checkUser_query = mysql.format(checkUser, [mobile]);
  dbCon.query(checkUser_query, async (err, result) => {
    if (err) throw (err);
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

        const code = tools.rand_numcode(5);
        const sqlInsert = "INSERT INTO user__sms_code(mobile,code) VALUES (?,?)";
        const insert_query = mysql.format(sqlInsert, [mobile, code]);

        result = await PModel.dbQuery_promise(insert_query);
        if (result.insertId <= 0) {
          res.status(500).json({ message: 'خطا در ارسال کد تایید' });
        } else {
          var smsRS = await tools.sendSMS_ir(code, mobile);
          if (smsRS == 200) {
            res.status(200).json({ message: 'کد با موفقیت ارسال شد' });
          } else {
            res.status(500).json({ message: 'خطا در ارسال پیامک' });
          }
        }
      } catch (err) {
        res.status(500).json({ message: 'خطا در ارسال پیامک' });
      }
    }
  });
});


//@desc Check mobile verification code
//@route POST /api/v1/auth/checkVerifyCode
//@access public
const checkVerifyCode = asyncHandler(async (req, res) => {
  const { mobile, verifyCode } = req.body;

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
        dbCon.query("UPDATE user__sms_code set status='verify' WHERE ID=" + result[0].ID);
        res.status(200).json({ message: '' });
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
  const { mobile, fname, lname, pass } = req.body;

  if (!mobile || !pass || !fname || !lname) {
    res.status(400);
    throw new Error("تمامی موارد فرم الزامی هستند");
  }
  let checkIsNumber = tools.is_number(mobile);
  let checkIsMobile = tools.is_mobile(mobile);
  if (!checkIsNumber || mobile == '' || !checkIsMobile) {
    res.status(400);
    throw new Error("شماره موبایل مجاز نیست");
  }

  // checkIsNumber = tools.is_number(ncode);
  // if (!checkIsNumber || ncode == '') {
  //   res.status(400);
  //   throw new Error("کد ملی مجاز نیست");
  // }

  if (!tools.is_string(fname) || !tools.is_string(lname)) {
    res.status(400);
    throw new Error("نام و نام خانوادگی مجاز نیست");
  }

  const sqlSearch = "SELECT * FROM user__info WHERE mobile = ?";
  const search_query = mysql.format(sqlSearch, [mobile]);

  await dbCon.query(search_query, async (err, result) => {
    if (err) throw (err)
    if (result.length != 0) {
      res.status(400).json({ message: "کاربر با این اطلاعات قبلا ثبت شده است" });
    } else {
      const uCode = await tools.generateUniqueCode('user__info', 'code', 6);
      const hashedPassword = await bcrypt.hash(pass, 10);
      let sqlInsert = "INSERT INTO user__info(code,fname,lname,mobile,password) VALUES (?,?,?,?,?)";
      let insert_query = mysql.format(sqlInsert, [uCode, fname, lname, mobile, hashedPassword]);
      dbCon.query(insert_query, (err, result) => {
        if (err) throw (err)
        if (result.insertId > 0) {
          sqlInsert = "INSERT INTO user__them_setting(user_id) VALUES (?)";
          insert_query = mysql.format(sqlInsert, [result.insertId]);
          res.status(200).json({ message: 'کاربر با موفقیت ایجاد شد' });
        } else {
          res.status(400).json({ message: 'خطا در ثبت کاربر' });
        }
      });
    }
  }) //end of dbCon.query()
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

    const sqlSearch = `Select user__info.*,user__them_setting.active_mode,user__them_setting.active_theme 
    FROM user__info 
    INNER JOIN user__them_setting ON user__them_setting.user_id = user__info.ID
    WHERE mobile = ?`;
    const search_query = mysql.format(sqlSearch, [mobile])
    await dbCon.query(search_query, async (err, user) => {
      if (err) throw (err)
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
          dbCon.query(del_query, async (err, result) => {
            const sqlInsert = "INSERT INTO user__refresh_token (user_id,token) VALUES (?,?)";
            const insert_query = mysql.format(sqlInsert, [user[0].ID, refreshToken]);
            dbCon.query(insert_query, (err, result) => { });
            res.cookie('RToken', refreshToken, { httpOnly: true, secure: true, sameSite: "none" });
            const needUserData = userDataForToken.user;
            res.status(200).json({ accessToken, needUserData });
          });
        } else {
          res.status(400).json({ message: 'نام کاربری یا رمز عبور اشتباه است' })
        } //end of bcrypt.compare()
      }//end of User exists i.e. results.length==0
    })
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
    console.log(err);
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
  getMenuItems,
  setPanelLight,
  setPanelThem
};