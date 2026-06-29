const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('=== Gusto Meets Admin SQL Generator ===\n');
  
  const employeeId = (await ask('Employee ID (e.g. ADM-001): ')) || 'ADM-001';
  const fullName = (await ask('Full Name (e.g. Adithya): ')) || 'Adithya';
  const email = (await ask('Email (e.g. narayanadithya462@gmail.com): ')) || 'narayanadithya462@gmail.com';
  const dob = (await ask('Date of Birth (YYYY-MM-DD): ')) || '2002-11-04';
  
  let roleInput = await ask('Role (SUPER_ADMIN or ADMIN) [SUPER_ADMIN]: ');
  roleInput = roleInput.trim().toUpperCase().replace(/[-\s]+/g, '_');
  const role = roleInput || 'SUPER_ADMIN';
  
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    console.log(`Warning: Role was set to "${role}". Only "SUPER_ADMIN" or "ADMIN" are typically allowed by the system schema.`);
  }

  console.log('\nEnter a password for this admin. A secure hash will be generated automatically.');
  const password = await ask('Password: ');
  
  if (!password) {
    console.log('Error: Password is required to generate a hash!');
    rl.close();
    return;
  }
  
  console.log('\nHashing password...');
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(password, salt);
  
  const sql = `
-- 1. First, delete any existing admin user matching this email or employee ID
-- to avoid violating the unique constraint on email ('admin_users_email_key') 
-- or employee_id ('admin_users_pkey').
DELETE FROM public.admin_users 
WHERE email = '${email}' OR employee_id = '${employeeId}';

-- 2. Insert the fresh admin user record with reset lockout and failed attempts
INSERT INTO public.admin_users (
  employee_id, 
  full_name, 
  email, 
  password_hash, 
  role, 
  date_of_birth, 
  failed_login_count, 
  locked_until
)
VALUES (
  '${employeeId}', 
  '${fullName}', 
  '${email}', 
  '${hash}', 
  '${role}', 
  '${dob}', 
  0, 
  NULL
);
`;
  
  console.log('\n=================== GENERATED SQL ===================');
  console.log(sql);
  console.log('=====================================================');
  console.log('\nCopy and run the SQL query above in your Supabase SQL editor to create/update the admin user.');
  
  rl.close();
}

main().catch(err => {
  console.error(err);
  rl.close();
});
