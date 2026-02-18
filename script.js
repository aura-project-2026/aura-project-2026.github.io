// CONFIGURATION
const PUBLIC_WEBHOOK_URL = "https://discord.com/api/webhooks/1473471456762662922/RH-RGGp8WEd5uTReES80zYEJ6j-8zfykr2kH77qmEMWdeBnpknUizzHwtMi1qkGNwERC"; 
const ADMIN_WEBHOOK_URL = "https://discord.com/api/webhooks/1473467883320377355/LWq-8RjHOWcJ6MksnHwCKEdT_kJjkL8JVNPPeFjZJ2Z97iRz2uM2aEH1gCwrIb7KEsw4"; 

let cart = [];

function generateOrderNumber() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'AR-';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('translate-x-full');
}

function updateLivePrice(id, value) {
    const price = value.split('|')[0];
    document.getElementById('price-' + id).innerText = '$' + price + '.00';
}

function addToCart(name, selectId, isRestricted) {
    const select = document.getElementById(selectId);
    const [price, weight] = select.value.split('|');
    
    cart.push({ 
        name, 
        price: parseFloat(price), 
        weight,
        isRestricted: isRestricted 
    });
    
    updateCartUI();
    toggleCart();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-zinc-700 italic text-center py-10">Archive queue is currently empty...</p>';
        totalEl.innerText = '$0.00';
        countEl.innerText = '0';
        return;
    }

    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        subtotal += item.price;
        const restrictedStyle = item.isRestricted ? "text-red-500 aura-glow" : "text-white";
        
        container.innerHTML += `
            <div class="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                    <p class="${restrictedStyle} font-bold mb-1">${item.name}</p>
                    <p class="text-zinc-600 text-[8px] tracking-widest font-mono">${item.weight}</p>
                </div>
                <div class="text-right">
                    <p class="text-red-600 font-bold mb-1">$${item.price.toFixed(2)}</p>
                    <button onclick="removeItem(${index})" class="text-[8px] text-zinc-500 hover:text-white underline">REMOVE</button>
                </div>
            </div>
        `;
    });

    // Bulk Discount Logic: 10% off over $200
    let finalTotal = subtotal;
    if (subtotal >= 200) finalTotal = subtotal * 0.90;

    totalEl.innerText = `$${finalTotal.toFixed(2)}`;
    countEl.innerText = cart.length;
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// DUAL WEBHOOK SYSTEM
async function showPayment() {
    if(cart.length === 0) return alert("Queue is empty.");
    
    const realOrderNum = generateOrderNumber();
    const maskedOrderNum = "AR-*****"; // Censored ID for public view
    const finalTotal = document.getElementById('cart-total').innerText;
    
    const hasRestrictedItems = cart.some(item => item.isRestricted);

    // 1. PUBLIC PAYLOAD (Censored & Hype Focused)
    let publicItemSummary = cart.map(i => `• ${i.name} (${i.weight})`).join('\n');
    
    const publicPayload = {
        username: "A.U.R.A. FEED",
        embeds: [{
            title: "🛒 NEW ARCHIVE REQUEST",
            color: 3092790, // Nice Matrix Green/Grey
            fields: [
                { name: "Order ID", value: `\`${maskedOrderNum}\``, inline: true }, // HIDDEN ID
                { name: "Value", value: `**${finalTotal}**`, inline: true },
                { name: "Requested Specimens", value: "```" + publicItemSummary + "```" }
            ],
            footer: { text: "Anonymous Transaction Feed" },
            timestamp: new Date()
        }]
    };

    // 2. ADMIN PAYLOAD (Uncensored & High Alert Logic)
    let adminItemSummary = cart.map(i => {
        return i.isRestricted ? `⚠️ [RESTRICTED] ${i.name} (${i.weight})` : `• ${i.name} (${i.weight})`;
    }).join('\n');

    // Determine Style based on Contents
    let adminTitle = hasRestrictedItems ? "🚨 RESTRICTED CLEARANCE REQUEST" : "📦 NEW STANDARD ORDER";
    let adminColor = hasRestrictedItems ? 10038562 : 3447003; // Red for Restricted, Blue for Standard
    let adminFooter = hasRestrictedItems ? "LEVEL 4 ALERT - VERIFY PAYMENT" : "Standard Logistics Channel";

    const adminPayload = {
        username: "A.U.R.A. COMMAND",
        embeds: [{
            title: adminTitle,
            color: adminColor,
            fields: [
                { name: "REAL ORDER ID", value: `\`${realOrderNum}\``, inline: true }, // REAL ID
                { name: "Remittance", value: `**${finalTotal}**`, inline: true },
                { name: "Full Manifest", value: "```" + adminItemSummary + "```" }
            ],
            footer: { text: adminFooter },
            timestamp: new Date()
        }]
    };

    try {
        // Send to PUBLIC Feed
        await fetch(PUBLIC_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(publicPayload)
        });

        // Send to ADMIN Feed
        await fetch(ADMIN_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminPayload)
        });
        
        // Show Customer Success Modal with REAL ID
        document.getElementById('display-order-id').innerText = realOrderNum;
        document.getElementById('pay-modal').style.display = 'flex';

    } catch (err) {
        console.error(err);
        alert("Network connection error. Please contact support.");
    }
}