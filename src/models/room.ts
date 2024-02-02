import mongoose, { Document, Schema, model, Types } from 'mongoose';
import RoomDetailModel from './roomDetail';
import Location from './location';


// Define interface for room
interface Room extends Document {
  roomName: string;
  location_id: mongoose.Types.ObjectId;
  detail: mongoose.Types.ObjectId; 
  flag: string
}

// Create a Mongoose schema for Room
const roomSchema = new Schema<Room>({
  roomName: { type: String, required: true },
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: Location, required: true },
  detail: {type: mongoose.Schema.Types.ObjectId, ref: RoomDetailModel, required: true },
  flag: {type: String, default: 'PRESENT'}
});

// Create a Mongoose model for Room
const RoomModel = model<Room>('Room', roomSchema);

export default RoomModel;
