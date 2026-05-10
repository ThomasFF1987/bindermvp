'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'

const THEMES = [
  { id: 'blanc',  label: 'Blanc',  symbol: '☀',  accent: '#EDD85D', ring: '#EDD85D' },
  { id: 'bleu',   label: 'Bleu',   symbol: '💧', accent: '#4A9FD4', ring: '#4A9FD4' },
  { id: 'noir',   label: 'Noir',   symbol: '💀', accent: '#A899CC', ring: '#A899CC' },
  { id: 'rouge',  label: 'Rouge',  symbol: '🔥', accent: '#E04444', ring: '#E04444' },
  { id: 'vert',   label: 'Vert',   symbol: '🌲', accent: '#3AA864', ring: '#3AA864' },
] as const

type Theme = typeof THEMES[number]
type ThemeId = Theme['id']

const TRANSLATIONS = {
  fr: {
    signIn: 'Se connecter',
    signUp: 'Créer un compte',
    badge: 'Pokémon · Magic · Dragon Ball',
    headline1: 'Votre collection,',
    headline2: 'enfin organisée.',
    sub: "Créez des classeurs virtuels pour vos cartes Pokémon, Magic, Dragon Ball et bien d'autres. Retrouvez, rangez et partagez votre collection.",
    cta: 'Commencer ma collection →',
    featuresLabel: 'Fonctionnalités',
    features: [
      { icon: '📂', title: 'Organisez', desc: 'Créez autant de classeurs que vous voulez et disposez vos cartes par pages de 4, 9 ou 12 emplacements.' },
      { icon: '🔍', title: 'Recherchez', desc: 'Cherchez parmi des milliers de cartes issues des plus grands jeux de cartes à collectionner.' },
      { icon: '🔗', title: 'Partagez', desc: 'Rendez vos classeurs publics et partagez-les avec votre communauté via un lien unique.' },
    ],
    footer: 'Gestionnaire de collection de cartes',
  },
  en: {
    signIn: 'Sign in',
    signUp: 'Create account',
    badge: 'Pokémon · Magic · Dragon Ball',
    headline1: 'Your collection,',
    headline2: 'finally organized.',
    sub: 'Create virtual binders for your Pokémon, Magic, Dragon Ball and many more cards. Find, sort and share your collection in a few clicks.',
    cta: 'Start my collection →',
    featuresLabel: 'Features',
    features: [
      { icon: '📂', title: 'Organize', desc: 'Create as many binders as you want and arrange your cards in pages of 4, 9 or 12 slots.' },
      { icon: '🔍', title: 'Search', desc: 'Browse thousands of cards from the greatest trading card games in the world.' },
      { icon: '🔗', title: 'Share', desc: 'Make your binders public and share them with your community via a unique link.' },
    ],
    footer: 'Trading card collection manager',
  },
} as const

type Lang = keyof typeof TRANSLATIONS

const CARD_BACKS = [
  {
    filled: true,
    gradient: 'linear-gradient(150deg, #7b0000 0%, #cc0000 35%, #ff6666 55%, #f5f5f5 68%, #cc0000 85%, #7b0000 100%)',
    innerBorder: 'inset 0 0 0 2px rgba(255,255,255,0.15)',
    delay: 0,
  },
  {
    filled: true,
    gradient: 'linear-gradient(150deg, #0d1f33 0%, #1a3a5c 30%, #2e6da4 55%, #9b7a1e 78%, #5c3d0a 100%)',
    innerBorder: 'inset 0 0 0 2px rgba(255,255,255,0.1)',
    delay: 100,
  },
  {
    filled: true,
    gradient: 'linear-gradient(150deg, #7a2800 0%, #c94b00 30%, #f9a825 55%, #ffd740 70%, #c94b00 90%, #7a2800 100%)',
    innerBorder: 'inset 0 0 0 2px rgba(255,200,0,0.2)',
    delay: 200,
  },
  {
    filled: true,
    gradient: 'linear-gradient(150deg, #040f24 0%, #0d2b5e 30%, #1565c0 55%, #1e88e5 70%, #0d2b5e 90%, #040f24 100%)',
    innerBorder: 'inset 0 0 0 2px rgba(100,180,255,0.15)',
    delay: 300,
  },
  { filled: false, gradient: '', innerBorder: '', delay: 0 },
  { filled: false, gradient: '', innerBorder: '', delay: 0 },
]

function BinderPreview({ theme, tilt }: { theme: Theme; tilt: { x: number; y: number } }) {
  return (
    <div style={{ perspective: '1200px' }}>
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          transform: `rotateY(${tilt.y}deg) rotateX(${tilt.x}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.12s ease-out',
        }}
      >
        {/* Multi-layer glow */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '300px',
            borderRadius: '50%',
            background: theme.accent,
            opacity: 0.12,
            filter: 'blur(90px)',
            pointerEvents: 'none',
            transition: 'background 0.5s ease',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '60%',
            left: '30%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '160px',
            borderRadius: '50%',
            background: '#ffffff',
            opacity: 0.03,
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Binder */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            borderRadius: '16px',
            background: 'linear-gradient(160deg, #222222 0%, #161616 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Spine */}
          <div
            style={{
              width: '20px',
              flexShrink: 0,
              background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accent}88 50%, ${theme.accent}33 100%)`,
              transition: 'background 0.5s ease',
              boxShadow: 'inset -2px 0 8px rgba(0,0,0,0.4)',
            }}
          />

          {/* Card grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 80px)',
              gridTemplateRows: 'repeat(2, 120px)',
              gap: '12px',
              padding: '22px',
              background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, transparent 60%)',
            }}
          >
            {CARD_BACKS.map((card, i) =>
              card.filled ? (
                <div
                  key={i}
                  style={{
                    width: '80px',
                    height: '120px',
                    borderRadius: '7px',
                    background: card.gradient,
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'card-appear 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
                    animationDelay: `${card.delay}ms`,
                    boxShadow: `0 8px 20px rgba(0,0,0,0.6), ${card.innerBorder}`,
                  }}
                >
                  <div className="foil-overlay" />
                  <div
                    style={{
                      position: 'absolute',
                      inset: '5px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              ) : (
                <div
                  key={i}
                  style={{
                    width: '80px',
                    height: '120px',
                    borderRadius: '7px',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.015)',
                  }}
                />
              )
            )}
          </div>
        </div>

        {/* Reflection */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '10%',
            right: '10%',
            height: '24px',
            background: theme.accent,
            opacity: 0.06,
            filter: 'blur(16px)',
            borderRadius: '50%',
            transition: 'background 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

export default function LandingPage() {
  const [themeId, setThemeId] = useState<ThemeId>('bleu')
  const theme = THEMES.find(t => t.id === themeId)!
  const { openSignIn, openSignUp } = useClerk()
  const [tilt, setTilt] = useState({ x: 5, y: -10 })
  const [lang, setLang] = useState<Lang>('fr')
  const tr = TRANSLATIONS[lang]

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const dx = (e.clientX - cx) / (window.innerWidth / 2)
    const dy = (e.clientY - cy) / (window.innerHeight / 2)
    setTilt({ x: -dy * 10, y: dx * 14 })
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#080808', color: '#e8e4dc', position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      {/* Grain texture overlay */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: NOISE_BG,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
          opacity: 0.04,
          pointerEvents: 'none',
          zIndex: 100,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Ambient background glow */}

      {/* Header — glassmorphism */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '60px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(8,8,8,0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: theme.accent,
            transition: 'color 0.5s ease',
          }}
        >
          BINDER
        </span>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Lang toggle */}
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>
            {(['fr', 'en'] as Lang[]).map((l, i) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', padding: '0 2px' }}>|</span>
                )}
                <button
                  onClick={() => setLang(l)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: lang === l ? theme.accent : 'rgba(255,255,255,0.3)',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease',
                    background: 'none',
                    border: 'none',
                  }}
                >
                  {l}
                </button>
              </span>
            ))}
          </div>

          <button
            onClick={() => openSignIn()}
            className="text-sm transition-colors cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.45)', padding: '8px 16px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e8e4dc')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            {tr.signIn}
          </button>
          <button
            onClick={() => openSignUp()}
            className="btn-luxury text-sm font-semibold cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}bb 100%)`,
              color: '#080808',
              padding: '8px 20px',
              borderRadius: '8px',
              transition: 'background 0.5s ease, transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: `0 0 20px ${theme.accent}44`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 24px ${theme.accent}66` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 0 20px ${theme.accent}44` }}
          >
            {tr.signUp}
          </button>
        </nav>
      </header>

      {/* Main */}
      <main
        className="flex-1 flex flex-col items-center px-6 py-20 md:py-28"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center w-full max-w-5xl">
          {/* Left — text */}
          <div className="text-center md:text-left">
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '999px',
                border: `1px solid ${theme.accent}55`,
                background: `${theme.accent}11`,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: theme.accent,
                marginBottom: '24px',
                transition: 'all 0.5s ease',
              }}
            >
              <span style={{ opacity: 0.7 }}>✦</span>
              {tr.badge}
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                marginBottom: '20px',
              }}
            >
              {tr.headline1}
              <br />
              <span style={{ color: theme.accent, transition: 'color 0.5s ease' }}>
                {tr.headline2}
              </span>
            </h1>

            <p
              style={{
                fontSize: '17px',
                lineHeight: 1.7,
                color: 'rgba(232,228,220,0.45)',
                marginBottom: '36px',
                maxWidth: '420px',
              }}
            >
              {tr.sub}
            </p>

            <button
              onClick={() => openSignUp()}
              className="btn-luxury font-semibold cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}cc 100%)`,
                color: '#080808',
                fontSize: '15px',
                padding: '14px 32px',
                borderRadius: '12px',
                transition: 'background 0.5s ease, transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: `0 0 32px ${theme.accent}44, inset 0 1px 0 rgba(255,255,255,0.25)`,
                display: 'inline-block',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 40px ${theme.accent}55, inset 0 1px 0 rgba(255,255,255,0.25)` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 0 32px ${theme.accent}44, inset 0 1px 0 rgba(255,255,255,0.25)` }}
            >
              {tr.cta}
            </button>
          </div>

          {/* Right — binder */}
          <div className="flex justify-center items-center">
            <BinderPreview theme={theme} tilt={tilt} />
          </div>
        </div>

        {/* Separator */}
        <div
          style={{
            marginTop: '80px',
            marginBottom: '60px',
            width: '100%',
            maxWidth: '800px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)',
              fontWeight: 600,
            }}
          >
            {tr.featuresLabel}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full">
          {tr.features.map(f => (
            <div
              key={f.title}
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(160deg, #161616 0%, #111111 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderTop: `1px solid ${theme.accent}44`,
                padding: '28px 24px',
                transition: 'border-top-color 0.5s ease',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: `${theme.accent}15`,
                  border: `1px solid ${theme.accent}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '16px',
                  transition: 'all 0.5s ease',
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: '15px',
                  letterSpacing: '-0.02em',
                  color: '#e8e4dc',
                  marginBottom: '8px',
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: 1.65, color: 'rgba(232,228,220,0.4)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Theme switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          paddingBottom: '28px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => setThemeId(t.id)}
            title={t.label}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: t.accent,
              border: t.id === themeId ? `2px solid ${t.ring}` : '2px solid transparent',
              outline: t.id === themeId ? `2px solid ${t.ring}44` : 'none',
              outlineOffset: '2px',
              opacity: t.id === themeId ? 1 : 0.35,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            }}
          >
            {t.symbol}
          </button>
        ))}
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '20px',
          fontSize: '11px',
          letterSpacing: '0.06em',
          color: 'rgba(255,255,255,0.15)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        © {new Date().getFullYear()} BINDER — {tr.footer}
      </footer>
    </div>
  )
}
