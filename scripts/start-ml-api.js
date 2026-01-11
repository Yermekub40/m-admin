/**
 * ML API-ны іске қосатын Node.js скрипт
 * Cross-platform (Windows, Linux, Mac)
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const mlDir = path.join(__dirname, '..', 'ml');
const isWindows = os.platform() === 'win32';
const ML_API_PORT = process.env.ML_API_PORT || 5000;

console.log('========================================');
console.log('ML API Сервисін іске қосу');
console.log('========================================\n');

// 5000 портындағы ескі процестерді өлтіру
function killPortProcesses(port) {
  return new Promise((resolve) => {
    console.log(`[ML API] ${port} портындағы процестерді тексеру...`);
    
    if (isWindows) {
      // Windows үшін
      const netstat = spawn('netstat', ['-ano'], { shell: true });
      let output = '';
      
      netstat.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      netstat.on('close', () => {
        const lines = output.split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          if (line.includes(`:${port}`) && line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              pids.add(pid);
            }
          }
        });
        
        if (pids.size === 0) {
          console.log(`[ML API] ✅ ${port} порты бос`);
          resolve();
          return;
        }
        
        console.log(`[ML API] ⚠️  ${pids.size} процес(тер) табылды, өлтіру...`);
        
        let killed = 0;
        pids.forEach(pid => {
          const taskkill = spawn('taskkill', ['/PID', pid, '/F'], { shell: true });
          taskkill.on('close', (code) => {
            if (code === 0) {
              console.log(`[ML API] ✅ Процес ${pid} өлтірілді`);
            }
            killed++;
            if (killed === pids.size) {
              console.log(`[ML API] ✅ Барлық процестер өлтірілді\n`);
              resolve();
            }
          });
          taskkill.on('error', () => {
            killed++;
            if (killed === pids.size) {
              resolve();
            }
          });
        });
      });
      
      netstat.on('error', () => {
        console.log(`[ML API] ⚠️  Портты тексеру қатесі, жалғастырамыз...\n`);
        resolve();
      });
    } else {
      // Linux/Mac үшін
      const lsof = spawn('lsof', ['-ti', `:${port}`], { shell: false });
      let output = '';
      
      lsof.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      lsof.on('close', (code) => {
        if (code !== 0 || !output.trim()) {
          console.log(`[ML API] ✅ ${port} порты бос\n`);
          resolve();
          return;
        }
        
        const pids = output.trim().split('\n').filter(pid => pid && !isNaN(pid));
        
        if (pids.length === 0) {
          console.log(`[ML API] ✅ ${port} порты бос\n`);
          resolve();
          return;
        }
        
        console.log(`[ML API] ⚠️  ${pids.length} процес(тер) табылды, өлтіру...`);
        
        // fuser -k арқылы өлтіру (егер бар болса)
        const fuser = spawn('fuser', ['-k', `${port}/tcp`], { shell: false });
        
        fuser.on('close', (code) => {
          if (code === 0) {
            console.log(`[ML API] ✅ Барлық процестер өлтірілді\n`);
          } else {
            // fuser жоқ болса, kill арқылы өлтіру
            let killed = 0;
            pids.forEach(pid => {
              const kill = spawn('kill', ['-9', pid], { shell: false });
              kill.on('close', () => {
                console.log(`[ML API] ✅ Процес ${pid} өлтірілді`);
                killed++;
                if (killed === pids.length) {
                  console.log(`[ML API] ✅ Барлық процестер өлтірілді\n`);
                  resolve();
                }
              });
              kill.on('error', () => {
                killed++;
                if (killed === pids.length) {
                  resolve();
                }
              });
            });
            return;
          }
          resolve();
        });
        
        fuser.on('error', () => {
          // fuser жоқ болса, kill арқылы өлтіру
          let killed = 0;
          pids.forEach(pid => {
            const kill = spawn('kill', ['-9', pid], { shell: false });
            kill.on('close', () => {
              console.log(`[ML API] ✅ Процес ${pid} өлтірілді`);
              killed++;
              if (killed === pids.length) {
                console.log(`[ML API] ✅ Барлық процестер өлтірілді\n`);
                resolve();
              }
            });
            kill.on('error', () => {
              killed++;
              if (killed === pids.length) {
                resolve();
              }
            });
          });
        });
      });
      
      lsof.on('error', () => {
        console.log(`[ML API] ⚠️  Портты тексеру қатесі, жалғастырамыз...\n`);
        resolve();
      });
    }
  });
}

// Python бар ма тексеру
function checkPython() {
  return new Promise((resolve, reject) => {
    const pythonCmd = isWindows ? 'python' : 'python3';
    const check = spawn(pythonCmd, ['--version']);
    
    check.on('close', (code) => {
      if (code === 0) {
        resolve(pythonCmd);
      } else {
        reject(new Error(`${pythonCmd} табылмады`));
      }
    });
    
    check.on('error', (err) => {
      reject(new Error(`Python орнатылмаған: ${err.message}`));
    });
  });
}

// Виртуаль ортаны тексеру және құру
function setupVenv(pythonCmd) {
  return new Promise((resolve, reject) => {
    const venvPath = path.join(mlDir, 'venv');
    
    if (fs.existsSync(venvPath)) {
      console.log('[ML API] ✅ Виртуаль орта бар');
      resolve();
      return;
    }
    
    console.log('[ML API] Виртуаль орта жоқ, құрылуда...');
    const venv = spawn(pythonCmd, ['-m', 'venv', 'venv'], {
      cwd: mlDir,
      stdio: 'inherit'
    });
    
    venv.on('close', (code) => {
      if (code === 0) {
        console.log('[ML API] ✅ Виртуаль орта құрылды');
        resolve();
      } else {
        reject(new Error('Виртуаль орта құру қатесі'));
      }
    });
    
    venv.on('error', (err) => {
      reject(new Error(`Виртуаль орта құру қатесі: ${err.message}`));
    });
  });
}

// Пакеттерді орнату
function installPackages() {
  return new Promise((resolve, reject) => {
    const venvPython = isWindows 
      ? path.join(mlDir, 'venv', 'Scripts', 'python.exe')
      : path.join(mlDir, 'venv', 'bin', 'python');
    
    console.log('[ML API] Пакеттерді тексеру...');
    
    const pip = spawn(venvPython, ['-m', 'pip', 'install', '-q', '-r', 'requirements.txt'], {
      cwd: mlDir,
      stdio: 'inherit'
    });
    
    pip.on('close', (code) => {
      if (code === 0) {
        console.log('[ML API] ✅ Пакеттер дайын');
        resolve(venvPython);
      } else {
        reject(new Error('Пакеттерді орнату қатесі'));
      }
    });
    
    pip.on('error', (err) => {
      reject(new Error(`Пакеттерді орнату қатесі: ${err.message}`));
    });
  });
}

// ML API-ны іске қосу (виртуаль ортасыз - тікелей Python)
function startMLAPIDirect(pythonCmd) {
  console.log('\n========================================');
  console.log('ML API іске қосылуда (тікелей Python)...');
  console.log('URL: http://localhost:5000');
  console.log('========================================\n');
  
  const apiPath = path.join(mlDir, 'api.py');
  const api = spawn(pythonCmd, [apiPath], {
    cwd: mlDir,
    stdio: 'inherit',
    shell: false, // shell: false - security үшін
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });
  
  api.on('close', (code) => {
    console.log(`\n[ML API] Сервер тоқтатылды (код: ${code})`);
    process.exit(code);
  });
  
  api.on('error', (err) => {
    console.error(`\n[ML API] ҚАТЕ: ${err.message}`);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[ML API] Тоқтату сигналы алынды...');
    api.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n[ML API] Тоқтату сигналы алынды...');
    api.kill();
    process.exit(0);
  });
  
  return api;
}

// ML API-ны іске қосу (виртуаль ортамен)
function startMLAPI(pythonPath) {
  console.log('\n========================================');
  console.log('ML API іске қосылуда (виртуаль орта)...');
  console.log('URL: http://localhost:5000');
  console.log('========================================\n');
  
  const apiPath = path.join(mlDir, 'api.py');
  const api = spawn(pythonPath, [apiPath], {
    cwd: mlDir,
    stdio: 'inherit',
    shell: false, // shell: false - security үшін
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });
  
  api.on('close', (code) => {
    console.log(`\n[ML API] Сервер тоқтатылды (код: ${code})`);
    process.exit(code);
  });
  
  api.on('error', (err) => {
    console.error(`\n[ML API] ҚАТЕ: ${err.message}`);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[ML API] Тоқтату сигналы алынды...');
    api.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n[ML API] Тоқтату сигналы алынды...');
    api.kill();
    process.exit(0);
  });
}

// Пакеттерді тікелей орнату (виртуаль ортасыз)
function installPackagesDirect(pythonCmd) {
  return new Promise((resolve, reject) => {
    const requirementsPath = path.join(mlDir, 'requirements.txt');
    
    if (!fs.existsSync(requirementsPath)) {
      reject(new Error('requirements.txt табылмады'));
      return;
    }
    
    console.log('[ML API] pip-ті жаңарту...');
    
    // Алдымен pip-ті жаңарту
    const pipUpgrade = spawn(pythonCmd, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'], {
      cwd: mlDir,
      stdio: 'inherit',
      shell: false
    });
    
      // Негізгі пакеттерді бір-бір орнату (қателерді өңдеу үшін)
      const essentialPackages = [
        'flask',
        'flask-cors',
        'numpy',
        'pandas',
        'scikit-learn',
        'scipy',
        'joblib',
        'matplotlib' // feature_importance үшін қажет
      ];
    
    let installIndex = 0;
    let installedCount = 0;
    
    function installNext() {
      if (installIndex >= essentialPackages.length) {
        // Негізгі пакеттер орнатылды
        console.log(`[ML API] ✅ ${installedCount}/${essentialPackages.length} негізгі пакеттер орнатылды\n`);
        resolve();
        return;
      }
      
      const packageName = essentialPackages[installIndex];
      console.log(`[ML API] ${packageName} орнатылуда...`);
      
      const pip = spawn(pythonCmd, ['-m', 'pip', 'install', '--upgrade', packageName], {
        cwd: mlDir,
        stdio: 'pipe', // 'inherit' орнына 'pipe' - қателерді көрсетпеу үшін
        shell: false
      });
      
      let output = '';
      pip.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pip.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      pip.on('close', (code) => {
        if (code === 0) {
          console.log(`[ML API] ✅ ${packageName} орнатылды`);
          installedCount++;
        } else {
          console.log(`[ML API] ⚠️  ${packageName} орнату қатесі (код: ${code})`);
          // Қате болса да жалғастырамыз
        }
        installIndex++;
        installNext();
      });
      
      pip.on('error', (err) => {
        console.log(`[ML API] ⚠️  ${packageName} орнату қатесі: ${err.message}`);
        installIndex++;
        installNext();
      });
    }
    
    pipUpgrade.on('close', (code) => {
      if (code !== 0) {
        console.log('[ML API] ⚠️  pip жаңарту қатесі, бірақ жалғастырамыз...');
      }
      
      console.log('[ML API] Пакеттерді орнату/тексеру...');
      installNext();
    });
    
    pipUpgrade.on('error', (err) => {
      console.log(`[ML API] ⚠️  pip жаңарту қатесі: ${err.message}, бірақ жалғастырамыз...`);
      console.log('[ML API] Пакеттерді орнату/тексеру...');
      installNext();
    });
  });
}

// Негізгі функция
async function main() {
  try {
    // Алдымен 5000 портындағы ескі процестерді өлтіру
    await killPortProcesses(ML_API_PORT);
    
    const pythonCmd = await checkPython();
    console.log(`[ML API] ✅ Python табылды: ${pythonCmd}\n`);
    
    // Виртуаль орта бар ма тексеру
    const venvPath = path.join(mlDir, 'venv');
    const venvPython = isWindows 
      ? path.join(mlDir, 'venv', 'Scripts', 'python.exe')
      : path.join(mlDir, 'venv', 'bin', 'python');
    
    const venvExists = fs.existsSync(venvPath) && fs.existsSync(venvPython);
    
    if (venvExists) {
      console.log('[ML API] ✅ Виртуаль орта табылды, пайдаланылуда...\n');
      
      // Виртуаль ортада пакеттерді тексеру/орнату
      try {
        await installPackages();
        console.log('[ML API] ML API іске қосылуда (виртуаль орта)...\n');
        startMLAPI(venvPython);
      } catch (error) {
        console.error(`\n[ML API] ⚠️  Виртуаль ортада пакеттерді орнату қатесі: ${error.message}`);
        console.error('[ML API] Тікелей Python-ды пайдаланып көреміз...\n');
        
        // Резервтік: тікелей Python-ды пайдалану
        try {
          await installPackagesDirect(pythonCmd);
        } catch (error2) {
          console.error(`\n[ML API] ⚠️  Пакеттерді орнату қатесі: ${error2.message}`);
          console.error('[ML API] Бірақ ML API-ны іске қосып көреміз...\n');
        }
        startMLAPIDirect(pythonCmd);
      }
    } else {
      console.log('[ML API] ⚠️  Виртуаль орта табылмады, тікелей Python пайдаланылуда...\n');
      
      // Виртуаль орта жоқ, тікелей Python-ды пайдалану
      try {
        await installPackagesDirect(pythonCmd);
      } catch (error) {
        console.error(`\n[ML API] ⚠️  Пакеттерді орнату қатесі: ${error.message}`);
        console.error('[ML API] Бірақ ML API-ны іске қосып көреміз...\n');
      }
      
      console.log('[ML API] ML API іске қосылуда (тікелей Python)...\n');
      startMLAPIDirect(pythonCmd);
    }
  } catch (error) {
    console.error(`\n[ML API] ❌ ҚАТЕ: ${error.message}`);
    console.error('\nЕскерту:');
    console.error('1. Python 3.8+ орнатылған ба?');
    console.error('2. ML API директориясында requirements.txt бар ма?');
    console.error('3. pip орнатылған ба?');
    console.error('4. Интернет байланысы бар ма? (пакеттерді жүктеу үшін)');
    console.error('5. Егер venv пайдаланғыңыз келсе, ml/venv қалпына келтіріңіз');
    process.exit(1);
  }
}

main();

