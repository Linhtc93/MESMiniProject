import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Product from '../src/models/Product.js';
import Operation from '../src/models/Operation.js';
import Employee from '../src/models/Employee.js';
import User from '../src/models/User.js';
import BOM from '../src/models/BOM.js';
import ProductionPlan from '../src/models/ProductionPlan.js';
import ProductionOutput from '../src/models/ProductionOutput.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manufacturing_erp';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: true });
  console.log('MongoDB connected for seeding');
}

async function clearAll() {
  await Promise.all([
    Product.deleteMany({}),
    Operation.deleteMany({}),
    Employee.deleteMany({}),
    User.deleteMany({}),
    BOM.deleteMany({}),
    ProductionPlan.deleteMany({}),
    ProductionOutput.deleteMany({}),
  ]);
  console.log('Cleared existing data');
}

function todayOnlyDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function seed() {
  // Products
  const products = await Product.insertMany([
    { product_code: 'NVL-001', product_name: 'Hạt nhựa A', category: 'NVL', uom: 'KG', supplier_name: 'NCC A', supplier_code: 'NCC-A', min_stock: 100 },
    { product_code: 'BTP-100', product_name: 'Vỏ nhựa Bán TP', category: 'BTP', uom: 'PCS' },
    { product_code: 'TP-900', product_name: 'Sản phẩm hoàn chỉnh', category: 'TP', uom: 'PCS', qty_per_box: 20 },
  ]);

  // Operations
  const operations = await Operation.insertMany([
    { operation_code: 'CD-01', operation_name: 'Ép nhựa', cycle_time_seconds: 30 },
    { operation_code: 'CD-02', operation_name: 'Lắp ráp', cycle_time_seconds: 45 },
  ]);

  // Employees
  await Employee.insertMany([
    { employee_code: 'EMP001', full_name: 'Nguyễn Văn A', email: 'a@example.com' },
    { employee_code: 'EMP002', full_name: 'Trần Thị B', email: 'b@example.com' },
  ]);

  // Users
  const password = await bcrypt.hash('admin123', 10);
  const password2 = await bcrypt.hash('planner123', 10);
  const password3 = await bcrypt.hash('operator123', 10);
  await User.insertMany([
    { username: 'admin', password_hash: password, roles: ['Admin'] },
    { username: 'planner', password_hash: password2, roles: ['Planner'] },
    { username: 'operator', password_hash: password3, roles: ['Operator'] },
  ]);

  // BOM: TP-900 được tạo từ BTP-100 (định mức 1), BTP-100 tạo từ NVL-001 (1.2 KG) tại CD-01
  await BOM.insertMany([
    { parent_product_code: 'TP-900', component_product_code: 'BTP-100', quantity_per: 1, operation_code: 'CD-02', scrap_rate: 0, effective_from: todayOnlyDate() },
    { parent_product_code: 'BTP-100', component_product_code: 'NVL-001', quantity_per: 1.2, operation_code: 'CD-01', scrap_rate: 2.5, effective_from: todayOnlyDate() },
  ]);

  // Production Plan for today: TP-900, qty 100
  const plan = await ProductionPlan.create({ product_code: 'TP-900', ship_date: todayOnlyDate(), plan_qty: 100, started: true, is_completed: false, created_by: 'seed' });

  // Some outputs (partial)
  await ProductionOutput.insertMany([
    { plan_id: plan._id, product_code: 'TP-900', product_name: 'Sản phẩm hoàn chỉnh', quantity: 20, production_date: todayOnlyDate(), operation_code: 'CD-02', created_by: 'seed' },
    { plan_id: plan._id, product_code: 'TP-900', product_name: 'Sản phẩm hoàn chỉnh', quantity: 30, production_date: todayOnlyDate(), operation_code: 'CD-02', created_by: 'seed' },
  ]);

  console.log('Seed data completed');
}

(async () => {
  try {
    await connect();
    await clearAll();
    await seed();
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
