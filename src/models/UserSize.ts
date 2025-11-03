import mongoose from 'mongoose';

const UserSizeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    default: 'general'
  },
  measurements: {
    chest: {
      type: String,
      required: true
    },
    length: {
      type: String,
      required: true
    },
    shoulders: {
      type: String,
      required: true,
      default: ''
    },
    sleeves: {
      type: String,
      required: true,
      default: ''
    },
    neck: {
      type: String,
      required: true,
      default: ''
    },
    waist: {
      type: String,
      required: true,
      default: ''
    },
    backPleatLength: {
      type: String,
      required: true,
      default: ''
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient user queries
UserSizeSchema.index({ userId: 1 });

const UserSize = mongoose.models.UserSize || mongoose.model('UserSize', UserSizeSchema);

export default UserSize;