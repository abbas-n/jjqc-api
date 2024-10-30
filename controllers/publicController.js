const asyncHandler = require("express-async-handler");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const PModel = require("../models/publicModel");


//@desc Get all cities
//@route GET /api/v1/public/getCities
//@access public
const getCities = asyncHandler(async (req, res) => {
    let cities = await PModel.getCities();
    res.status(200).json({ data: cities });
});

//@desc Get shipment estimate cost
//@route POST /api/v1/public/estimateCost
//@access public
const estimateCost = asyncHandler(async (req, res) => {
    let { originCity, originCityName, destCity, destCityName, qty, pType, value, weight, length, height, width } = req.body.parcelData;
    try {
        if (originCity == '' || originCityName == '' || destCity == '' || destCityName == '' || weight == '' || value == '') {
            res.status(400).json({ message: "اطلاعات فرم کامل نیست" });
            if (pType == 1 && (length == '' || height == '' || width == '')) {
                res.status(400).json({ message: "اطلاعات فرم کامل نیست" });
            }
        } else {
            if (pType == 2) {
                length = width = height = 0;
            }
            let { totalPrice, shippingPrice, insurance, PVCharge, packaging } = await PModel.calculateShipmentPriceByFormula(originCity, destCity, pType, length, width, height, weight, value, qty, false);
            res.status(200).json({ data: totalPrice });
        }
    } catch (err) {
        res.status(500).json({ message: "خطا در عملیات" });
    }
});



module.exports = {
    getCities,
    estimateCost,
};