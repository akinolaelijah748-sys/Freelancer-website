// api/track-usage.js
// This is the working version - no Cloud Functions needed!

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpPcl60w8ca2_10ZtxjfQ8jEQVkVZRCgo",
    authDomain: "my-awesome-site-6e399.firebaseapp.com",
    projectId: "my-awesome-site-6e399",
    storageBucket: "my-awesome-site-6e399.firebasestorage.app",
    messagingSenderId: "728415053452",
    appId: "1:728415053452:web:1649c583f80343bc8c549c"
};

let db = null;

// Load Firebase
async function initFirebase() {
    return new Promise((resolve, reject) => {
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            resolve(firebase.firestore());
            return;
        }
        
        const script1 = document.createElement('script');
        script1.src = 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';
            script2.onload = () => {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                resolve(firebase.firestore());
            };
            script2.onerror = reject;
            document.head.appendChild(script2);
        };
        script1.onerror = reject;
        document.head.appendChild(script1);
    });
}

// Get usage data
async function getUsage(userId) {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
        return {
            aiAgent: [0,0,0,0,0,0,0],
            grammarFix: [0,0,0,0,0,0,0],
            summarise: [0,0,0,0,0,0,0],
            translate: [0,0,0,0,0,0,0]
        };
    }
    
    return userSnap.data().usage || {
        aiAgent: [0,0,0,0,0,0,0],
        grammarFix: [0,0,0,0,0,0,0],
        summarise: [0,0,0,0,0,0,0],
        translate: [0,0,0,0,0,0,0]
    };
}

// Track usage
async function trackUsage(userId, tool, dayIndex) {
    const userRef = db.collection('users').doc(userId);
    let usage = await getUsage(userId);
    
    // Increment
    switch(tool) {
        case 'aiAgent':
            usage.aiAgent[dayIndex] = (usage.aiAgent[dayIndex] || 0) + 1;
            break;
        case 'grammar':
            usage.grammarFix[dayIndex] = (usage.grammarFix[dayIndex] || 0) + 1;
            break;
        case 'summarise':
            usage.summarise[dayIndex] = (usage.summarise[dayIndex] || 0) + 1;
            break;
        case 'translate':
            usage.translate[dayIndex] = (usage.translate[dayIndex] || 0) + 1;
            break;
        default:
            throw new Error(`Invalid tool: ${tool}`);
    }
    
    // Save
    await userRef.set({
        usage: usage,
        lastUpdated: new Date().toISOString()
    }, { merge: true });
    
    return usage;
}

// Main handler
async function handleRequest() {
    // Clear the page and show JSON
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.padding = '20px';
    document.body.style.fontFamily = 'monospace';
    
    try {
        db = await initFirebase();
        
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const tool = urlParams.get('tool');
        const dayIndex = urlParams.get('dayIndex');
        
        // Track usage (POST-like via GET with parameters)
        if (tool && dayIndex !== null && userId) {
            const result = await trackUsage(userId, tool, parseInt(dayIndex));
            document.body.innerHTML = JSON.stringify({
                success: true,
                message: `Tracked ${tool} usage`,
                usage: result
            }, null, 2);
            return;
        }
        
        // Get usage data
        if (userId) {
            const usage = await getUsage(userId);
            document.body.innerHTML = JSON.stringify({
                success: true,
                usage: usage
            }, null, 2);
            return;
        }
        
        // Default response
        document.body.innerHTML = JSON.stringify({
            success: true,
            message: 'API is working!',
            usage: {
                get: '/api/track-usage.js?userId=YOUR_USER_ID',
                track: '/api/track-usage.js?userId=YOUR_USER_ID&tool=aiAgent&dayIndex=1'
            }
        }, null, 2);
        
    } catch (error) {
        document.body.innerHTML = JSON.stringify({
            success: false,
            error: error.message
        }, null, 2);
    }
}

// Run
handleRequest();