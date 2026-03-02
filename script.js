// Navegação SPA
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

function navigateTo(targetId) {
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === targetId) {
            page.classList.add('active');
        }
    });

    // Atualiza estado do menu
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === targetId) {
            link.classList.add('active');
        }
    });

    window.scrollTo(0, 0);
    
    if (targetId === 'my-appointments') {
        renderAppointments();
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        navigateTo(target);
    });
});

// Lógica de Agendamento
const bookingForm = document.getElementById('form-booking');

bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const appointment = {
        id: Date.now(),
        name: document.getElementById('name').value,
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value
    };

    // Salvar no LocalStorage
    const saved = JSON.parse(localStorage.getItem('appointments') || '[]');
    saved.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(saved));

    alert('Horário agendado com sucesso!');
    bookingForm.reset();
    navigateTo('my-appointments');
});

// Renderizar Agendamentos
function renderAppointments() {
    const list = document.getElementById('appointments-list');
    const saved = JSON.parse(localStorage.getItem('appointments') || '[]');

    if (saved.length === 0) {
        list.innerHTML = '<p style="text-align:center">Nenhum agendamento encontrado.</p>';
        return;
    }

    list.innerHTML = saved.map(app => `
        <div class="appointment-card">
            <div>
                <strong>${app.service}</strong><br>
                <small>${app.name}</small>
            </div>
            <div style="text-align: right">
                <span>${app.date.split('-').reverse().join('/')}</span><br>
                <strong>${app.time}</strong>
            </div>
        </div>
    `).join('');
}

// Iniciar na Home
navigateTo('home');

// --- Lógica de Autenticação ---

// 1. Cadastro
const registerForm = document.getElementById('form-register');
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newUser = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };

    // Salva o usuário (simulando banco de dados)
    localStorage.setItem('user_data', JSON.stringify(newUser));
    
    alert('Conta criada com sucesso! Bem-vinda, ' + newUser.name);
    
    // Redireciona para Home após cadastro
    navigateTo('home');
    updateAuthUI(newUser.name);
});

// 2. Login
const loginForm = document.getElementById('form-login');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    // Busca usuário no LocalStorage
    const storedUser = JSON.parse(localStorage.getItem('user_data'));

    if (storedUser && storedUser.email === email && storedUser.password === pass) {
        alert('Login realizado!');
        navigateTo('home');
        updateAuthUI(storedUser.name);
    } else {
        alert('E-mail ou senha incorretos.');
    }
});

// 3. Atualiza o menu após login
function updateAuthUI(userName) {
    const navAuth = document.getElementById('nav-auth');
    navAuth.innerHTML = `Olá, ${userName.split(' ')[0]}`;
    navAuth.style.color = 'var(--gold)';
    navAuth.removeAttribute('data-target'); // Desabilita o clique para voltar ao login
}

// Verifica se já existe alguém logado ao carregar a página
window.onload = () => {
    const loggedUser = JSON.parse(localStorage.getItem('user_data'));
    if (loggedUser) {
        // Opcional: manter logado automaticamente
        // updateAuthUI(loggedUser.name); 
    }
}

document.getElementById('form-booking').addEventListener('submit', function (event) {
    event.preventDefault(); // Evita o envio padrão do formulário

    const form = event.target;

    // Adiciona a classe de animação
    form.classList.add('booking-success');

    // Remove a classe após a animação (0.5s)
    setTimeout(() => {
        form.classList.remove('booking-success');
        alert('Agendamento confirmado com sucesso!');
    }, 500);
});

// Função para detectar elementos na tela
function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    const windowHeight = window.innerHeight;

    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < windowHeight - 100) {
            element.classList.add('visible');
        }
    });
}

// Adiciona o evento de rolagem
window.addEventListener('scroll', animateOnScroll);

// Inicializa as animações ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    animateOnScroll();
});