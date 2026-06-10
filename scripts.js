/* ════════════════════════════════════════
   ERYN — Consultoria & Tecnologia
   script.js
════════════════════════════════════════ */


/* ──────────────────────────────────────
   1. SMOOTH SCROLL
   Faz os links internos (href="#seção")
   rolarem suavemente até o destino.
────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    var destino = document.querySelector(link.getAttribute('href'));
    if (destino) {
      e.preventDefault();
      destino.scrollIntoView({ behavior: 'smooth' });
    }
  });
});


/* ──────────────────────────────────────
   2. SCROLL REVEAL — Intersection Observer
   Observa todos os elementos com classe
   .reveal. Quando entram na tela:
     → adiciona .visible (dispara animação)
     → respeita data-delay para escalonar
     → para de observar depois (1 disparo)
────────────────────────────────────── */
var observer = new IntersectionObserver(
  function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;

      var delay = parseInt(entry.target.dataset.delay || '0', 10);

      setTimeout(function() {
        entry.target.classList.add('visible');
      }, delay);

      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.08,
    rootMargin: '0px 0px -48px 0px'
  }
);

document.querySelectorAll('.reveal').forEach(function(el) {
  observer.observe(el);
});


/* ──────────────────────────────────────
   3. FAQ — Accordion
   Abre/fecha as respostas ao clicar.
   Só uma resposta fica aberta por vez.
────────────────────────────────────── */
document.querySelectorAll('.faq-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var resposta   = btn.nextElementSibling;
    var icone      = btn.querySelector('.faq-icon');
    var estaAberto = resposta.classList.contains('open');

    /* Fecha todos primeiro */
    document.querySelectorAll('.faq-a').forEach(function(a) {
      a.classList.remove('open');
    });
    document.querySelectorAll('.faq-icon').forEach(function(i) {
      i.classList.remove('open');
    });

    /* Abre o clicado (se estava fechado) */
    if (!estaAberto) {
      resposta.classList.add('open');
      icone.classList.add('open');
    }
  });
});


/* ──────────────────────────────────────
   4. SLIDER — Carrossel arrastável
   Desktop (>768px): grid CSS (3 colunas)
   Mobile  (<768px): scroll-snap horizontal

   Suporta:
   - Drag com mouse no desktop
   - Swipe com toque no celular
   - Dots de navegação clicáveis
────────────────────────────────────── */
function iniciarSlider(trackId, dotsId) {
  var track  = document.getElementById(trackId);
  var dotsEl = document.getElementById(dotsId);
  if (!track || !dotsEl) return;

  var slides = track.querySelectorAll('.slide');
  var arrasto = { ativo: false, x0: 0, scrollInicial: 0 };

  /* --- Cria os dots de navegação --- */
  slides.forEach(function(_, i) {
    var dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', function() {
      track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    });
    dotsEl.appendChild(dot);
  });

  /* --- Atualiza dot ativo conforme scroll --- */
  track.addEventListener('scroll', function() {
    var largura = track.clientWidth;
    if (!largura) return;
    var idx = Math.round(track.scrollLeft / largura);
    dotsEl.querySelectorAll('.dot').forEach(function(d, i) {
      d.classList.toggle('active', i === idx);
    });
  });

  /* --- Drag com mouse (desktop) --- */
  track.addEventListener('mousedown', function(e) {
    arrasto = { ativo: true, x0: e.clientX, scrollInicial: track.scrollLeft };
    track.classList.add('dragging');
  });
  track.addEventListener('mousemove', function(e) {
    if (!arrasto.ativo) return;
    track.scrollLeft = arrasto.scrollInicial + arrasto.x0 - e.clientX;
  });
  track.addEventListener('mouseup', function() {
    arrasto.ativo = false;
    track.classList.remove('dragging');
  });
  track.addEventListener('mouseleave', function() {
    arrasto.ativo = false;
    track.classList.remove('dragging');
  });

  /* --- Swipe com toque (mobile) --- */
  track.addEventListener('touchstart', function(e) {
    arrasto = { ativo: true, x0: e.touches[0].clientX, scrollInicial: track.scrollLeft };
  }, { passive: true });

  track.addEventListener('touchmove', function(e) {
    if (!arrasto.ativo) return;
    track.scrollLeft = arrasto.scrollInicial + arrasto.x0 - e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', function() {
    arrasto.ativo = false;
  });

  /* --- Ajusta largura dos slides conforme o viewport --- */
  function ajustarSlides() {
    var mobile = window.innerWidth < 768;
    slides.forEach(function(slide) {
      slide.style.width    = mobile ? 'calc(100vw - 80px)' : '';
      slide.style.minWidth = mobile ? 'calc(100vw - 80px)' : '';
    });
    dotsEl.style.display = mobile ? 'flex' : 'none';
  }

  ajustarSlides();
  window.addEventListener('resize', ajustarSlides);
}

/* Inicializa os sliders da página */
iniciarSlider('steps-track', 'steps-dots');
iniciarSlider('srv-track',   'srv-dots');


/* ──────────────────────────────────────
   5. GLOWING GRID CARDS — Serviços
   Rastreia o cursor sobre o grid de serviços.
   Para cada card:
     - calcula posição do cursor relativa ao card
       e atualiza --gx / --gy (centro do glow)
     - ativa --glow-opacity: 1 ao entrar
     - nos cards adjacentes (srv-normal), sobe
       --border-glow proporcional à proximidade
   Funciona apenas em dispositivos com mouse
   (pointer: fine) para não interferir no touch.
────────────────────────────────────── */
(function() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  var track = document.getElementById('srv-track');
  if (!track) return;

  function getCards() {
    return Array.from(track.querySelectorAll('.srv-card'));
  }

  function resetCards(cards) {
    cards.forEach(function(card) {
      card.style.setProperty('--glow-opacity', '0');
      card.style.setProperty('--border-glow', '0');
    });
  }

  track.addEventListener('mousemove', function(e) {
    var cards = getCards();

    cards.forEach(function(card) {
      var rect    = card.getBoundingClientRect();
      var cx      = e.clientX - rect.left;
      var cy      = e.clientY - rect.top;

      /* Cursor está sobre este card? */
      var isOver  = cx >= 0 && cy >= 0 && cx <= rect.width && cy <= rect.height;

      if (isOver) {
        /* Posição relativa em % para o radial-gradient */
        var pct_x = (cx / rect.width)  * 100;
        var pct_y = (cy / rect.height) * 100;
        card.style.setProperty('--gx',           pct_x + '%');
        card.style.setProperty('--gy',           pct_y + '%');
        card.style.setProperty('--glow-opacity', '1');
      } else {
        card.style.setProperty('--glow-opacity', '0');
      }

      /* Border glow em srv-normal — baseado na distância ao cursor */
      if (card.classList.contains('srv-normal')) {
        var nearX   = Math.max(rect.left, Math.min(e.clientX, rect.right));
        var nearY   = Math.max(rect.top,  Math.min(e.clientY, rect.bottom));
        var dist    = Math.sqrt(
          Math.pow(e.clientX - nearX, 2) +
          Math.pow(e.clientY - nearY, 2)
        );
        /* Raio de influência: 220px → glow máximo = 0.55 */
        var maxDist = 220;
        var glow    = isOver ? 0.55 : Math.max(0, (1 - dist / maxDist) * 0.55);
        card.classList.toggle('glow-border', glow > 0);
        card.style.setProperty('--border-glow', glow.toFixed(3));
      }
    });
  });

  track.addEventListener('mouseleave', function() {
    resetCards(getCards());
  });
}());