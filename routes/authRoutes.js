import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken"
const router = express.Router();


const generateToken = (userId) => {
  return jwt.sign({userId}, process.env.JWT_SECRET, {
    expiresIn: "1d"
  })
}

router.post("/register", async (req, res) => {
   try {
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

router.post("/login", async (req, res) => {
    try {
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


export default router