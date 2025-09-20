import mongoose from 'mongoose';

const OperationSchema = new mongoose.Schema(
  {
    operation_code: { type: String, required: true, unique: true, index: true },
    operation_name: { type: String, required: true },
    cycle_time_seconds: { type: Number, default: 0 },
    created_by: { type: String },
    updated_by: { type: String },
    updated_at: { type: Date },
    is_deleted: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export default mongoose.model('Operation', OperationSchema);
