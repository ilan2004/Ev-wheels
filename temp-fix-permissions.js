// TEMPORARY FIX: Run this in your browser's console to disable location scoping
// This will allow triage to work until we fix the proper permissions

// Disable location scoping temporarily
localStorage.setItem('feature_location_scope_enabled', 'false');

console.log('✅ Location scoping disabled temporarily');
console.log('🔄 Refresh the page and try triage again');
console.log('⚠️  Remember to fix the proper permissions later!');
