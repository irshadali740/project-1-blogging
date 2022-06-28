const jwt = require("jsonwebtoken");
const authorModel = require('../models/authorModel')

//=========================================================== Validation =================================================================/

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.length === 0) return false
    return true;
}

const isValidtitle = function (title) {
    return ['Mr', 'Mrs', 'Miss'].indexOf(title) !== -1
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

//=========================================================== Creating author =============================================================/
const createAuthor = async function (req, res) {
    try {
        let requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide author details' })
            return
        }
        //extract params
        let { fname, lname, title, email, password } = requestBody; //Object destructing

        //validation starts
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, msg: "firstname is mandatory" })
        }
        if (!/^([a-zA-Z]){2,20}$/.test(fname)) {
            return res.status(400).send({ status: false, msg: "firstname should not be a number" })
        }
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, msg: "lastname is mandatory" })
        }
        if (!/^([a-zA-Z]){2,10}$/.test(lname)) {
            return res.status(400).send({ status: false, msg: "lastname should not be a number" })
        }
        if (!isValid(title)) {
            return res.status(400).send({ status: false, msg: "title is mandatory" })
        }
        if (!isValidtitle(title)) {
            return res.status(400).send({ status: false, msg: "title should only have Mr or Mrs Or Miss" })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "email is mandatory" })
        }
        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "password is mandatory" })
        }
        if (!password.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9!@#$%^&*]{8,})$/)) {
            return res.status(400).send({ status: false, msg: "password is not strong,must contain alphanumeric" })
        }
        let isUniqueEmail = await authorModel.findOne({ email: email })
        if (isUniqueEmail) {
            return res.status(400).send({ status: false, msg: "email already exist" })
        }
        const authorData = { fname, lname, title, email, password }
        let savedData = await authorModel.create(authorData);

        res.status(201).send({ status: true, data: savedData })
    }
    catch (err) {
        res.status(500).send({ msg: "Error", error: err.message });
    }
}

//============================================================ Phase II ====================================================================//

const loginauthor = async function (req, res) {
    try {
        let userName = req.body.email;
        let password = req.body.password;
        let username = await authorModel.findOne({ email: userName })
        if (!username)
            return res.status(404).send({ status: false, msg: "Please check username" });
        let userpassword = await authorModel.findOne({ password: password })
        if (!userpassword)
            return res.status(404).send({ status: false, msg: "Please check password" });
        let user = await authorModel.findOne({ email: userName, password: password });
        let token = jwt.sign({ userId: user._id.toString() }, "projectOne");
        res.setHeader("x-api-key", token);
        res.status(201).send({ status: true, data: {token}});
    }
    catch (error) {
        res.status(400).send({ msg: error.message })
    }
}

module.exports = {createAuthor,loginauthor}