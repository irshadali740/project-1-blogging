const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const authorModel = require("../models/authorModel");
const blogsModel = require("../models/blogsModel")
const moment = require('moment')
//============================================================ Validation ================================================================//

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}
//============================================================ Phase I ================================================================//
//========================================================= Creating Blogs ===========================================================// 

const createBlogs = async function (req, res) {
    try {
        let requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: "Invalid request parameters.Please provide blog details" })
            return
        }

        const { title, body, authorId, tags, category, subcategory, isPublished } = requestBody;
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: "Blog title is required" })
            return
        }
        if (!isValid(body)) {
            return res.status(404).send({ status: false, message: "Please provide body" })
        }
        if (!isValid(authorId)) {
            return res.status(400).send({ status: false, message: "Please provide authorId" })
        }
        if (!isValidObjectId(authorId)) {
            return res.status(404).send({ status: false, message: `${authorId} is not a valid author id` })
        }
        if (!isValid(category)) {
            return res.status(400).send({ status: false, message: "Please provide category" })
        }
        let authorDetails = await authorModel.findById(authorId);
        if (!authorDetails)
            return res.status(404).send({ status: false, msg: "No such author exists" });
        let savedData = await blogsModel.create(requestBody);
        res.status(201).send({ status: true, data: savedData });
    }
    catch (error) {
        res.status(500).send({ msg: "Error", error: error.message })
    }
}

//===================================================== get Blogs ====================================================================//

let getblogs = async function (req, res) {
    try {
        let query = Object.keys(req.query);
        if (query.length) {
            let filter = req.query;
            filter.isDeleted = false;
            filter.isPublished = true;
            let allblogs = await blogsModel.find(filter);
            if (!allblogs.length) {
                return res.status(404).send({ status: false, msg: "No blog found with requested query" })
            }
            return res.status(200).send({ status: true, data: allblogs })
        }
        let getblogs = await blogsModel.find({ isDeleted: false, isPublished: true })
        if (!getblogs.length)
            return res.status(404).send({ status: false, msg: "Blog does not exist" })
        res.status(200).send({ status: true, data: getblogs })
    }
    catch (error) {
        res.status(500).send({ msg: "Error", error: error.message })
    }
}

//======================================================== Updating Blogs =========================================================//

const updateBlog = async function (req, res) {
    try {
        let blogId = req.params.blogId;
        let requestBody = req.body

        if (!isValidObjectId(blogId)) {
            res.status(400).send({ status: false, message: `${blogId} is not a valid blog id` })
            return
        }
        const blog = await blogsModel.findOne({ _id: blogId, isDeleted: false, deletedAt: null })
        if (!blog) {
            return res.status(404).send({ status: false, message: "Blog is not found" })
        }
        let token = req.headers["x-api-key"];
        let decodedToken = jwt.verify(token, "projectOne")
        if (decodedToken.userId != blog.authorId) {
            return res.send({ status: false, msg: 'User logged is not allowed to modify the requested users data' })
        }
        if (!isValidRequestBody(requestBody)) {
            res.status(200).send({ status: true, message: "No parameters passed blog is unmodified" })
        }
        const { title, body, tags, category, subcategory, isPublished } = requestBody;
        const updateBlogData = {}

        if (isValid(title)) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$set')) updateBlogData['$set'] = {}
            updateBlogData['$set']['title'] = title
        }
        if (isValid(body)) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$set')) updateBlogData['$set'] = {}
            updateBlogData['$set']['body'] = body
        }
        if (isValid(category)) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$set')) updateBlogData['$set'] = {}
            updateBlogData['$set']['category'] = category
        }
        if (isPublished !== undefined) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$set')) updateBlogData['$set'] = {}
            updateBlogData['$set']['isPublished'] = isPublished
            updateBlogData['$set']['isPublished'] = isPublished ? new Date() : null
        }
        if (tags) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$addToSet')) updateBlogData['$addToSet'] = {}
            if (Array.isArray(tags)) {
                updateBlogData['$addToSet']['tags'] = { $each: [...tags] }
            }
            if (typeof tags === "string") {
                updateBlogData['$addToSet']['tags'] = tags
            }
        }
        if(subcategory) {
            if(!Object.prototype.hasOwnProperty.call(updateBlogData, '$addToSet')) updateBlogData['$addToSet'] = {}
            if(Array.isArray(subcategory)) {
            updateBlogData['$addToSet']['subcategory'] = { $each: [...subcategory] }
            }
            if(typeof subcategory === "string") {
            updateBlogData['$addToSet']['subcategory'] = subcategory
            }
        }
        const updatedBlog = await blogsModel.findOneAndUpdate({_id:blogId},updateBlogData, {new: true})
        res.status(200).send({ status: 'updated', message:"Blog updated sucessfully" ,data: updatedBlog });
    } catch (error) {
        res.status(500).send({ msg: error.message })
    }
}

//============================================================ Delete Blogger by Id ==========================================================//

const deleteBlogsById = async function (req, res) {
    try {
        let blogId = req.params.blogId;
        if (!isValidObjectId(blogId)) {
            res.status(400).send({ status: false, message: `${blogId} is not a valid blog id` })
            return
        }
        let token = req.headers["x-api-key"];
        let decodedToken = jwt.verify(token, "projectOne")
        let blog = await blogsModel.findById(blogId);
        if (blog.authorId != decodedToken.userId)
            return res.send({ status: false, msg: 'User logged is not allowed to modify the requested users data' });
        if (!blog) {
            return res.status(404).send({ status: false, msg: "No such blog exists" });
        }
        let result = await blogsModel.findOne({ _id: blogId, isDeleted: false });
        if (!result) return res.status(404).send({ status: false, msg: "Blog is already deleted" });
        let deleteblog = await blogsModel.findOneAndUpdate(
            { _id: blogId },
            { $set: { isDeleted: true, deletedAt: null  } }, { new: true });
        res.status(200).send({ status: true, msg: "Blog is sucessfully deleted" });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message });
    }
};

//========================================================== Delete by query ============================================================ // 

const deleteBlogByQuerConditoin = async function (req, res) {
    try {
        let filterQuery = {isDeleted: false, deletedAt: null}
        let queryParams = req.query
        let authorIdFromToken = req.authorId
        if(!isValidRequestBody(queryParams)){
            res.status(400).send({status: false, message: 'no query recieved please provide query'})
            return
        }
        const {authorId, category, tags, subcategory, isPublished} = queryParams
        if(isValid(authorId) && isValidObjectId(authorId)){
            filterQuery['authorId'] = authorId
        }
        if(isValid(category)){
            filterQuery['category'] = category.trim()
        }
        if(isValid(isPublished)){
            filterQuery['isPublished'] = isPublished
        }
        if(isValid(tags)){
            const tagsArr = tags.trim().split(',').map(tag => tag.trim());
            filterQuery['tags'] = {$all: tagsArr}
        }
        if(isValid(subcategory)){
            const subcatArr = subcategory.trim().split(',').map(subcat => subcat.trim());
            filterQuery['tags'] = {$all: subcatArr}
        }
        const blogs = await blogsModel.find(filterQuery);
         let token = req.headers["x-api-key"];
        let decodedToken = jwt.verify(token, "projectOne")
        if (decodedToken.userId != blogs.authorId)
        return res.send({ status: false, msg: 'User logged is not allowed to modify the requested users data' });
        if(Array.isArray(blogs) && blogs.length === 0) {
            res.status(400).send({status: false, message: 'No matching blogs found'})
            return
        }
        const idsOfBlogsToDelete = blogs.map(blog => {
            if(blog.authorId.toString() === authorIdFromToken) return blog._id
        })
        if (idsOfBlogsToDelete.length === 0) {
            res.status(400).send({status: false, message: 'No blogs found'})
            return
        }
        await blogsModelupdateMany({status: true, message: 'Blogs deleted sucessfully'});
        res.status(200).send({status: true, message: 'Blogs deleted sucessfully'});
    }  
    catch (err) {
        console.log(err)
        res.status(500).send({ msg: err.message })
    }
}


//========================================================== Exported Module ===================================================================//
module.exports = {
    createBlogs,
    getblogs,
    updateBlog,
    deleteBlogsById,
    deleteBlogByQuerConditoin,
}

