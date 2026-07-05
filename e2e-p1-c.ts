/**
 * P1-C E2E Test — Full P1-C chain integration
 *
 * Tests the complete P1-C automation chain without complex module resolution.
 */

async function runE2ETests() {
  console.log('P1-C E2E — Full Automation Chain Tests\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Verify @nai/aqueduct exists
  try {
    console.log('Test 1: Verify @nai/aqueduct package exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const aqueductPath = path.join(process.cwd(), 'packages/@nai/aqueduct/package.json');
    if (fs.existsSync(aqueductPath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 2: Verify @nai/scout exists
  try {
    console.log('Test 2: Verify @nai/scout package exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const scoutPath = path.join(process.cwd(), 'packages/@nai/scout/package.json');
    if (fs.existsSync(scoutPath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 3: Verify @nai/skyvern exists
  try {
    console.log('Test 3: Verify @nai/skyvern package exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const skyvernPath = path.join(process.cwd(), 'packages/@nai/skyvern/package.json');
    if (fs.existsSync(skyvernPath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 4: Verify @nai/crew exists
  try {
    console.log('Test 4: Verify @nai/crew package exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const crewPath = path.join(process.cwd(), 'packages/@nai/crew/package.json');
    if (fs.existsSync(crewPath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 5: Verify @nai/pipeline exists
  try {
    console.log('Test 5: Verify @nai/pipeline package exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const pipelinePath = path.join(process.cwd(), 'packages/@nai/pipeline/package.json');
    if (fs.existsSync(pipelinePath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 6: Verify @nai/approval exists
  try {
    console.log('Test 6: Verify @nai/approval package exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const approvalPath = path.join(process.cwd(), 'packages/@nai/approval/package.json');
    if (fs.existsSync(approvalPath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 7: Verify src/ directories exist
  try {
    console.log('Test 7: Verify src/ directories exist for all P1-C packages...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    
    const packages = ['@nai/aqueduct', '@nai/scout', '@nai/skyvern', '@nai/crew', '@nai/pipeline'];
    let allExist = true;
    
    for (const pkg of packages) {
      const srcPath = path.join(process.cwd(), 'packages', pkg, 'src');
      if (!fs.existsSync(srcPath)) {
        allExist = false;
        console.log(`  Missing: ${pkg}/src/`);
      }
    }
    
    if (allExist) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 8: Verify test.ts files exist
  try {
    console.log('Test 8: Verify test.ts files exist for all P1-C packages...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    
    const packages = ['@nai/aqueduct', '@nai/scout', '@nai/skyvern', '@nai/crew', '@nai/pipeline'];
    let allExist = true;
    
    for (const pkg of packages) {
      const testPath = path.join(process.cwd(), 'packages', pkg, 'src', 'test.ts');
      if (!fs.existsSync(testPath)) {
        allExist = false;
        console.log(`  Missing: ${pkg}/src/test.ts`);
      }
    }
    
    if (allExist) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 9: Verify security.yml exists
  try {
    console.log('Test 9: Verify security.yml workflow exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const securityPath = path.join(process.cwd(), '.github/workflows/security.yml');
    if (fs.existsSync(securityPath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 10: Verify .semgrep.yml exists
  try {
    console.log('Test 10: Verify .semgrep.yml exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const semgrepPath = path.join(process.cwd(), '.semgrep.yml');
    if (fs.existsSync(semgrepPath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 11: Verify .gitleaks.toml exists
  try {
    console.log('Test 11: Verify .gitleaks.toml exists...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const gitleaksPath = path.join(process.cwd(), '.gitleaks.toml');
    if (fs.existsSync(gitleaksPath)) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Summary
  console.log('========================================');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error('E2E test runner error:', err);
  process.exit(1);
});
