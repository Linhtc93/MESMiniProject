import mongoose from 'mongoose';

const ProductionPlanSchema = new mongoose.Schema(
  {
    product_code: { type: String, required: true, index: true },
    ship_date: { type: Date, required: true, index: true },
    plan_qty: { type: Number, required: true, min: 0 },
    started: { type: Boolean, default: false },
    is_completed: { type: Boolean, default: false },
    created_by: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: String },
    updated_at: { type: Date },
    deleted_by: { type: String },
    deleted_at: { type: Date },
    is_deleted: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: false }
);

ProductionPlanSchema.index({ product_code: 1, ship_date: 1 }, { unique: true });

export default mongoose.model('ProductionPlan', ProductionPlanSchema);
