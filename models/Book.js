import mongoose from "mongoose";

const BookSchema = new mongoose.Schema({
    title:{type:String, required: true},
    author:{type:String},
    caption: {type:String, required: true},
    image:{type:String, required: true},
    rating:{type:Number, required: true, min: 1, max: 5},
    user:{type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}, 
},
{
    timestamps: true
});

export default mongoose.model("Book", BookSchema);
