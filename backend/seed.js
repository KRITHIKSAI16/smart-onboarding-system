/**
 * seed.js — Wipe DB and seed companies with cohorts
 * Run: node seed.js  (from the backend folder)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const User         = require('./models/User');
const Company      = require('./models/Company');
const Task         = require('./models/Task');
const Cohort       = require('./models/Cohort');
const Conversation = require('./models/Conversation');
const Message      = require('./models/Message');
const ForumPost    = require('./models/ForumPost');
const ForumComment = require('./models/ForumComment');

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
    cohorts: [
      { name: 'Batch 2025-A', description: 'Summer 2025 cohort' },
      { name: 'Batch 2025-B', description: 'Winter 2025 cohort' },
    ],
    interns: [
      { name: 'Alice Johnson', email: 'alice@google.onboard', password: 'Intern@123', cohortIndex: 0 },
      { name: 'Bob Williams',  email: 'bob@google.onboard',   password: 'Intern@123', cohortIndex: 0 },
      { name: 'Carol Davis',   email: 'carol@google.onboard', password: 'Intern@123', cohortIndex: 1 },
    ],
  },
  {
    name:         'Amazon',
    domain:       'amazon.onboard',
    primaryColor: '#FF9900',
    logo:         'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    admin: { name: 'Amazon HR Manager', email: 'admin@amazon.onboard', password: 'Amazon@123' },
    cohorts: [
      { name: 'Cohort Spring 25', description: 'Spring internship batch' },
    ],
    interns: [
      { name: 'Charlie Brown', email: 'charlie@amazon.onboard', password: 'Intern@123', cohortIndex: 0 },
      { name: 'Diana Prince',  email: 'diana@amazon.onboard',   password: 'Intern@123', cohortIndex: 0 },
    ],
  },
  {
    name:         'Microsoft',
    domain:       'microsoft.onboard',
    primaryColor: '#00A4EF',
    logo:         'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    admin: { name: 'Microsoft HR Manager', email: 'admin@microsoft.onboard', password: 'Microsoft@123' },
    cohorts: [
      { name: 'Wave 1 - 2025', description: 'First wave of 2025 interns' },
    ],
    interns: [
      { name: 'Ethan Hunt',  email: 'ethan@microsoft.onboard', password: 'Intern@123', cohortIndex: 0 },
      { name: 'Fiona Green', email: 'fiona@microsoft.onboard', password: 'Intern@123', cohortIndex: 0 },
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
  console.log('\n  Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('  Connected\n');

  // ── 1. WIPE ───────────────────────────────────────────────────────────────
  console.log('  Wiping existing data...');
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Task.deleteMany({}),
    Cohort.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    ForumPost.deleteMany({}),
    ForumComment.deleteMany({}),
  ]);
  console.log('  All collections cleared.\n');

  // ── 2. SUPER ADMIN ────────────────────────────────────────────────────────
  const superAdmin = await User.create({
    name:     SUPER_ADMIN.name,
    email:    SUPER_ADMIN.email,
    password: await hash(SUPER_ADMIN.password),
    role:     'super_admin',
    mustChangePassword: false,
  });
  console.log(`  Super Admin created: ${superAdmin.email}`);

  // ── 3. COMPANIES + COHORTS + USERS + TASKS ────────────────────────────────
  for (const co of COMPANIES) {
    console.log(`\n  Creating company: ${co.name}`);

    const company = await Company.create({
      name:         co.name,
      domain:       co.domain,
      primaryColor: co.primaryColor,
      logo:         co.logo,
      createdBy:    superAdmin._id,
    });

    // Create cohorts
    const cohortDocs = [];
    for (const ch of co.cohorts) {
      const cohort = await Cohort.create({
        name:        ch.name,
        description: ch.description,
        companyId:   company._id,
      });
      cohortDocs.push(cohort);
      console.log(`    Cohort: ${cohort.name}`);
    }

    // Admin
    const adminUser = await User.create({
      name:               co.admin.name,
      email:              co.admin.email,
      password:           await hash(co.admin.password),
      role:               'admin',
      companyId:          company._id,
      mustChangePassword: false,
    });
    console.log(`    Admin:    ${adminUser.email}`);

    // Interns
    const internUsers = [];
    for (const i of co.interns) {
      const cohortId = cohortDocs[i.cohortIndex]?._id || undefined;
      const intern = await User.create({
        name:               i.name,
        email:              i.email,
        password:           await hash(i.password),
        role:               'intern',
        companyId:          company._id,
        cohortId,
        mustChangePassword: false,
      });
      internUsers.push(intern);
      console.log(`    Intern:   ${intern.email}  (${cohortDocs[i.cohortIndex]?.name || 'no cohort'})`);
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
    console.log(`    ${DEFAULT_TASKS.length * internUsers.length} tasks seeded for ${co.name}`);
  }

  // ── 4. SUMMARY ────────────────────────────────────────────────────────────
  console.log('\n\n===================================================');
  console.log('  SEEDING COMPLETE — ALL CREDENTIALS');
  console.log('===================================================\n');

  console.log('  SUPER ADMIN');
  console.log(`    Email:    ${SUPER_ADMIN.email}`);
  console.log(`    Password: ${SUPER_ADMIN.password}\n`);

  for (const co of COMPANIES) {
    console.log(`  ${co.name.toUpperCase()}  (${co.primaryColor})`);
    console.log(`    Admin --`);
    console.log(`      Email:    ${co.admin.email}`);
    console.log(`      Password: ${co.admin.password}`);
    console.log(`    Cohorts: ${co.cohorts.map(c => c.name).join(', ')}`);
    console.log(`    Interns --`);
    for (const i of co.interns) {
      console.log(`      ${i.name.padEnd(18)} ${i.email.padEnd(35)} Password: ${i.password}`);
    }
    console.log('');
  }
  console.log('===================================================\n');

  await mongoose.disconnect();
  console.log('  Disconnected. Done!\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
