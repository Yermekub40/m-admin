/**
 * ML модельдерді оқыту скрипті
 * Python train.py скриптіні орындайды
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('='.repeat(60));
console.log('ML МОДЕЛЬДЕРДІ ОҚЫТУ');
console.log('='.repeat(60));

// Python скриптінің жолы
const trainScript = path.join(__dirname, '..', 'ml', 'train.py');
const mlDir = path.join(__dirname, '..', 'ml');

// Python скриптінің бар екенін тексеру
if (!fs.existsSync(trainScript)) {
    console.error(`❌ Қате: ${trainScript} табылмады!`);
    process.exit(1);
}

// Модель түрін алу (аргументтен)
const modelType = process.argv[2] || 'random_forest';
const validModels = ['random_forest', 'gradient_boosting', 'linear', 'ridge', 'all'];

if (!validModels.includes(modelType)) {
    console.error(`❌ Қате: "${modelType}" дұрыс модель түрі емес!`);
    console.error(`   Қолжетімді модельдер: ${validModels.join(', ')}`);
    console.error(`   Мысал: node scripts/train-ml-models.js all`);
    process.exit(1);
}

if (modelType === 'all') {
    console.log(`\n📚 Барлық модельдер оқытылады:`);
    console.log(`   - Random Forest`);
    console.log(`   - Gradient Boosting`);
    console.log(`   - Linear Regression`);
    console.log(`   - Ridge Regression`);
} else {
    console.log(`\n📚 Модель түрі: ${modelType}`);
}
console.log(`📁 Директория: ${mlDir}`);
console.log(`\n⏳ Модельдер оқытылуда...\n`);

// Python скриптіні орындау
const pythonProcess = spawn('python', [trainScript, '--model', modelType], {
    cwd: mlDir,
    stdio: 'inherit',
    shell: false
});

pythonProcess.on('error', (error) => {
    console.error(`\n❌ Қате: Python скриптіні орындау мүмкін емес!`);
    console.error(`   ${error.message}`);
    console.error(`\nЕскерту: Python орнатылғанын тексеріңіз!`);
    process.exit(1);
});

pythonProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n' + '='.repeat(60));
        console.log('✅ МОДЕЛЬДЕР СӘТТІ ОҚЫТЫЛДЫ!');
        console.log('='.repeat(60));
        console.log('\n📝 Келесі қадам:');
        console.log('   ML API серверін қайта іске қосыңыз:');
        console.log('   node scripts/start-ml-api.js\n');
    } else {
        console.error(`\n❌ Модельдерді оқыту қатесімен аяқталды (код: ${code})`);
        process.exit(code);
    }
});

