import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    roles: { type: [String], default: ['Viewer'] }, // Admin, Planner, Operator, Viewer
    employee_code: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('User', UserSchema);
