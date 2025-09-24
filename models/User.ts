import mongoose, { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

export interface Iuser {
    email: string;
    password: string;
    _id?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema = new Schema<Iuser>(
    {
        email: { 
            type: String, 
            required: true, 
            unique: true,
            lowercase: true,
            trim: true
        },
        password: { 
            type: String, 
            required: true,
            minlength: 6
        }
    },
    {
        timestamps: true
    }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) return next();
    
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = models?.User || model<Iuser>("User", userSchema);

export default User;