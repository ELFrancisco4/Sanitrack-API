import mongoose, { Document, Schema } from 'mongoose';

interface Location extends Document {
    country: string;
    state: string;
    city: string;
    postal_code: string
}

const locationSchema = new Schema({
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: {type: String, require: true}, 
    postal_code: {type: String, default: 'empty'}
});

const Location = mongoose.model<Location>('Location', locationSchema);

export default Location;