// Firebase Configuration (Aapki asli keys lagadi hain)
const firebaseConfig = {
    apiKey: "AIzaSyAh6yclYLSk166V6x4vDcectvJddoPCA-4",
    authDomain: "://firebaseapp.com",
    databaseURL: "https://firebaseio.com",
    projectId: "my-stock-portal",
    storageBucket: "://appspot.com",
    messagingSenderId: "852900561390",
    appId: "1:852900561390:web:cec2718d72c3e97bb0eff7",
    measurementId: "G-LSGGNFZNZN"
};

// Firebase Initialize karen
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 🔐 LOGIN SECURITY SYSTEM
const MASTER_PASSWORD = "dukaan123"; 
let html5QrcodeScanner = null;

window.onload = function() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        showDashboard();
    }
}

function checkLogin() {
    const inputPass = document.getElementById("sysPassword").value;
    if (inputPass === MASTER_PASSWORD) {
        localStorage.setItem("isLoggedIn", "true");
        showDashboard();
    } else {
        alert("Galat password! Dobara koshish karen.");
    }
}

function showDashboard() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("mainDashboard").classList.remove("hidden");
    loadLiveInventory();
}

function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("mainDashboard").classList.add("hidden");
    stopScanner();
}

// 📸 SCANNER FUNCTIONS
function startScanner() {
    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
            document.getElementById('prodBarcode').value = decodedText;
            fetchProductDetails(decodedText);
            stopScanner();
        },
        (errorMessage) => { }
    ).catch(err => alert("Camera permission den: " + err));
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            document.getElementById("reader").innerHTML = "";
        }).catch(err => {});
    }
}

function fetchProductDetails(barcode) {
    database.ref('inventory/' + barcode).once('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('prodName').value = data.name;
            document.getElementById('prodPrice').value = data.price;
        }
    });
}

// ➕ STOCK ADD FUNCTION
function handleAddStock() {
    const barcode = document.getElementById('prodBarcode').value.trim();
    const name = document.getElementById('prodName').value.trim();
    const qty = parseInt(document.getElementById('prodQty').value) || 0;
    const price = document.getElementById('prodPrice').value.trim();

    if (!barcode || !name || qty <= 0) return alert("Sub details sahi likhein!");

    const productRef = database.ref('inventory/' + barcode);
    productRef.once('value', (snapshot) => {
        let currentQty = 0;
        if (snapshot.exists()) currentQty = snapshot.val().quantity;
        
        productRef.set({
            name: name,
            quantity: currentQty + qty,
            price: price
        }).then(() => {
            alert("Stock add ho gaya!");
            clearForm();
        });
    });
}

// 📉 SALE FUNCTION (MINUS STOCK)
function handleSale() {
    const barcode = document.getElementById('prodBarcode').value.trim();
    const qtyToSell = parseInt(document.getElementById('prodQty').value) || 0;

    if (!barcode || qtyToSell <= 0) return alert("Barcode aur Qty lazmi hain!");

    const productRef = database.ref('inventory/' + barcode);
    productRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            alert("Product stock me nahi hai!");
        } else {
            const currentQty = snapshot.val().quantity;
            const name = snapshot.val().name;
            const price = snapshot.val().price;

            if (currentQty < qtyToSell) {
                alert(`Stock kam hai! Sirf ${currentQty} bache hain.`);
            } else {
                productRef.set({
                    name: name,
                    quantity: currentQty - qtyToSell,
                    price: price
                }).then(() => {
                    alert(`Sale Done! Bill: PKR ${qtyToSell * price}`);
                    clearForm();
                });
            }
        }
    });
}

function clearForm() {
    document.getElementById('prodBarcode').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodQty').value = '';
    document.getElementById('prodPrice').value = '';
}

// 📋 REAL-TIME DISPLAY
function loadLiveInventory() {
    database.ref('inventory').on('value', (snapshot) => {
        const tableBody = document.getElementById('stockTableBody');
        tableBody.innerHTML = '';
        
        snapshot.forEach((childSnapshot) => {
            const barcode = childSnapshot.key;
            const product = childSnapshot.val();
            const warningClass = product.quantity <= 5 ? 'text-red-600 font-bold bg-red-50' : '';

            const row = `
                <tr class="border-b hover:bg-gray-50 ${warningClass}">
                    <td class="p-3 border font-mono">${barcode}</td>
                    <td class="p-3 border font-semibold">${product.name}</td>
                    <td class="p-3 border text-center font-bold">${product.quantity}</td>
                    <td class="p-3 border text-right">${product.price}/-</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    });
}
