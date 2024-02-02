import mongoose, { Document, Schema } from 'mongoose';
import Address from './address';

interface User extends Document {
    username: string;
    password: string;
    email: string; 
    address_id: mongoose.Types.ObjectId;
    phone_number: string;
    flag: string;
}

const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true, select: false },
    email: {type: String, require: true}, 
    address_id: {type: mongoose.Types.ObjectId, ref: Address, require:true}, 
    phone_number: {type: String, require: true},
    flag: {type: String, default: 'ACTIVE'}
});

const User = mongoose.model<User>('User', userSchema);

export default User;