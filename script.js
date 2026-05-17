
// GATEEN PET SHOP - SCRIPT COM LOCALSTORAGE
// Carrinho e Fidelidade persistem entre páginas
// ============================================

// ============================================
// LOCALSTORAGE - CARREGAR DADOS SALVOS
// ============================================

function loadFromStorage(key, defaultValue) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
}

function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Estado global (carrega do localStorage ou inicia vazio)
let cart = loadFromStorage('gateen_cart', []);
let fidelityCount = loadFromStorage('gateen_fidelity', 0);
const FIDELITY_LIMIT = 5;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Renderizar stamps se estiver na página de fidelidade
    if (document.getElementById('stamps-container')) {
        renderStamps();
        updateFidelityUI();
    }

    // Atualizar carrinho em todas as páginas
    updateCartUI();

    // Scroll suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
});

// ============================================
// MENU MOBILE
// ============================================

function toggleMenu() {
    document.querySelector('.nav-menu').classList.toggle('active');
}

// ============================================
// CARRINHO
// ============================================

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

function addToCart(id, name, price, type) {
    // Verificar fidelidade
    if (fidelityCount >= FIDELITY_LIMIT) {
        showToast('🎉 Parabéns! Esta compra é GRÁTIS pelo programa de fidelidade!', 'success');
        fidelityCount = 0;
        saveToStorage('gateen_fidelity', fidelityCount);
        updateFidelityUI();
        return;
    }

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id, name, price, type, quantity: 1 });
    }

    // SALVAR no localStorage
    saveToStorage('gateen_cart', cart);

    updateCartUI();
    showToast(`${name} adicionado ao carrinho!`);

    // Incrementar fidelidade (só para produtos)
    if (type === 'produto') {
        fidelityCount++;
        saveToStorage('gateen_fidelity', fidelityCount);
        updateFidelityUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveToStorage('gateen_cart', cart);
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cart-total');

    if (!cartItems || !cartCount || !cartTotal) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        cartTotal.textContent = 'R$ 0,00';
        return;
    }

    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>R$ ${item.price.toFixed(2).replace('.', ',')} x ${item.quantity}</p>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function checkout() {
    if (cart.length === 0) {
        showToast('Adicione itens ao carrinho primeiro!');
        return;
    }

    let message = 'Olá! Quero fazer um pedido 🐾\\n\\n';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        message += `• ${item.name} (${item.quantity}x) - R$ ${subtotal.toFixed(2).replace('.', ',')}\\n`;
    });

    message += `\\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
    message += '\\n\\nEndereço de entrega: [digite aqui]';

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/5586998317652?text=${encoded}`, '_blank');

    // Limpar carrinho após finalizar
    cart = [];
    saveToStorage('gateen_cart', cart);
    updateCartUI();

    toggleCart();
    showToast('Redirecionando para o WhatsApp...');
}

// ============================================
// FIDELIDADE - 5 COMPRAS
// ============================================

function renderStamps() {
    const container = document.getElementById('stamps-container');
    if (!container) return;

    let html = '';

    for (let i = 1; i <= FIDELITY_LIMIT; i++) {
        if (i === FIDELITY_LIMIT) {
            html += `<div class="stamp gift" id="stamp-${i}"><i class="fas fa-gift"></i></div>`;
        } else {
            html += `<div class="stamp" id="stamp-${i}"><i class="fas fa-paw"></i></div>`;
        }
    }

    container.innerHTML = html;

    // Atualizar stamps visuais baseado no estado salvo
    updateStampsVisual();
}

function updateStampsVisual() {
    for (let i = 1; i <= FIDELITY_LIMIT; i++) {
        const stamp = document.getElementById(`stamp-${i}`);
        if (stamp) {
            if (i <= fidelityCount) {
                stamp.classList.add('active');
            } else {
                stamp.classList.remove('active');
            }
        }
    }
}

function updateFidelityUI() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressMsg = document.getElementById('progress-msg');

    if (!progressFill || !progressText || !progressMsg) return;

    const percentage = (fidelityCount / FIDELITY_LIMIT) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${fidelityCount}/${FIDELITY_LIMIT}`;

    const remaining = FIDELITY_LIMIT - fidelityCount;
    if (remaining === 0) {
        progressMsg.textContent = '🎉 Compra seguinte é GRÁTIS!';
        progressMsg.style.fontWeight = '700';
    } else {
        progressMsg.textContent = `Faltam ${remaining} compras para ganhar 1 grátis!`;
        progressMsg.style.fontWeight = '400';
    }

    updateStampsVisual();
}

// ============================================
// MODAL AGENDAMENTO
// ============================================

function openModal(type) {
    const modal = document.getElementById(`modal-${type}`);
    if (modal) modal.classList.add('active');
}

function closeModal(type) {
    const modal = document.getElementById(`modal-${type}`);
    if (modal) modal.classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Abrir modal com serviço pré-selecionado (página servicos.html)
function openAgendamentoModal(servicoNome) {
    const modal = document.getElementById('modal-agendamento');
    if (!modal) return;

    const selectServico = modal.querySelector('select');
    if (!selectServico) return;

    for (let i = 0; i < selectServico.options.length; i++) {
        if (selectServico.options[i].text === servicoNome) {
            selectServico.selectedIndex = i;
            break;
        }
    }

    modal.classList.add('active');
}

function handleAgendamento(e) {
    e.preventDefault();

    const form = e.target;
    const nome = form.querySelector('input[type="text"]').value;
    const telefone = form.querySelector('input[type="tel"]').value;
    const servico = form.querySelector('select').value;
    const data = form.querySelector('input[type="date"]').value;
    const horarioSelect = form.querySelectorAll('select')[1];
    const horario = horarioSelect ? horarioSelect.value : '';

    const message = `Olá! Quero agendar um serviço 🐾\\n\\n` +
        `*Nome:* ${nome}\\n` +
        `*Telefone:* ${telefone}\\n` +
        `*Serviço:* ${servico}\\n` +
        `*Data:* ${data}\\n` +
        `*Horário:* ${horario}\\n\\n` +
        `Aguardo confirmação!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/5586998317652?text=${encoded}`, '_blank');

    closeModal('agendamento');
    form.reset();
    showToast('Agendamento enviado pelo WhatsApp!');
}

// ============================================
// TOAST
// ============================================

function showToast(message, type = 'normal') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    if (type === 'success') {
        toast.style.background = '#4CAF50';
    } else {
        toast.style.background = 'var(--primary)';
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Scroll para seção
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}
