import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Theme, Language } from './StartScreen';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MonteCarloPiProps {
  theme: Theme;
  language: Language;
  onBack: () => void;
}

const translations = {
  sl: {
    title: 'Monte Carlo π',
    subtitle: 'Izračun vrednosti π z naključnimi točkami',
    points: 'Število točk',
    run: 'Zaženi',
    reset: 'Ponastavi',
    back: '←',
    inside: 'V krogu',
    outside: 'Izven',
    total: 'Skupaj',
    estimated_pi: 'Ocena π',
    actual_pi: 'Dejanski π',
    error: 'Napaka',
    speed: 'Hitrost',
    slow: 'Počasi',
    fast: 'Hitro',
    instant: 'Takoj',
    how_it_works: 'Kako deluje?',
    theory: 'Teorija',
    practice: 'Praksa',
    explanation: {
      intro: 'Metoda Monte Carlo je tehnika, ki uporablja naključno vzorčenje za numerično reševanje problemov.',
      step1_title: '1. Geometrija',
      step1_text: 'Imamo kvadrat s stranico 1 in četrtino kroga z radijem 1 v kotu.',
      step2_title: '2. Ploščini',
      step2_text: 'Ploščina kvadrata je 1. Ploščina četrtine kroga je π/4.',
      step3_title: '3. Verjetnost',
      step3_text: 'Verjetnost, da točka pade v krog:',
      step4_title: '4. Formula za π',
      step4_text: 'Iz razmerja točk izračunamo:',
      step5_title: '5. Pogoj za krog',
      step5_text: 'Točka je v krogu, če velja:',
      step5_detail: 'Razdalja do izhodišča ≤ radij.',
      step6_title: '6. Natančnost',
      step6_text: 'Več točk = boljši rezultat.',
      step7_title: '7. Konvergenca',
      step7_text: 'Napaka pada s korenom števila točk:',
      step7_detail: 'Za 10× boljšo natančnost potrebujemo 100× več točk.',
      step8_title: '8. Uporaba',
      step8_text: 'Monte Carlo se uporablja v fiziki, financah, strojnem učenju in povsod, kjer analitična rešitev ni možna.',
      conclusion: 'Več točk → bližje π ≈ 3.14159...',
    }
  },
  en: {
    title: 'Monte Carlo π',
    subtitle: 'Estimating π using random points',
    points: 'Number of points',
    run: 'Run',
    reset: 'Reset',
    back: '←',
    inside: 'Inside',
    outside: 'Outside',
    total: 'Total',
    estimated_pi: 'Estimated π',
    actual_pi: 'Actual π',
    error: 'Error',
    speed: 'Speed',
    slow: 'Slow',
    fast: 'Fast',
    instant: 'Instant',
    how_it_works: 'How does it work?',
    theory: 'Theory',
    practice: 'Practice',
    explanation: {
      intro: 'Monte Carlo method uses random sampling to numerically solve problems.',
      step1_title: '1. Geometry',
      step1_text: 'We have a unit square and a quarter circle with radius 1.',
      step2_title: '2. Areas',
      step2_text: 'Square area is 1. Quarter circle area is π/4.',
      step3_title: '3. Probability',
      step3_text: 'Probability of landing in circle:',
      step4_title: '4. Formula for π',
      step4_text: 'From the ratio of points we calculate:',
      step5_title: '5. Circle condition',
      step5_text: 'Point is inside if:',
      step5_detail: 'Distance to origin ≤ radius.',
      step6_title: '6. Accuracy',
      step6_text: 'More points = better result.',
      step7_title: '7. Convergence',
      step7_text: 'Error decreases with square root of points:',
      step7_detail: 'For 10× better accuracy we need 100× more points.',
      step8_title: '8. Applications',
      step8_text: 'Monte Carlo is used in physics, finance, machine learning, and wherever analytical solution is not possible.',
      conclusion: 'More points → closer to π ≈ 3.14159...',
    }
  },
  de: {
    title: 'Monte Carlo π',
    subtitle: 'Berechnung von π mit Zufallspunkten',
    points: 'Anzahl der Punkte',
    run: 'Start',
    reset: 'Reset',
    back: '←',
    inside: 'Innen',
    outside: 'Außen',
    total: 'Gesamt',
    estimated_pi: 'Geschätztes π',
    actual_pi: 'Tatsächliches π',
    error: 'Fehler',
    speed: 'Geschwindigkeit',
    slow: 'Langsam',
    fast: 'Schnell',
    instant: 'Sofort',
    how_it_works: 'Wie funktioniert es?',
    theory: 'Theorie',
    practice: 'Praxis',
    explanation: {
      intro: 'Monte-Carlo-Methode nutzt Zufallsstichproben zur numerischen Lösung.',
      step1_title: '1. Geometrie',
      step1_text: 'Einheitsquadrat und Viertelkreis mit Radius 1.',
      step2_title: '2. Flächen',
      step2_text: 'Quadrat = 1. Viertelkreis = π/4.',
      step3_title: '3. Wahrscheinlichkeit',
      step3_text: 'Wahrscheinlichkeit im Kreis:',
      step4_title: '4. Formel für π',
      step4_text: 'Aus dem Punktverhältnis berechnen wir:',
      step5_title: '5. Kreisbedingung',
      step5_text: 'Punkt ist innen, wenn:',
      step5_detail: 'Abstand zum Ursprung ≤ Radius.',
      step6_title: '6. Genauigkeit',
      step6_text: 'Mehr Punkte = besseres Ergebnis.',
      step7_title: '7. Konvergenz',
      step7_text: 'Fehler sinkt mit Wurzel der Punktzahl:',
      step7_detail: 'Für 10× bessere Genauigkeit 100× mehr Punkte.',
      step8_title: '8. Anwendungen',
      step8_text: 'Monte Carlo wird in Physik, Finanzen, ML und überall verwendet, wo analytische Lösung unmöglich ist.',
      conclusion: 'Mehr Punkte → näher an π ≈ 3.14159...',
    }
  }
};

export const MonteCarloPi: React.FC<MonteCarloPiProps> = ({ theme, language, onBack }) => {
  const t = translations[language];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [numPoints, setNumPoints] = useState(100000);
  const [insideCount, setInsideCount] = useState(0);
  const [outsideCount, setOutsideCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'fast' | 'instant'>('fast');
  const [points, setPoints] = useState<{x: number, y: number, inside: boolean}[]>([]);
  const [canvasSize, setCanvasSize] = useState(500);
  
  const animationRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);

  // Calculate canvas size based on viewport
  useEffect(() => {
    const updateCanvasSize = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // Canvas should be max 60% of viewport height or 40% of width
      const maxByHeight = Math.floor(vh * 0.65);
      const maxByWidth = Math.floor(vw * 0.35);
      const size = Math.min(maxByHeight, maxByWidth, 700);
      setCanvasSize(Math.max(300, size)); // minimum 300px
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Generate all points at once
  const generatePoints = useCallback((count: number) => {
    const newPoints: {x: number, y: number, inside: boolean}[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random();
      const y = Math.random();
      const distance = Math.sqrt(x * x + y * y);
      newPoints.push({ x, y, inside: distance <= 1 });
    }
    return newPoints;
  }, []);

  // Draw canvas
  const drawCanvas = useCallback((pointsToDraw: {x: number, y: number, inside: boolean}[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = theme === 'light' ? '#f8fafc' : 
                    theme === 'glass' ? 'rgba(255,255,255,0.1)' : '#1a1a2e';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw quarter circle - polmer je enak velikosti canvasa
    ctx.beginPath();
    ctx.arc(0, canvasSize, canvasSize, -Math.PI/2, 0);
    ctx.lineTo(0, canvasSize);
    ctx.closePath();
    ctx.fillStyle = theme === 'glass' ? 'rgba(99, 102, 241, 0.3)' :
                    theme === 'light' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.35)';
    ctx.fill();
    ctx.strokeStyle = theme === 'light' ? '#6366f1' : '#a5b4fc';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw points
    pointsToDraw.forEach(point => {
      const canvasX = point.x * canvasSize;
      const canvasY = canvasSize - (point.y * canvasSize);
      
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = point.inside ? '#22c55e' : '#ef4444';
      ctx.fill();
    });

    // Draw border
    ctx.strokeStyle = theme === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasSize, canvasSize);
  }, [theme, canvasSize]);

  // Animation loop
  const animate = useCallback(() => {
    if (currentIndexRef.current >= points.length) {
      setIsRunning(false);
      return;
    }

    // Batch size glede na hitrost
    // slow: 500 točk na frame, fast: 5000 točk, instant: vse naenkrat
    const batchSize = speed === 'slow' 
      ? Math.max(500, Math.floor(points.length / 200))
      : speed === 'fast' 
        ? Math.max(5000, Math.floor(points.length / 50))
        : points.length;
    
    const endIndex = Math.min(currentIndexRef.current + batchSize, points.length);
    
    let newInside = insideCount;
    let newOutside = outsideCount;
    
    for (let i = currentIndexRef.current; i < endIndex; i++) {
      if (points[i].inside) {
        newInside++;
      } else {
        newOutside++;
      }
    }
    
    setInsideCount(newInside);
    setOutsideCount(newOutside);
    currentIndexRef.current = endIndex;
    
    drawCanvas(points.slice(0, endIndex));
    
    if (currentIndexRef.current < points.length) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsRunning(false);
    }
  }, [points, speed, insideCount, outsideCount, drawCanvas]);

  // Instant - preskoči animacijo in pokaži vse
  const finishInstant = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (points.length === 0) return;
    
    let newInside = 0;
    let newOutside = 0;
    
    for (let i = 0; i < points.length; i++) {
      if (points[i].inside) {
        newInside++;
      } else {
        newOutside++;
      }
    }
    
    setInsideCount(newInside);
    setOutsideCount(newOutside);
    currentIndexRef.current = points.length;
    drawCanvas(points);
    setIsRunning(false);
  }, [points, drawCanvas]);

  // Start simulation
  const runSimulation = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      cancelAnimationFrame(animationRef.current);
    }
    
    const newPoints = generatePoints(numPoints);
    setPoints(newPoints);
    setInsideCount(0);
    setOutsideCount(0);
    currentIndexRef.current = 0;
    setIsRunning(true);
  };

  // Reset
  const reset = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      cancelAnimationFrame(animationRef.current);
    }
    setPoints([]);
    setInsideCount(0);
    setOutsideCount(0);
    currentIndexRef.current = 0;
    setIsRunning(false);
    drawCanvas([]);
  };

  // Run animation when isRunning changes
  useEffect(() => {
    if (isRunning && points.length > 0) {
      animate();
    }
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, points, animate]);

  // Initial draw
  useEffect(() => {
    drawCanvas([]);
  }, [drawCanvas]);

  const total = insideCount + outsideCount;
  const estimatedPi = total > 0 ? (4 * insideCount / total) : 0;
  const error = total > 0 ? Math.abs(estimatedPi - Math.PI) / Math.PI * 100 : 0;

  return (
    <div className={`monte-carlo-pi theme-${theme}`}>
      <div className="mc-header">
        <button className="back-btn" onClick={onBack}>←</button>
      </div>

      <div className="mc-content">
        {/* Leva stran: Canvas + Stats */}
        <div className="mc-left">
          <canvas 
            ref={canvasRef} 
            width={canvasSize} 
            height={canvasSize}
            className="mc-canvas"
          />
          
          <div className="mc-stats-row">
            <div className="mc-stat-item inside">
              <span className="stat-dot green"></span>
              <span>{t.inside}: <strong>{insideCount.toLocaleString()}</strong></span>
            </div>
            <div className="mc-stat-item outside">
              <span className="stat-dot red"></span>
              <span>{t.outside}: <strong>{outsideCount.toLocaleString()}</strong></span>
            </div>
            <div className="mc-stat-item total">
              <span>{t.total}: <strong>{total.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* Sredina: Kontrole + Rezultati */}
        <div className="mc-center">
          <div className="mc-controls">
            <div className="mc-control-group">
              <label>{t.points}</label>
              <input
                type="number"
                value={numPoints}
                onChange={(e) => setNumPoints(Math.max(100000, parseInt(e.target.value) || 100000))}
                min="100000"
                max="1000000"
                disabled={isRunning}
                className="mc-input"
              />
              <div className="mc-presets">
                {[100000, 250000, 500000, 1000000].map(n => (
                  <button
                    key={n}
                    className={`preset-btn ${numPoints === n ? 'active' : ''}`}
                    onClick={() => setNumPoints(n)}
                    disabled={isRunning}
                  >
                    {n >= 1000000 ? `${n/1000000}M` : `${n/1000}k`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mc-control-group">
              <label>{t.speed}</label>
              <div className="mc-speed-btns">
                {(['slow', 'fast', 'instant'] as const).map(s => (
                  <button 
                    key={s}
                    className={`speed-btn ${speed === s ? 'active' : ''}`}
                    onClick={() => setSpeed(s)}
                    disabled={isRunning && s !== 'instant'}
                  >
                    {t[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mc-buttons">
              <button className="mc-run-btn" onClick={runSimulation} disabled={isRunning}>
                {t.run}
              </button>
              {isRunning && (
                <button className="mc-instant-btn" onClick={finishInstant}>
                  ⚡ {t.instant}
                </button>
              )}
              <button className="mc-reset-btn" onClick={reset}>
                {t.reset}
              </button>
            </div>
          </div>

          <div className="mc-results-box">
            <div className="mc-live-formula">
              <span>π ≈ 4 × </span>
              <span className="frac">
                <span className="num green">{insideCount.toLocaleString()}</span>
                <span className="den">{(total || 1).toLocaleString()}</span>
              </span>
              <span> = </span>
              <span className="formula-result">{estimatedPi.toFixed(6)}</span>
            </div>

            <div className="mc-results-grid">
              <div className="mc-result-item">
                <span className="result-label">{t.estimated_pi}</span>
                <span className="result-value accent">{estimatedPi.toFixed(6)}</span>
              </div>
              <div className="mc-result-item">
                <span className="result-label">{t.actual_pi}</span>
                <span className="result-value">{Math.PI.toFixed(6)}</span>
              </div>
              <div className="mc-result-item">
                <span className="result-label">{t.error}</span>
                <span className="result-value error">{error.toFixed(4)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desna stran: Razlaga */}
        <div className="mc-right">
          <div className="mc-explanation-grid">
            {/* Levi stolpec - Teorija (1-4) */}
            <div className="mc-explanation-col">
              <h3>📐 {t.theory}</h3>
              
              <div className="mc-step">
                <h4>{t.explanation.step1_title}</h4>
                <p>{t.explanation.step1_text}</p>
              </div>

              <div className="mc-step">
                <h4>{t.explanation.step2_title}</h4>
                <p>{t.explanation.step2_text}</p>
                <div className="mc-math-latex">
                  <BlockMath math="A_{\square} = 1" />
                  <BlockMath math="A_{\circ} = \frac{\pi}{4}" />
                </div>
              </div>

              <div className="mc-step">
                <h4>{t.explanation.step3_title}</h4>
                <p>{t.explanation.step3_text}</p>
                <div className="mc-math-latex">
                  <BlockMath math="P = \frac{A_{\circ}}{A_{\square}} = \frac{\pi}{4}" />
                </div>
              </div>

              <div className="mc-step highlight">
                <h4>{t.explanation.step4_title}</h4>
                <p>{t.explanation.step4_text}</p>
                <div className="mc-math-latex big">
                  <BlockMath math="\pi = 4 \times \frac{n_{in}}{n_{total}}" />
                </div>
              </div>
            </div>

            {/* Desni stolpec - Praksa (5-8) */}
            <div className="mc-explanation-col">
              <h3>🔬 {t.practice}</h3>
              
              <div className="mc-step">
                <h4>{t.explanation.step5_title}</h4>
                <p>{t.explanation.step5_text}</p>
                <div className="mc-math-latex">
                  <BlockMath math="x^2 + y^2 \leq 1" />
                </div>
                <p className="mc-detail">{t.explanation.step5_detail}</p>
              </div>

              <div className="mc-step">
                <h4>{t.explanation.step6_title}</h4>
                <p>{t.explanation.step6_text}</p>
              </div>

              <div className="mc-step">
                <h4>{t.explanation.step7_title}</h4>
                <p>{t.explanation.step7_text}</p>
                <div className="mc-math-latex small">
                  <BlockMath math="\text{Error} \approx \frac{1}{\sqrt{n}}" />
                </div>
                <p className="mc-detail">{t.explanation.step7_detail}</p>
              </div>

              <div className="mc-step">
                <h4>{t.explanation.step8_title}</h4>
                <p>{t.explanation.step8_text}</p>
              </div>

              <p className="mc-conclusion">💡 {t.explanation.conclusion}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
