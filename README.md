# MonkMind

A quiz platform built with vanilla HTML, CSS, and JavaScript where users can create custom quizzes, browse quizzes made by others, and test their knowledge with a timed, interactive quiz experience.

## Overview

MonkMind started as a way to practice building a complete, multi-page web application without relying on a framework. It covers a full user flow — registration and login, quiz creation with a dynamic question builder, browsing with search and filters, a timed quiz-taking experience, and a results screen with a detailed answer review.

There's no backend here by design. All data (users, quizzes, and quiz attempts) is stored in the browser via `localStorage`, so the project focuses on front-end architecture: state management, DOM rendering, and UI/UX without the overhead of a server.

## Live Demo

https://monkmind.netlify.app/

## Key Features

- **User accounts** — register and log in; session persists across page reloads
- **Quiz builder** — create quizzes with a title, category, difficulty, description, and an expandable accordion for adding/removing multiple-choice questions
- **Browse and filter** — search quizzes by keyword and filter by category or difficulty
- **Timed quiz mode** — 30-second-per-question timer with auto-advance, progress bar, and previous/next navigation
- **Results and review** — animated accuracy ring, score breakdown, and a question-by-question review showing correct vs. selected answers
- **Live stats** — homepage tracks total quizzes, total attempts, and average score across all attempts
- **Responsive design** — works across desktop, tablet, and mobile
- **Accessibility** — keyboard-navigable answer options (radiogroup pattern with arrow-key support), a focus-trapped login/register modal with `Escape`-to-close, and proper `aria-expanded` states on the nav menu and question accordion

## Tech Stack

- **HTML5** — semantic markup
- **CSS3** — custom properties, Flexbox, Grid, responsive breakpoints, `prefers-reduced-motion` support
- **JavaScript (ES6+)** — vanilla JS, no frameworks or build tools
- **Web APIs** — `localStorage` for data persistence, Canvas API for the confetti animation
- **Google Fonts** — Poppins and Montserrat

## Project Structure

```
monkmind/
├── index.html          # Main HTML file — all pages/sections live here
├── style.css            # All styling, including responsive rules
├── script.js             # App logic: routing, auth, quiz builder, quiz engine
├── logo.png              # App logo and favicon
└── README.md
```

Since this is a single-page application without routing, `index.html` contains all "pages" (home, create quiz, browse, play, result) as sections that are toggled via JavaScript.

## Installation and Setup

No dependencies or build step required.

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/monkmind.git
   cd monkmind
   ```

2. Open `index.html` directly in a browser, **or** serve it with a local server (recommended, so fonts and relative paths behave consistently):
   ```bash
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

## Usage

1. Click **Login** to register a new account or sign in.
2. Go to **Create Quiz** to build a quiz — add a title, category, difficulty, description, and at least one question with four answer options.
3. Go to **Browse Quizzes** to search and filter quizzes by category or difficulty.
4. Click **Start Quiz** to begin — each question has a 30-second timer, and answers can be selected with a mouse or keyboard.
5. After the last question, submit to see your score, accuracy percentage, and a full review of correct and incorrect answers.

**Note:** Since there's no backend, accounts and quizzes are stored per-browser via `localStorage`. Passwords are not hashed — this is a front-end demo project, not a production authentication system.

## Future Improvements

- Replace `localStorage` with a real backend (Node/Express + a database) for persistent, cross-device data
- Add proper authentication with password hashing and session tokens
- Allow editing and deleting existing quizzes
- Add a per-user dashboard showing quiz history and performance over time
- Add unit tests for scoring and filtering logic
- Dark mode toggle
- PWA support for offline quiz-taking

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built by [Your Name] — [your.email@example.com](mailto:your.email@example.com) · [LinkedIn](#) · [GitHub](#)
