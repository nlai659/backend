import mongoose from 'mongoose';
import validator from 'validator';
import Schema from "mongoose"; 

const scaleSchema = new mongoose.Schema({
    scaleRef: {
        type: String,
        required: true,
    },
    isReserved: {
        type: Boolean,
        default: false, 
    }, 
    centreId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Centre' 
    },
    isReservedBy: {
        type: String, 
    }
},{
    timestamps: {}
});

export const Scale = mongoose.model('Scale', scaleSchema);

export default Scale;
