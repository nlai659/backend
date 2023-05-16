import mongoose from 'mongoose'; 

const dogSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    }, 
    isBeingWeighed: {
        type: Boolean,
        default: false, 
    },
    description: {
        type: String,
        required: true,
    },
    imageName: {
        type: String,
        required: false// so that image can be fetched from the public folder of the backend, using this name
    },
    weights: [{
        timestamp: Date,
        weight: Number
    },]
},{
    timestamps: {}
});

export const Dog = mongoose.model('Dog', dogSchema);

