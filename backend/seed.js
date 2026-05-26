/**
 * seed.js — Wipe DB and seed Google, Amazon, Microsoft companies
 * Run: node seed.js  (from the backend folder)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const User    = require('./models/User');
const Company = require('./models/Company');
const Task    = require('./models/Task');

const MONGO_URI = process.env.MONGO_URI;

// ── Credential definitions ─────────────────────────────────────────────────
const SUPER_ADMIN = {
  name:     'Super Admin',
  email:    'superadmin@test.com',
  password: 'Admin@123',
  role:     'super_admin',
};

const COMPANIES = [
  {
    name:         'Google',
    domain:       'google.onboard',
    primaryColor: '#4285F4',
    logo:         'https://www.gstatic.com/images/branding/googleg/2x/googleg_standard_color_128dp.png',
    admin: { name: 'Google HR Manager', email: 'admin@google.onboard', password: 'Google@123' },
    interns: [
      { name: 'Alice Johnson', email: 'alice@google.onboard', password: 'Intern@123' },
      { name: 'Bob Williams',  email: 'bob@google.onboard',   password: 'Intern@123' },
    ],
  },
  {
    name:         'Amazon',
    domain:       'amazon.onboard',
    primaryColor: '#FF9900',
    logo:         'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    admin: { name: 'Amazon HR Manager', email: 'admin@amazon.onboard', password: 'Amazon@123' },
    interns: [
      { name: 'Charlie Brown', email: 'charlie@amazon.onboard', password: 'Intern@123' },
      { name: 'Diana Prince',  email: 'diana@amazon.onboard',   password: 'Intern@123' },
    ],
  },
  {
    name:         'Microsoft',
    domain:       'microsoft.onboard',
    primaryColor: '#00A4EF',
    logo:         'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    admin: { name: 'Microsoft HR Manager', email: 'admin@microsoft.onboard', password: 'Microsoft@123' },
    interns: [
      { name: 'Ethan Hunt',  email: 'ethan@microsoft.onboard', password: 'Intern@123' },
      { name: 'Fiona Green', email: 'fiona@microsoft.onboard', password: 'Intern@123' },
    ],
  },
];

const DEFAULT_TASKS = [
  { title: 'Submit ID Proof',               description: 'Upload Aadhaar or Passport',         requiresProof: true  },
  { title: 'Complete Orientation',           description: 'Watch company onboarding video',      requiresProof: false },
  { title: 'Setup Development Environment',  description: 'Install required tools and software', requiresProof: false },
];

async function hash(pw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

async function seed() {
  console.log('\n🔌  Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected\n');

  // ── 1. WIPE ───────────────────────────────────────────────────────────────
  console.log('🗑️   Wiping existing data…');
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Task.deleteMany({}),
  ]);
  console.log('    Users, Companies, Tasks cleared.\n');

  // ── 2. SUPER ADMIN ────────────────────────────────────────────────────────
  const superAdmin = await User.create({
    name:     SUPER_ADMIN.name,
    email:    SUPER_ADMIN.email,
    password: await hash(SUPER_ADMIN.password),
    role:     'super_admin',
    mustChangePassword: false,
  });
  console.log(`👑  Super Admin created: ${superAdmin.email}`);

  // ── 3. COMPANIES + USERS + TASKS ──────────────────────────────────────────
  for (const co of COMPANIES) {
    console.log(`\n🏢  Creating company: ${co.name}`);

    const company = await Company.create({
      name:         co.name,
      domain:       co.domain,
      primaryColor: co.primaryColor,
      logo:         co.logo,
      createdBy:    superAdmin._id,
    });

    // Admin
    const adminUser = await User.create({
      name:               co.admin.name,
      email:              co.admin.email,
      password:           await hash(co.admin.password),
      role:               'admin',
      companyId:          company._id,
      mustChangePassword: false,
    });
    console.log(`   👤  Admin:    ${adminUser.email}`);

    // Interns
    const internUsers = [];
    for (const i of co.interns) {
      const intern = await User.create({
        name:               i.name,
        email:              i.email,
        password:           await hash(i.password),
        role:               'intern',
        companyId:          company._id,
        mustChangePassword: false,
      });
      internUsers.push(intern);
      console.log(`   🎓  Intern:   ${intern.email}`);
    }

    // Default tasks per intern
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    for (const intern of internUsers) {
      const tasks = DEFAULT_TASKS.map((t) => ({
        title:          t.title,
        description:    t.description,
        taskType:       'admin',
        requiresProof:  t.requiresProof,
        companyId:      company._id,
        createdBy:      adminUser._id,
        deadline,
        assignments:    [{ user: intern._id, status: 'pending' }],
        totalAssigned:  1,
        completedCount: 0,
      }));
      await Task.insertMany(tasks);
    }
    console.log(`   📋  ${DEFAULT_TASKS.length * internUsers.length} tasks seeded for ${co.name}`);
  }

  // ── 4. SUMMARY ────────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  SEEDING COMPLETE — ALL CREDENTIALS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('👑  SUPER ADMIN');
  console.log(`    Email:    ${SUPER_ADMIN.email}`);
  console.log(`    Password: ${SUPER_ADMIN.password}\n`);

  for (const co of COMPANIES) {
    console.log(`🏢  ${co.name.toUpperCase()}  (${co.primaryColor})`);
    console.log(`    Admin ──`);
    console.log(`      Email:    ${co.admin.email}`);
    console.log(`      Password: ${co.admin.password}`);
    console.log(`    Interns ──`);
    for (const i of co.interns) {
      console.log(`      ${i.name.padEnd(18)} ${i.email.padEnd(35)} Password: ${i.password}`);
    }
    console.log('');
  }
  console.log('═══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Done! ✅\n');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
