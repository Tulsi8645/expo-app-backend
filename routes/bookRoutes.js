import express from "express";
import Book from "../models/Book.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/",protectRoute, async (req, res) => {
    try {
        const {title, author, caption, image, rating} = req.body
        if(!title || !caption || !image || !rating){
            return res.status(400).json({msg: "Please enter all required fields"})
        }
        if(rating < 1 || rating > 5){
            return res.status(400).json({msg: "Rating must be between 1 and 5"})
        }
        //upload image to cloudinary
        const result = await cloudinary.uploader.upload(image, {
            resource_type: "image"
        })
        image = result.secure_url

        const book = await Book.create({
            title,
            author,
            caption,
            image,
            rating,
            user: req.user._id,
        })
        res.status(201).json({book})
    } catch (error) {
        res.status(500).json({msg: error.message})
        console.log("Error occured while creating book",error)  
    }
})


//get all books, pagination for infinity scroll
router.get("/",protectRoute, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const books = await Book.find()
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit)
            .populate("user", "username profileImage")

        const totalCount = await Book.countDocuments();
        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({books,cureentPage: page, totalCount, totalPages});    
    } catch (error) {
        res.status(500).json({msg: error.message})
        console.log("Error occured while getting books",error)  
    }
})


// get a book by user id
router.get("/user/:id",protectRoute, async (req, res) => {
    try {
        const books = await Book.find({user: req.params.id}).sort({createdAt: -1})
        res.status(200).json({books})
    } catch (error) {
        res.status(500).json({msg: error.message})
        console.log("Error occured while getting books",error)  
    }
})

//delete a book by id
router.delete("/:id",protectRoute, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
        if(!book){
            return res.status(404).json({msg: "Book not found"})
        }
        if(book.user.toString() !== req.user._id.toString()){
            return res.status(401).json({msg: "Unauthorized"})
        }
        // delete the image from cloudinary
        try {
           const result = await cloudinary.uploader.destroy(book.image);
             if (result.result !== 'ok') {
             console.log('Error deleting image from Cloudinary:', result);
            }
        } catch (error) {
             console.log('Error deleting image from Cloudinary:', error);
             }

        await book.remove()
        res.status(200).json({msg: "Book deleted successfully"})
    } catch (error) {
        res.status(500).json({msg: error.message})
        console.log("Error occured while deleting book",error)  
    }
})

export default router