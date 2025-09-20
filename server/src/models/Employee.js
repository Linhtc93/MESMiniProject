import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema(
  {
    employee_code: { type: String, required: true, unique: true, index: true },
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    created_by: { type: String },
    updated_by: { type: String },
    updated_at: { type: Date },
    is_deleted: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export default mongoose.model('Employee', EmployeeSchema);
