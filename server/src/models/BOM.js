import mongoose from 'mongoose';

const BOMSchema = new mongoose.Schema(
  {
    parent_product_code: { type: String, required: true, index: true },
    component_product_code: { type: String, required: true, index: true },
    quantity_per: { type: Number, required: true },
    operation_code: { type: String },
    scrap_rate: { type: Number, default: 0 }, // %
    effective_from: { type: Date, required: true },
    effective_to: { type: Date },
    created_by: { type: String },
    updated_by: { type: String },
    updated_at: { type: Date },
    is_deleted: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

BOMSchema.index({ parent_product_code: 1, component_product_code: 1, operation_code: 1, effective_from: 1 }, { unique: true });

export default mongoose.model('BOM', BOMSchema);
