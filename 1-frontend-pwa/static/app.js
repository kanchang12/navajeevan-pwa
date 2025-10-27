// NavaJeevan Mobile App - Main JavaScript

// Configuration
const API_URL = 'https://navajeevan-triage-api-451954006366.us-central1.run.app/predict';

// PWA Install
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('App installed');
                enterApp();
            }
            deferredPrompt = null;
        });
    } else {
        // Fallback for browsers that don't support install prompt
        alert('To install: \n\niOS: Tap Share → Add to Home Screen\nAndroid: Tap Menu → Install App');
        enterApp();
    }
}

function enterApp() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainApp').classList.add('active');
    loadDashboard();
}

// Navigation
function showPage(pageName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Update pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Update title and show page
    const titles = {
        'dashboard': 'Dashboard',
        'babies': 'My Babies',
        'addBaby': 'Add Assessment',
        'history': 'History'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName];
    document.getElementById(pageName + 'Page').classList.add('active');
    
    // Load page data
    if (pageName === 'dashboard') loadDashboard();
    if (pageName === 'babies') loadBabies();
    if (pageName === 'history') loadHistory();
    if (pageName === 'addBaby') resetForm();
}

// Local Storage
function getBabies() {
    return JSON.parse(localStorage.getItem('babies') || '[]');
}

function saveBabies(babies) {
    localStorage.setItem('babies', JSON.stringify(babies));
}

function getAssessments() {
    return JSON.parse(localStorage.getItem('assessments') || '[]');
}

function saveAssessments(assessments) {
    localStorage.setItem('assessments', JSON.stringify(assessments));
}

// Dashboard
function loadDashboard() {
    const babies = getBabies();
    const assessments = getAssessments();
    
    document.getElementById('totalBabies').textContent = babies.length;
    document.getElementById('totalAssessments').textContent = assessments.length;
    
    const healthyCount = assessments.filter(a => a.result?.prediction?.risk_level === 'Healthy').length;
    const atRiskCount = assessments.filter(a => a.result?.prediction?.risk_level === 'At Risk').length;
    
    document.getElementById('healthyCount').textContent = healthyCount;
    document.getElementById('atRiskCount').textContent = atRiskCount;
    
    // Recent activity
    const recentDiv = document.getElementById('recentActivity');
    const recent = assessments.slice(-5).reverse();
    
    if (recent.length === 0) {
        recentDiv.innerHTML = '<div style="text-align:center;padding:40px;color:#999">No assessments yet</div>';
    } else {
        recentDiv.innerHTML = recent.map(a => `
            <div class="baby-card">
                <div class="baby-header">
                    <div class="baby-avatar">👶</div>
                    <div class="baby-info">
                        <h3>${a.babyName}</h3>
                        <div class="age">${new Date(a.timestamp).toLocaleDateString()}</div>
                    </div>
                </div>
                <span class="baby-status status-${a.result?.prediction?.risk_level?.toLowerCase().replace(' ', '')}">${a.result?.prediction?.risk_level || 'Unknown'}</span>
            </div>
        `).join('');
    }
}

// Babies List
function loadBabies() {
    const babies = getBabies();
    const babyList = document.getElementById('babyList');
    const emptyState = document.getElementById('emptyState');
    
    if (babies.length === 0) {
        babyList.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        babyList.style.display = 'grid';
        emptyState.style.display = 'none';
        
        babyList.innerHTML = babies.map(baby => {
            const lastAssessment = baby.assessments[baby.assessments.length - 1];
            const riskLevel = lastAssessment?.result?.prediction?.risk_level || 'No assessment';
            const statusClass = riskLevel.toLowerCase().replace(' ', '');
            
            return `
                <div class="baby-card" onclick="viewBaby('${baby.id}')">
                    <div class="baby-header">
                        <div class="baby-avatar">👶</div>
                        <div class="baby-info">
                            <h3>${baby.name}</h3>
                            <div class="age">Age: ${lastAssessment?.vitals?.age_days || '?'} days</div>
                        </div>
                    </div>
                    <span class="baby-status status-${statusClass}">${riskLevel}</span>
                    <div style="margin-top:10px;font-size:14px;color:#666">
                        ${baby.assessments.length} assessment${baby.assessments.length !== 1 ? 's' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

function viewBaby(babyId) {
    // Future: Open baby detail view
    alert('Baby detail view coming soon!');
}

// History
function loadHistory() {
    const assessments = getAssessments();
    const historyList = document.getElementById('historyList');
    
    if (assessments.length === 0) {
        historyList.innerHTML = '<div style="text-align:center;padding:60px;color:#999">No history yet</div>';
    } else {
        historyList.innerHTML = assessments.reverse().map(a => `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
                    <h3>${a.babyName}</h3>
                    <span class="baby-status status-${a.result?.prediction?.risk_level?.toLowerCase().replace(' ', '')}">${a.result?.prediction?.risk_level}</span>
                </div>
                <div style="font-size:14px;color:#666;margin-bottom:10px">
                    ${new Date(a.timestamp).toLocaleString()}
                </div>
                <div style="font-size:14px;line-height:1.6">
                    <strong>Vitals:</strong> Age ${a.vitals.age_days}d, Weight ${a.vitals.weight_kg}kg, Temp ${a.vitals.temperature_c}°C
                </div>
                <div style="margin-top:10px;font-size:13px;color:#666">
                    Confidence: ${(a.result?.prediction?.confidence * 100).toFixed(1)}%
                </div>
            </div>
        `).join('');
    }
}

// Photo handling
document.getElementById('photoInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('photoPreview').innerHTML = `<img src="${e.target.result}" alt="Baby photo">`;
        };
        reader.readAsDataURL(file);
    }
});

// Reset form
function resetForm() {
    document.getElementById('babyForm').reset();
    document.getElementById('vitalsForm').reset();
    document.getElementById('photoPreview').innerHTML = '';
}

// Submit Assessment
async function submitAssessment() {
    // Get form data
    const babyName = document.getElementById('babyName').value;
    const vitals = {
        age_days: parseInt(document.getElementById('ageDays').value),
        weight_kg: parseFloat(document.getElementById('weightKg').value),
        temperature_c: parseFloat(document.getElementById('temperature').value),
        respiratory_rate_bpm: parseInt(document.getElementById('respiratoryRate').value),
        oxygen_saturation: parseInt(document.getElementById('oxygenSat').value),
        feeding_frequency_per_day: parseInt(document.getElementById('feedingFreq').value),
        urine_output_count: parseInt(document.getElementById('urineOutput').value)
    };
    
    // Validate
    if (!babyName || Object.values(vitals).some(v => isNaN(v))) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Show loading
    document.getElementById('loading').classList.add('show');
    
    try {
        // Call API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vitals)
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const result = await response.json();
        
        // Save assessment
        const assessment = {
            id: Date.now().toString(),
            babyName,
            vitals,
            result,
            timestamp: new Date().toISOString()
        };
        
        const assessments = getAssessments();
        assessments.push(assessment);
        saveAssessments(assessments);
        
        // Update or create baby
        let babies = getBabies();
        let baby = babies.find(b => b.name === babyName);
        
        if (baby) {
            baby.assessments.push(assessment);
        } else {
            baby = {
                id: Date.now().toString(),
                name: babyName,
                assessments: [assessment]
            };
            babies.push(baby);
        }
        
        saveBabies(babies);
        
        // Show result
        showResult(result);
        
        // Reset form
        resetForm();
        
    } catch (error) {
        alert('Error: ' + error.message + '\n\nPlease check your connection and try again.');
    } finally {
        document.getElementById('loading').classList.remove('show');
    }
}

// Show Result Modal
function showResult(result) {
    const modal = document.getElementById('resultModal');
    const prediction = result.prediction;
    const riskLevel = prediction.risk_level;
    
    // Set icon and title
    const icons = {
        'Healthy': '✅',
        'At Risk': '⚠️',
        'Critical': '🚨'
    };
    
    document.getElementById('resultIcon').textContent = icons[riskLevel] || '📊';
    document.getElementById('resultTitle').textContent = riskLevel;
    
    // Set body
    const confidence = (prediction.confidence * 100).toFixed(1);
    document.getElementById('resultBody').innerHTML = `
        <p><strong>Confidence:</strong> ${confidence}%</p>
        <p><strong>Recommendation:</strong></p>
        <p>${result.recommendation}</p>
        ${result.explanation ? `<p><strong>Explanation:</strong></p><p>${result.explanation}</p>` : ''}
    `;
    
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('resultModal').classList.remove('show');
    showPage('dashboard');
}

// Settings
function showSettings() {
    alert('Settings coming soon!');
}

function toggleMenu() {
    alert('Menu coming soon!');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user has used app before
    const hasUsedApp = localStorage.getItem('hasUsedApp');
    if (hasUsedApp) {
        enterApp();
    }
    localStorage.setItem('hasUsedApp', 'true');
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
}
