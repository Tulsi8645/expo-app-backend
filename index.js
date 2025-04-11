import express from "express";
import cors from "cors";
import "dotenv/config";
const app = express();
import jwt from "jsonwebtoken"
import cloudinary from "./lib/cloudinary.js";
const router = express.Router();
const PORT=process.env.PORT || 3001;
import protectRoute from "./middleware/authMiddleware.js";
import User from "./models/User.js";
import Book from "./models/Book.js";
import { connectDB } from "./lib/db.js";

app.use(express.json());
app.use(cors());
app.use(router);



router.get("/", (req, res) => {
    res.status(200).json({msg: "Bookworm Api is running"})
})



//User routes
const generateToken = (userId) => {
  return jwt.sign({userId}, process.env.JWT_SECRET, {
    expiresIn: "1d"
  })
}

router.post("/api/auth/register", async (req, res) => {
   try {
     console.log("Register route hit")
     const {username, email, password} = req.body

     if(!username || !email || !password){
        return res.status(400).json({msg: "Please enter all fields"})
     }
     if(password.length < 6){
        return res.status(400).json({msg: "Password must be at least 6 characters"})
     }
     if (username.length < 3){
        return res.status(400).json({msg: "Username must be at least 3 characters"})
     }
     //Check if user already exists
     const existingUser = await User.findOne({email})
     if(existingUser){
        return res.status(400).json({msg: "User already exists with this email"})
     }
     //get random avator 
     const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
     
     const user = await User.create({
        username,
        email,
        password,
        profileImage
     })

     const token = generateToken(user._id)
     res.status(201).json({user: {_id: user._id, username: user.username, email: user.email, profileImage: user.profileImage}, token})
   
    } catch (error) {
     res.status(500).json({msg: error.message})
     console.log("Error occured while registering user",error)
   }
})

router.post("/api/auth/login", async (req, res) => {
    try {
        console.log("Login route hit")
        const {email, password} = req.body
        if(!email || !password){
            return res.status(400).json({msg: "Please enter all fields"})
        }
        //Check if user exists
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({msg: "User does not exist"})
        }
        //Check if the entered password matches with the password in the database
        const isMatch = await user.matchPassword(password)
        if(!isMatch){
            return res.status(400).json({msg: "Invalid credentials"})
        }
        //Generate token
        const token = generateToken(user._id)
        res.status(200).json({user: {_id: user._id, username: user.username, email: user.email, profileImage: user.profileImage}, token})
    } catch (error) {
      res.status(500).json({msg: error.message})
      console.log("Error occured while logging in user",error)  
    }
})


//Book routes

router.post("/api/book/add",protectRoute, async (req, res) => {
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
router.get("/api/book/find",protectRoute, async (req, res) => {
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
router.get("api/book/user/:id",protectRoute, async (req, res) => {
    try {
        const books = await Book.find({user: req.params.id}).sort({createdAt: -1})
        res.status(200).json({books})
    } catch (error) {
        res.status(500).json({msg: error.message})
        console.log("Error occured while getting books",error)  
    }
})

//delete a book by id
router.delete("/api/book/delete/:id",protectRoute, async (req, res) => {
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



app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
    connectDB();
});