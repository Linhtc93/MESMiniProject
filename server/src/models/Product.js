import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    product_code: { type: String, required: true, unique: true, index: true }, // Mã NVL (khóa chính nghiệp vụ)
    product_name: { type: String, required: true }, // Tên NVL
    uom: { type: String }, // Đơn vị tính
    category: { type: String, enum: ['NVL', 'BTP', 'TP'], required: true }, // Phân loại
    initial_warehouse_code: { type: String },
    supplier_name: { type: String },
    supplier_code: { type: String, index: true },
    min_stock: { type: Number, default: 0 },
    qty_per_box: { type: Number, default: 1 },
    created_by: { type: String },
    updated_by: { type: String },
    updated_at: { type: Date },
    is_deleted: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export default mongoose.model('Product', ProductSchema);
