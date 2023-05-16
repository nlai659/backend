import mongoose from 'mongoose';
import Schema from "mongoose";

const centreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    dogs: [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Dog' 
        }
    ], 
    scales: [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Scale' 
        }
    ],

},{
    timestamps: {}
});

export const Centre = mongoose.model('Centre', centreSchema);

export default Centre;
