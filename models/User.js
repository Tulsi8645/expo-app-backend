import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
    username:{type:String, required: true},
    email: {type:String, required: true, unique: true},
    profileImage:{type:String, default:""},
    password:{type:String, required: true, minlength: 6}, 
},
{
    timestamps: true
});

//hash the password before saving user to database
UserSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
//check if password is correct
UserSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

export default mongoose.model("User", UserSchema);