const jwt = require("jsonwebtoken");

const authentication = async function (req, res, next) {
    try {
        let token = req.headers["x-api-key"];
        if (!token) return res.status(404).send({ status: false, msg: "token must be present" });
        let decodedToken = jwt.verify(token, "projectOne");
        if (!decodedToken) return res.status(400).send({ status: false, msg: "token is invalid" });
        next()
    } catch (error) {
        res.status(500).send({ msg: error.message })
    }
}


module.exports.authentication = authentication
