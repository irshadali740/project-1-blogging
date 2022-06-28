const express = require('express');
const router = express.Router();
const authorController = require("../controller/authorController")
const blogscontroller = require("../controller/bloggercontroller")
const middleware = require("../middleware/middleware")

router.get("/test-me", function (req, res) {
    res.send("My first ever api!")
})

router.post("/authors",authorController.createAuthor)

router.post("/authorlogin", authorController.loginauthor)

router.post("/blogs/", middleware.authentication, blogscontroller.createBlogs)

router.get("/blogs", middleware.authentication, blogscontroller.getblogs)

router.put("/blogs/:blogId", middleware.authentication, blogscontroller.updateBlog)

router.delete("/blogs/:blogId", middleware.authentication, blogscontroller.deleteBlogsById)

router.delete("/blogs", middleware.authentication, blogscontroller.deleteBlogByQuerConditoin)


module.exports = router