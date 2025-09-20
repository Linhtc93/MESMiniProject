import mongoose from 'mongoose';

const ProductionOutputSchema = new mongoose.Schema(
  {
    plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionPlan', required: true, index: true },
    product_code: { type: String, required: true, index: true },
    product_name: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    production_date: { type: Date, default: () => new Date(), index: true },
    operation_code: { type: String },
    created_by: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.model('ProductionOutput', ProductionOutputSchema);
