(function(){
  "use strict";

  const LS_QUIZZES = "monkmind_quizzes";
  const LS_USERS = "monkmind_users";
  const LS_SESSION = "monkmind_session";
  const LS_ATTEMPTS = "monkmind_attempts";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function getLS(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function setLS(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }

  function showToast(msg){
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function seedIfEmpty(){
    const quizzes = getLS(LS_QUIZZES, []);
    if (quizzes.length) return;

    const demo = [
      {
        id: uid(), title: "World Capitals Challenge", category: "Geography", difficulty: "Easy",
        description: "Test how well you know the capitals of the world.",
        createdAt: Date.now(),
        questions: [
          { text:"What is the capital of Japan?", options:["Seoul","Tokyo","Beijing","Bangkok"], correct:1 },
          { text:"What is the capital of France?", options:["Lyon","Marseille","Paris","Nice"], correct:2 },
          { text:"What is the capital of Australia?", options:["Sydney","Melbourne","Canberra","Perth"], correct:2 },
          { text:"What is the capital of Egypt?", options:["Cairo","Giza","Alexandria","Luxor"], correct:0 },
        ]
      },
      {
        id: uid(), title: "Science Basics", category: "Science", difficulty: "Medium",
        description: "A quick sweep through fundamental science facts.",
        createdAt: Date.now(),
        questions: [
          { text:"What planet is known as the Red Planet?", options:["Venus","Mars","Jupiter","Saturn"], correct:1 },
          { text:"What gas do plants absorb from the atmosphere?", options:["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"], correct:2 },
          { text:"How many bones are in the adult human body?", options:["206","201","210","198"], correct:0 },
        ]
      },
      {
        id: uid(), title: "Logic & Brain Teasers", category: "Logic", difficulty: "Hard",
        description: "Sharpen your mind with tricky logic puzzles.",
        createdAt: Date.now(),
        questions: [
          { text:"If a clock takes 6 seconds to strike 6, how long to strike 12?", options:["12s","11s","13.2s","6s"], correct:2 },
          { text:"Which number comes next: 2, 6, 12, 20, ?", options:["28","30","26","32"], correct:1 },
        ]
      }
    ];
    setLS(LS_QUIZZES, demo);
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      $("#loadingScreen").classList.add("fade-out");
    }, 700);
  });

  const pages = $$(".page");
  function goTo(pageId){
    pages.forEach(p => p.classList.toggle("active-page", p.id === pageId));
    window.scrollTo({top:0, behavior:"smooth"});
    setNavOpen(false);
    if (pageId === "browse") renderQuizGrid();
    if (pageId === "home") renderStats();
  }
  $$("[data-nav]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(el.dataset.nav);
    });
  });

  const navToggleBtn = $("#navToggle");
  const navLinksEl = $("#navLinks");
  function setNavOpen(open){
    navLinksEl.classList.toggle("open", open);
    navToggleBtn.setAttribute("aria-expanded", String(open));
  }
  navToggleBtn.addEventListener("click", () => {
    setNavOpen(!navLinksEl.classList.contains("open"));
  });

  const authModal = $("#authModal");
  const authModalCard = $(".modal-card", authModal);
  let lastFocusedEl = null;

  function getFocusable(container){
    return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
      .filter(el => el.offsetParent !== null);
  }

  function openAuthModal(){
    lastFocusedEl = document.activeElement;
    authModal.classList.remove("hidden");
    const focusables = getFocusable(authModalCard);
    (focusables[0] || authModalCard).focus();
  }
  function closeAuthModal(){
    authModal.classList.add("hidden");
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  $("#authNavBtn").addEventListener("click", (e) => {
    e.preventDefault();
    if (getSession()) return; // already logged in, nav button hidden anyway
    openAuthModal();
  });
  $("#authModalClose").addEventListener("click", closeAuthModal);
  authModal.addEventListener("click", (e) => { if (e.target === authModal) closeAuthModal(); });

  authModal.addEventListener("keydown", (e) => {
    if (authModal.classList.contains("hidden")) return;
    if (e.key === "Escape"){
      closeAuthModal();
      return;
    }
    if (e.key === "Tab"){
      const focusables = getFocusable(authModalCard);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first){
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    }
  });

  $$(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      $$(".auth-tab").forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const isLogin = tab.dataset.tab === "login";
      $("#loginForm").classList.toggle("hidden", !isLogin);
      $("#registerForm").classList.toggle("hidden", isLogin);
      const focusables = getFocusable(isLogin ? $("#loginForm") : $("#registerForm"));
      if (focusables[0]) focusables[0].focus();
    });
  });

  function getSession(){ return getLS(LS_SESSION, null); }
  function setSession(user){ setLS(LS_SESSION, user); refreshAuthUI(); }
  function clearSession(){ localStorage.removeItem(LS_SESSION); refreshAuthUI(); }

  function refreshAuthUI(){
    const session = getSession();
    if (session){
      $("#authNavBtn").classList.add("hidden");
      $("#userPill").classList.remove("hidden");
      $("#userPillName").textContent = session.name;
    } else {
      $("#authNavBtn").classList.remove("hidden");
      $("#userPill").classList.add("hidden");
    }
  }

  $("#logoutBtn").addEventListener("click", () => {
    clearSession();
    showToast("Logged out. See you soon!");
  });

  $("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#registerName").value.trim();
    const email = $("#registerEmail").value.trim().toLowerCase();
    const password = $("#registerPassword").value;
    if (!name || !email || !password) return;

    const users = getLS(LS_USERS, []);
    if (users.some(u => u.email === email)){
      showToast("An account with this email already exists.");
      return;
    }
    const user = { id: uid(), name, email, password };
    users.push(user);
    setLS(LS_USERS, users);
    setSession({ id:user.id, name:user.name, email:user.email });
    authModal.classList.add("hidden");
    e.target.reset();
    showToast(`Welcome to MonkMind, ${name}!`);
  });

  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#loginEmail").value.trim().toLowerCase();
    const password = $("#loginPassword").value;
    const users = getLS(LS_USERS, []);
    const user = users.find(u => u.email === email && u.password === password);
    if (!user){
      showToast("Incorrect email or password.");
      return;
    }
    setSession({ id:user.id, name:user.name, email:user.email });
    authModal.classList.add("hidden");
    e.target.reset();
    showToast(`Welcome back, ${user.name}!`);
  });

  function renderStats(){
    const quizzes = getLS(LS_QUIZZES, []);
    const attempts = getLS(LS_ATTEMPTS, []);
    $("#statQuizzes").textContent = quizzes.length;
    $("#statAttempts").textContent = attempts.length;
    const avg = attempts.length
      ? Math.round(attempts.reduce((s,a) => s + a.accuracy, 0) / attempts.length)
      : 0;
    $("#statAvgScore").textContent = avg + "%";
  }

  let draftQuestions = [];

  function newQuestion(){
    return { id: uid(), text:"", options:["","","",""], correct: 0 };
  }

  function renderAccordion(){
    const wrap = $("#questionsAccordion");
    wrap.innerHTML = "";
    draftQuestions.forEach((q, idx) => {
      const item = document.createElement("div");
      item.className = "accordion-item";
      const isOpen = idx === draftQuestions.length-1;
      const bodyId = `accordion-body-${idx}`;
      item.innerHTML = `
        <div class="accordion-header" data-idx="${idx}" role="button" tabindex="0"
             aria-expanded="${isOpen}" aria-controls="${bodyId}">
          <span class="q-num">Question ${idx+1} ${q.text ? "— " + escapeHtml(q.text.slice(0,40)) : ""}</span>
          <div>
            <button type="button" class="del-q" data-del="${idx}" aria-label="Delete question ${idx+1}">🗑</button>
          </div>
        </div>
        <div class="accordion-body ${isOpen ? 'open' : ''}" id="${bodyId}">
          <div class="form-group">
            <label>Question Text</label>
            <input type="text" class="q-text" data-idx="${idx}" value="${escapeHtml(q.text)}" placeholder="Enter your question">
          </div>
          <div class="options-edit-grid">
            ${["A","B","C","D"].map((letter,i) => `
              <div class="option-edit">
                <label>${letter}</label>
                <input type="text" class="q-opt" data-idx="${idx}" data-opt="${i}" value="${escapeHtml(q.options[i])}" placeholder="Option ${letter}">
              </div>
            `).join("")}
          </div>
          <div class="form-group correct-select">
            <label>Correct Answer</label>
            <select class="q-correct" data-idx="${idx}">
              ${["A","B","C","D"].map((letter,i) => `<option value="${i}" ${q.correct===i?"selected":""}>${letter}</option>`).join("")}
            </select>
          </div>
        </div>
      `;
      wrap.appendChild(item);
    });

    // header toggle
    function toggleAccordionItem(h){
      const body = h.nextElementSibling;
      const wasOpen = body.classList.contains("open");
      $$(".accordion-body", wrap).forEach(b => b.classList.remove("open"));
      $$(".accordion-header", wrap).forEach(hh => hh.setAttribute("aria-expanded", "false"));
      if (!wasOpen){
        body.classList.add("open");
        h.setAttribute("aria-expanded", "true");
      }
    }
    $$(".accordion-header", wrap).forEach(h => {
      h.addEventListener("click", () => toggleAccordionItem(h));
      h.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar"){
          e.preventDefault();
          toggleAccordionItem(h);
        }
      });
    });
    // delete
    $$("[data-del]", wrap).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        draftQuestions.splice(Number(btn.dataset.del), 1);
        renderAccordion();
      });
    });
    // inputs
    $$(".q-text", wrap).forEach(inp => inp.addEventListener("input", () => {
      draftQuestions[inp.dataset.idx].text = inp.value;
    }));
    $$(".q-opt", wrap).forEach(inp => inp.addEventListener("input", () => {
      draftQuestions[inp.dataset.idx].options[inp.dataset.opt] = inp.value;
    }));
    $$(".q-correct", wrap).forEach(sel => sel.addEventListener("change", () => {
      draftQuestions[sel.dataset.idx].correct = Number(sel.value);
    }));
  }

  function resetCreateForm(){
    $("#quizTitle").value = "";
    $("#quizCategory").value = "";
    $("#quizDifficulty").value = "Medium";
    $("#quizDescription").value = "";
    draftQuestions = [newQuestion()];
    renderAccordion();
  }
  resetCreateForm();

  $("#addQuestionBtn").addEventListener("click", () => {
    draftQuestions.push(newQuestion());
    renderAccordion();
  });

  $("#saveQuizBtn").addEventListener("click", () => {
    const title = $("#quizTitle").value.trim();
    const category = $("#quizCategory").value.trim() || "General";
    const difficulty = $("#quizDifficulty").value;
    const description = $("#quizDescription").value.trim();

    if (!title){ showToast("Please give your quiz a title."); return; }
    if (!draftQuestions.length){ showToast("Add at least one question."); return; }

    for (const q of draftQuestions){
      if (!q.text.trim() || q.options.some(o => !o.trim())){
        showToast("Fill out all question text and options before saving.");
        return;
      }
    }

    const quizzes = getLS(LS_QUIZZES, []);
    quizzes.unshift({
      id: uid(), title, category, difficulty, description,
      createdAt: Date.now(),
      questions: draftQuestions.map(q => ({ text:q.text, options:q.options, correct:q.correct }))
    });
    setLS(LS_QUIZZES, quizzes);
    showToast("Quiz saved! 🎉");
    resetCreateForm();
    goTo("browse");
  });

  function populateCategoryFilter(){
    const quizzes = getLS(LS_QUIZZES, []);
    const cats = Array.from(new Set(quizzes.map(q => q.category))).sort();
    const sel = $("#categoryFilter");
    const current = sel.value;
    sel.innerHTML = `<option value="">All Categories</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    sel.value = current;
  }

  function renderQuizGrid(){
    populateCategoryFilter();
    const quizzes = getLS(LS_QUIZZES, []);
    const search = $("#searchInput").value.trim().toLowerCase();
    const cat = $("#categoryFilter").value;
    const diff = $("#difficultyFilter").value;

    const filtered = quizzes.filter(q => {
      const matchSearch = !search || q.title.toLowerCase().includes(search) || q.category.toLowerCase().includes(search);
      const matchCat = !cat || q.category === cat;
      const matchDiff = !diff || q.difficulty === diff;
      return matchSearch && matchCat && matchDiff;
    });

    const grid = $("#quizGrid");
    grid.innerHTML = "";
    $("#emptyQuizMsg").classList.toggle("hidden", filtered.length > 0);

    filtered.forEach(q => {
      const card = document.createElement("div");
      card.className = "quiz-card";
      card.innerHTML = `
        <span class="quiz-card-tag">${escapeHtml(q.category)} · ${escapeHtml(q.difficulty)}</span>
        <h3>${escapeHtml(q.title)}</h3>
        <p class="quiz-desc">${escapeHtml(q.description || "No description provided.")}</p>
        <div class="quiz-card-meta">
          <span>${q.questions.length} Questions</span>
        </div>
        <button class="btn btn-yellow full-width start-quiz-btn" data-id="${q.id}">Start Quiz</button>
      `;
      grid.appendChild(card);
    });

    $$(".start-quiz-btn", grid).forEach(btn => {
      btn.addEventListener("click", () => startQuiz(btn.dataset.id));
    });
  }

  ["input","change"].forEach(evt => {
    $("#searchInput").addEventListener(evt, renderQuizGrid);
    $("#categoryFilter").addEventListener(evt, renderQuizGrid);
    $("#difficultyFilter").addEventListener(evt, renderQuizGrid);
  });

  let activeQuiz = null;
  let currentIndex = 0;
  let userAnswers = [];
  let timerInterval = null;
  let timeLeft = 30;

  function startQuiz(quizId){
    const quizzes = getLS(LS_QUIZZES, []);
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    activeQuiz = quiz;
    currentIndex = 0;
    userAnswers = new Array(quiz.questions.length).fill(null);
    goTo("play");
    renderQuestion();
  }

  function renderQuestion(){
    clearInterval(timerInterval);
    const q = activeQuiz.questions[currentIndex];
    $("#questionCounter").textContent = `Question ${currentIndex+1} of ${activeQuiz.questions.length}`;
    $("#questionText").textContent = q.text;

    const pct = ((currentIndex) / activeQuiz.questions.length) * 100;
    $("#progressBarFill").style.width = pct + "%";

    const grid = $("#optionsGrid");
    grid.innerHTML = "";
    grid.setAttribute("role", "radiogroup");
    grid.setAttribute("aria-label", "Answer options");
    const letters = ["A","B","C","D"];
    const selectedIdx = userAnswers[currentIndex];
    const optionBtns = q.options.map((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn" + (selectedIdx === i ? " selected" : "");
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(selectedIdx === i));
      btn.setAttribute("aria-label", `Option ${letters[i]}: ${opt}`);
      // roving tabindex: the selected option (or first option if none selected) is the only tab stop
      const isRovingStop = selectedIdx === i || (selectedIdx === null && i === 0);
      btn.tabIndex = isRovingStop ? 0 : -1;
      btn.innerHTML = `<span class="opt-letter" aria-hidden="true">${letters[i]}</span><span>${escapeHtml(opt)}</span>`;
      btn.addEventListener("click", () => {
        userAnswers[currentIndex] = i;
        renderQuestion();
        requestAnimationFrame(() => $$(".option-btn", $("#optionsGrid"))[i].focus());
      });
      grid.appendChild(btn);
      return btn;
    });

    grid.addEventListener("keydown", (e) => {
      const withinArrows = ["ArrowDown","ArrowRight","ArrowUp","ArrowLeft"];
      if (!withinArrows.includes(e.key)) return;
      e.preventDefault();
      const currentFocusIdx = optionBtns.indexOf(document.activeElement);
      if (currentFocusIdx === -1) return;
      const dir = (e.key === "ArrowDown" || e.key === "ArrowRight") ? 1 : -1;
      const nextIdx = (currentFocusIdx + dir + optionBtns.length) % optionBtns.length;
      optionBtns.forEach((b, i) => b.tabIndex = i === nextIdx ? 0 : -1);
      optionBtns[nextIdx].focus();
    });

    $("#prevBtn").disabled = currentIndex === 0;
    $("#prevBtn").style.visibility = currentIndex === 0 ? "hidden" : "visible";
    const isLast = currentIndex === activeQuiz.questions.length - 1;
    $("#nextBtn").classList.toggle("hidden", isLast);
    $("#submitBtn").classList.toggle("hidden", !isLast);

    startTimer();
  }

  function startTimer(){
    timeLeft = 30;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0){
        clearInterval(timerInterval);
        goNext(true);
      }
    }, 1000);
  }
  function updateTimerDisplay(){
    const el = $("#timerDisplay");
    el.textContent = `⏱ ${timeLeft}s`;
    el.classList.toggle("low", timeLeft <= 10);
  }

  function goNext(auto){
    if (currentIndex < activeQuiz.questions.length - 1){
      currentIndex++;
      renderQuestion();
    } else if (auto){
      finishQuiz();
    }
  }

  $("#nextBtn").addEventListener("click", () => goNext(false));
  $("#prevBtn").addEventListener("click", () => {
    if (currentIndex > 0){ currentIndex--; renderQuestion(); }
  });
  $("#submitBtn").addEventListener("click", finishQuiz);
  $("#quitQuizBtn").addEventListener("click", () => {
    clearInterval(timerInterval);
    goTo("browse");
  });

  function finishQuiz(){
    clearInterval(timerInterval);
    let correct = 0;
    activeQuiz.questions.forEach((q, i) => {
      if (userAnswers[i] === q.correct) correct++;
    });
    const total = activeQuiz.questions.length;
    const wrong = total - correct;
    const accuracy = total ? Math.round((correct/total)*100) : 0;

    const attempts = getLS(LS_ATTEMPTS, []);
    attempts.push({ id: uid(), quizId: activeQuiz.id, quizTitle: activeQuiz.title, correct, wrong, total, accuracy, date: Date.now() });
    setLS(LS_ATTEMPTS, attempts);

    renderResult(correct, wrong, total, accuracy);
    goTo("result");
  }

  function renderResult(correct, wrong, total, accuracy){
    $("#resultQuizName").textContent = activeQuiz.title;
    $("#resultScore").textContent = `${correct}/${total}`;
    $("#resultCorrect").textContent = correct;
    $("#resultWrong").textContent = wrong;
    $("#cpPercent").textContent = accuracy + "%";

    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (accuracy/100) * circumference;
    const fill = $("#cpFill");
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => { fill.style.strokeDashoffset = offset; });

    const letters = ["A","B","C","D"];
    const reviewList = $("#reviewList");
    reviewList.innerHTML = "";
    activeQuiz.questions.forEach((q, i) => {
      const userIdx = userAnswers[i];
      const isCorrect = userIdx === q.correct;
      const item = document.createElement("div");
      item.className = "review-item " + (isCorrect ? "is-correct" : "is-wrong");
      item.innerHTML = `
        <div class="review-q">${i+1}. ${escapeHtml(q.text)}</div>
        <div class="review-ans ${isCorrect ? 'your-correct' : 'your-wrong'}">
          Your answer: ${userIdx===null ? "No answer" : letters[userIdx] + " — " + escapeHtml(q.options[userIdx])}
        </div>
        ${!isCorrect ? `<div class="review-ans your-correct">Correct answer: ${letters[q.correct]} — ${escapeHtml(q.options[q.correct])}</div>` : ""}
      `;
      reviewList.appendChild(item);
    });

    if (accuracy > 70){
      launchConfetti();
    }
  }

  $("#retakeBtn").addEventListener("click", () => {
    currentIndex = 0;
    userAnswers = new Array(activeQuiz.questions.length).fill(null);
    goTo("play");
    renderQuestion();
  });
  $("#backHomeBtn").addEventListener("click", () => goTo("home"));

  function launchConfetti(){
    const canvas = $("#confettiCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    const colors = ["#FFD700","#1D4ED8","#22C55E","#EF4444","#FFFFFF"];
    const pieces = Array.from({length:140}, () => ({
      x: Math.random()*canvas.width,
      y: -20 - Math.random()*canvas.height*0.5,
      r: 4 + Math.random()*5,
      c: colors[Math.floor(Math.random()*colors.length)],
      vy: 2 + Math.random()*3,
      vx: -1.5 + Math.random()*3,
      rot: Math.random()*360,
      vr: -6 + Math.random()*12
    }));
    let frame = 0;
    function tick(){
      frame++;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.6);
        ctx.restore();
      });
      if (frame < 160){
        requestAnimationFrame(tick);
      } else {
        canvas.style.display = "none";
        ctx.clearRect(0,0,canvas.width,canvas.height);
      }
    }
    tick();
  }

  seedIfEmpty();
  refreshAuthUI();
  renderStats();
  goTo("home");

})();