import type { UserProfile } from "@/lib/types"

/** Escapes text for use inside LaTeX. */
function tex(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
}

/**
 * Starter LaTeX resume (same as knot-server/latex/starter-resume.tex, which is
 * also compiled into the server image so its packages are cached).
 */
export function starterLatexResume(profile?: UserProfile): string {
  const name = tex(profile?.name || "Your Name")
  const email = profile?.email || "you@example.com"
  const location = tex(profile?.location || "City, Country")
  return String.raw`% knot resume — compiled with Tectonic (XeLaTeX).
% Ctrl+S saves and recompiles. Common packages are available.
\documentclass[10.5pt]{article}

\usepackage[margin=0.65in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{xcolor}
\usepackage{tabularx}

\definecolor{accent}{HTML}{1F4E79}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlist[itemize]{leftmargin=1.1em, itemsep=1pt, topsep=2pt}

\titleformat{\section}{\large\bfseries\color{accent}}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{10pt}{5pt}

% \role{Title}{Company}{Location}{Dates}
\newcommand{\role}[4]{%
  \textbf{#1} \hfill #4\\
  \textit{#2} \hfill \textit{#3}\par\vspace{2pt}}

\begin{document}

\begin{center}
  {\LARGE\bfseries ${name}}\\[4pt]
  ${location} \;|\; \href{mailto:${email}}{${tex(email)}} \;|\;
  +91 00000 00000 \;|\; \href{https://linkedin.com/in/you}{linkedin.com/in/you} \;|\;
  \href{https://github.com/you}{github.com/you}
\end{center}

\section{Summary}
Frontend engineer focused on React, Next.js and TypeScript. Builds fast, accessible
interfaces and cares about developer experience.

\section{Experience}
\role{Senior Frontend Engineer}{Company Name}{Remote}{2023 -- Present}
\begin{itemize}
  \item Led the migration of a large dashboard to Next.js, cutting load time by 40\%.
  \item Built a component library used by five product teams.
\end{itemize}

\role{Frontend Engineer}{Previous Company}{Chennai, India}{2020 -- 2023}
\begin{itemize}
  \item Shipped features end to end across React, Node.js and PostgreSQL.
\end{itemize}

\section{Skills}
\begin{tabularx}{\linewidth}{@{}l X@{}}
  \textbf{Languages} & TypeScript, JavaScript, SQL \\
  \textbf{Frameworks} & React, Next.js, React Native, Node.js \\
  \textbf{Tools} & AWS, Docker, Git, Figma \\
\end{tabularx}

\section{Education}
\role{B.E. Computer Science}{University Name}{City}{2016 -- 2020}

\end{document}
`
}
