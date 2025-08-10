if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registrado con éxito: ', registration.scope);
        }, err => {
            console.log('El registro del ServiceWorker falló: ', err);
        });
    });
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const SUPABASE_URL = 'https://zjcfxypnnstusorlcgor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqY2Z4eXBubnN0dXNvcmxjZ29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzQ4NjMsImV4cCI6MjA2NzgxMDg2M30.fTJ_jUvFBsKZaQbZZPn4F-45-aAowQFIV3NYeNt62qw';

let supabase;
let products = [];
let cart = JSON.parse(localStorage.getItem('huerta-cart')) || [];
let userId;
let username;
let editingProductId = null;

async function subscribeToNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Tu navegador no soporta notificaciones push.');
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        alert('Has denegado el permiso para las notificaciones.');
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
        console.log('Ya estás suscrito:', subscription);
        alert('Ya tienes las notificaciones activadas.');
        return;
    }

    const vapidPublicKey = 'BKNolyiakZwepjuF6X6tTfKLHOlyxn1hHy-FxxKOwyS57zYUALJ4fLHi6G21QwC0aLsJg89PeM7GbLLRx7DqGRzI'; 
    
    try {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        console.log('Suscripción exitosa:', subscription);
        alert('¡Notificaciones activadas! Ahora recibirás avisos.');
        
    } catch (error) {
        console.error('Error al suscribirse a las notificaciones:', error);
        alert(`Hubo un error al activar las notificaciones. Detalles: ${error.name} - ${error.message}`);
    }
}

function openTab(tabName) {
    if (tabName === 'admin') {
        const password = prompt("Introduce la contraseña de administrador:");
        if (password !== '1111') {
            alert('aqui solo toca gabina');
            return;
        }
        displayAdminProducts();
        loadAdminData(); // Load customers and orders
    }

    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
    }

    const tabs = document.getElementsByClassName('tab');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    document.getElementById(tabName).style.display = 'block';

    const button = document.querySelector(`.tab[data-tab-name="${tabName}"]`);
    if (button) {
        button.classList.add('active');
    }
    
    if (tabName !== 'admin') {
        resetForm();
    }
}

async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        products = data;
        displayProducts();
        if (document.getElementById('admin').style.display === 'block') {
            displayAdminProducts();
        }
    } catch (error) {
        console.error('Error cargando productos:', error.message);
        displayProducts();
    }
}

async function loadAdminData() {
    const customerList = document.getElementById('admin-customers-list');
    const orderList = document.getElementById('admin-orders-list');
    customerList.innerHTML = '<p class="loading-message">Cargando clientes...</p>';
    orderList.innerHTML = '<p class="loading-message">Cargando pedidos...</p>';

    const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando datos de admin:", error);
        customerList.innerHTML = '<p>Error al cargar clientes.</p>';
        orderList.innerHTML = '<p>Error al cargar pedidos.</p>';
        return;
    }

    displayCustomers(reservations);
    displayOrders(reservations);
}

function displayCustomers(reservations) {
    const customerList = document.getElementById('admin-customers-list');
    customerList.innerHTML = '';
    
    const uniqueUsers = new Map();
    reservations.forEach(res => {
        if (res.user_id && !uniqueUsers.has(res.user_id)) {
            uniqueUsers.set(res.user_id, res.user_name || 'Nombre no disponible');
        }
    });

    if (uniqueUsers.size === 0) {
        customerList.innerHTML = '<p>No hay clientes todavía.</p>';
        return;
    }

    uniqueUsers.forEach((name, id) => {
        const customerDiv = document.createElement('div');
        customerDiv.className = 'admin-list-item';
        customerDiv.innerHTML = `<p><strong>Nombre:</strong> ${name}</p><p><strong>ID de Usuario:</strong> ${id}</p>`;
        customerList.appendChild(customerDiv);
    });
}

function displayOrders(reservations) {
    const orderList = document.getElementById('admin-orders-list');
    orderList.innerHTML = '';

    if (reservations.length === 0) {
        orderList.innerHTML = '<p>No hay pedidos todavía.</p>';
        return;
    }

    reservations.forEach(res => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'admin-list-item';
        
        let itemsHtml = '<ul>';
        if (res.items && res.items.length > 0) {
            res.items.forEach(item => {
                itemsHtml += `<li>${item.quantity} ${item.unit || ''} de ${item.name}</li>`;
            });
        } else {
            itemsHtml += '<li>No hay artículos en este pedido.</li>';
        }
        itemsHtml += '</ul>';

        orderDiv.innerHTML = `
            <h4>Pedido del ${new Date(res.created_at).toLocaleString('es-ES')}</h4>
            <p><strong>Cliente:</strong> ${res.user_name || 'Nombre no disponible'} (ID: ${res.user_id})</p>
            <p><strong>Estado:</strong> ${res.status || 'desconocido'}</p>
            <div><strong>Artículos:</strong>${itemsHtml}</div>
        `;
        orderList.appendChild(orderDiv);
    });
}

function displayProducts() {
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = '';

    if (!products || products.length === 0) {
        productsList.innerHTML = '<p class="loading-message">No se encontraron productos.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>Disponible: ${product.stock} ${product.unit}</p>
            <div class="product-actions">
                <input type="number" id="qty-${product.id}" min="1" max="${product.stock}" value="1">
                <button data-product-id="${product.id}">Reservar</button>
            </div>
        `;
        productsList.appendChild(productCard);
    });
}

function displayAdminProducts() {
    const adminProductsList = document.getElementById('admin-products-list');
    adminProductsList.innerHTML = '';

    if (!products || products.length === 0) {
        adminProductsList.innerHTML = '<p>No hay productos para gestionar.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3>${product.name}</h3>
            <p>Disponible: ${product.stock} ${product.unit}</p>
            <div class="admin-product-actions">
                <button class="edit-btn" data-product-id="${product.id}">Editar</button>
                <button class="delete-btn" data-product-id="${product.id}">Eliminar</button>
            </div>
        `;
        adminProductsList.appendChild(productCard);
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id.toString() === productId);
    if (!product) {
        console.error(`Producto no encontrado con id: ${productId}`);
        return;
    }
    const quantityInput = document.getElementById(`qty-${product.id}`);
    const quantity = parseInt(quantityInput.value);
    if (quantity > product.stock) {
        alert('No hay suficiente stock.');
        return;
    }
    product.stock -= quantity;
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ productId, name: product.name, quantity, unit: product.unit, image: product.image });
    }
    localStorage.setItem('huerta-cart', JSON.stringify(cart));
    displayProducts();
    updateCartDisplay();
    alert(`${quantity} ${product.unit} de ${product.name} añadido(s) a la reserva.`);
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>No hay productos reservados aún.</p>';
        return;
    }
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                <span>${item.name}</span>
            </div>
            <div>
                ${item.quantity} ${item.unit}
                <button class="remove-from-cart-btn" data-product-id="${item.productId}" style="margin-left: 10px;">✕</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
}

function removeFromCart(productId) {
    const cartItem = cart.find(item => item.productId === productId);
    if (cartItem) {
        const product = products.find(p => p.id.toString() === cartItem.productId);
        if (product) {
            product.stock += cartItem.quantity;
        }
    }
    cart = cart.filter(item => item.productId !== productId);
    localStorage.setItem('huerta-cart', JSON.stringify(cart));
    displayProducts();
    updateCartDisplay();
}

async function confirmReservation() {
    if (cart.length === 0) return;
    try {
        const { error } = await supabase.rpc('confirm_reservation_and_update_stock', { p_user_id: userId, p_items: cart });
        if (error) throw error;
        console.log('Reserva enviada y stock actualizado.');
        const modal = document.getElementById('video-modal');
        const video = document.getElementById('confirmation-video');
        if (modal && video) {
            modal.style.display = 'flex';
            video.play();
        }
        cart = [];
        localStorage.setItem('huerta-cart', JSON.stringify(cart));
        updateCartDisplay();
        await loadProducts();
    } catch (error) {
        console.error('Error confirmando reserva:', error.message);
        alert(`Error al confirmar la reserva: ${error.message}`);
        await loadProducts();
    }
}

function populateFormForEdit(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('editing-product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-unit').value = product.unit;
    
    document.getElementById('form-submit-button').textContent = 'Actualizar Producto';
    document.getElementById('cancel-edit-button').style.display = 'inline-block';
    
    window.scrollTo(0, 0);
}

function resetForm() {
    document.getElementById('add-product-form').reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('form-submit-button').textContent = 'Guardar Producto';
    document.getElementById('cancel-edit-button').style.display = 'none';
    editingProductId = null;
}

async function deleteProduct(productId) {
    const confirmed = confirm("¿Estás seguro de que quieres eliminar este producto?");
    if (!confirmed) return;

    try {
        const { error } = await supabase.from('products').delete().match({ id: productId });
        if (error) throw error;
        alert('Producto eliminado.');
        await loadProducts();
    } catch (error) {
        console.error('Error eliminando producto:', error.message);
        alert(`Error: ${error.message}`);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const editingId = document.getElementById('editing-product-id').value;
    
    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        stock: parseInt(document.getElementById('product-stock').value),
        unit: document.getElementById('product-unit').value,
    };

    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
        const { data, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(`${Date.now()}-${imageFile.name}`, imageFile);
        if (uploadError) {
            console.error('Error subiendo imagen:', uploadError);
            alert(`Error: ${uploadError.message}`);
            return;
        }
        productData.image = `${SUPABASE_URL}/storage/v1/object/public/product-images/${data.path}`;
    }

    try {
        let error;
        if (editingId) {
            const { error: updateError } = await supabase.from('products').update(productData).match({ id: editingId });
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('products').insert([productData]);
            error = insertError;
        }
        if (error) throw error;
        alert(editingId ? 'Producto actualizado.' : 'Producto añadido.');
        resetForm();
        await loadProducts();
    } catch (error) {
        console.error('Error guardando producto:', error.message);
        alert(`Error: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    supabase = window.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    userId = localStorage.getItem('huerta-user-id') || `user-${Date.now()}`;
    localStorage.setItem('huerta-user-id', userId);
    username = localStorage.getItem('huerta-username');
    if (!username) {
        let tempUsername = prompt('Introduce tu nombre:');
        while (!tempUsername || tempUsername.trim() === '') {
            tempUsername = prompt('El nombre no puede estar vacío.');
        }
        username = tempUsername;
        localStorage.setItem('huerta-username', username);
    }
    document.getElementById('welcome-message').textContent = `Hola, ${username}! Fresco, familiar y del huerto a tu mesa`;

    loadProducts();
    updateCartDisplay();

    document.querySelectorAll('.tab').forEach(button => {
        button.addEventListener('click', () => openTab(button.dataset.tabName));
    });

    document.getElementById('add-product-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancel-edit-button').addEventListener('click', resetForm);
    document.getElementById('confirm-reservation-btn').addEventListener('click', confirmReservation);

    document.getElementById('products-list').addEventListener('click', (event) => {
        const reserveButton = event.target.closest('.product-actions button');
        if (reserveButton) {
            addToCart(reserveButton.dataset.productId);
        }
    });

    document.getElementById('cart-items').addEventListener('click', (event) => {
        const removeButton = event.target.closest('.cart-item button');
        if (removeButton) {
            removeFromCart(removeButton.dataset.productId);
        }
    });

    document.getElementById('admin-products-list').addEventListener('click', (event) => {
        const editButton = event.target.closest('.edit-btn');
        if (editButton) {
            populateFormForEdit(editButton.dataset.productId);
            return;
        }
        const deleteButton = event.target.closest('.delete-btn');
        if (deleteButton) {
            deleteProduct(deleteButton.dataset.productId);
        }
    });

    document.getElementById('enable-notifications-btn').addEventListener('click', subscribeToNotifications);

    const modal = document.getElementById('video-modal');
    const video = document.getElementById('confirmation-video');
    if (video) {
        video.onended = function() {
            if (modal) modal.style.display = "none";
            alert("¡Pedido realizado con éxito!");
        };
    }
});