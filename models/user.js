import mongoose from 'mongoose';
import validator from 'validator';
// import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true, // cant have multiple users with the same email in the system 
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid.");
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error("Age must be a positive number.");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validator(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error("Password cannot contain 'password'.");
            }
        }
    },
    userType: {
        type: String,
        default: 'Volunteer',
        enum: ['Admin','Volunteer',  'Vet']
    },
    phoneNumber: {
        type: Number,
        validate(value) {
            if (value.toString().length < 9 || value.toString().length > 11) {
                throw new Error("Phone Number is invalid.");
            }
        }
    },
    centre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Centre'
    }

}, {
    timestamps: {}
});

export const User = mongoose.model('User', userSchema);

