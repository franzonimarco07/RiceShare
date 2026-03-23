'use client';
import { SignUp } from '@clerk/nextjs';

const GUTTER = 52;
const LINE_COUNT = 50;

const appearance = {
  layout: {
    logoPlacement: 'none',
    showOptionalFields: false,
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'blockButton',
  },
  variables: {
    colorBackground:        '#111111',
    colorInputBackground:   '#111111',
    colorInputText:         '#f2f2f0',
    colorText:              '#a8a8a4',
    colorTextSecondary:     '#5c5c58',
    colorPrimary:           '#f2f2f0',
    colorDanger:            '#c07070',
    colorSuccess:           '#7a9a7a',
    colorNeutral:           '#232323',
    borderRadius:           '0px',
    fontFamily:             "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace",
    fontFamilyButtons:      "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace",
    fontSize:               '12px',
    fontWeight:             { normal: 400, medium: 500, bold: 600 },
    spacingUnit:            '16px',
  },
  elements: {
    card:                   'rs-clerk-card',
    cardBox:                'rs-clerk-cardbox',
    headerTitle:            'rs-clerk-title',
    headerSubtitle:         'rs-clerk-subtitle',
    formFieldLabel:         'rs-clerk-label',
    formFieldInput:         'rs-clerk-input',
    formFieldInputShowPasswordButton: 'rs-clerk-show-pwd',
    formButtonPrimary:      'rs-clerk-btn-primary',
    socialButtonsBlockButton:        'rs-clerk-btn-social',
    socialButtonsBlockButtonText:    'rs-clerk-btn-social-text',
    dividerLine:            'rs-clerk-divider-line',
    dividerText:            'rs-clerk-divider-text',
    footerActionLink:       'rs-clerk-link',
    footerActionText:       'rs-clerk-footer-text',
    formFieldErrorText:     'rs-clerk-error',
    alert:                  'rs-clerk-alert',
    alertText:              'rs-clerk-alert-text',
    formResendCodeLink:     'rs-clerk-link',
    otpCodeFieldInput:      'rs-clerk-otp-input',
  },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #141414; min-height: 100vh; }
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: #141414; }
::-webkit-scrollbar-thumb { background: #232323; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.rs-root { display: flex; height: 100vh; overflow: hidden; background: #141414; }
.rs-gutter {
  width: ${GUTTER}px; flex-shrink: 0; background: #0f0f0f;
  border-right: 1px solid #232323; display: flex;
  flex-direction: column; padding-top: 12px;
}
.rs-linenum {
  height: 22px; display: flex; align-items: center;
  justify-content: flex-end; padding-right: 12px;
  font-size: 11px; color: #2c2c2c;
  font-family: 'IBM Plex Mono', monospace; user-select: none;
}
.rs-content { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.rs-topbar {
  border-bottom: 1px solid #232323; height: 44px;
  display: flex; align-items: center; padding: 0 24px; gap: 12px;
  background: rgba(20,20,20,0.97); position: sticky; top: 0;
  z-index: 10; backdrop-filter: blur(10px);
}
.rs-logo {
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 900;
  color: #f2f2f0; letter-spacing: -0.02em; text-transform: uppercase;
  text-decoration: none;
}
.rs-topbar-sep { width: 1px; height: 20px; background: #232323; }
.rs-topbar-comment {
  font-size: 11px; color: #2e2e2e; font-style: italic;
  font-family: 'IBM Plex Mono', monospace;
}
.rs-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 24px;
  animation: fadeUp 0.3s ease;
  overflow-y: auto;
}
.rs-pre {
  font-size: 10px; color: #5c5c58;
  font-family: 'IBM Plex Mono', monospace;
  font-style: italic; margin-bottom: 8px;
}
.rs-title {
  font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 900;
  color: #f2f2f0; letter-spacing: -0.025em; margin-bottom: 32px; line-height: 1;
}
.rs-footer-bar {
  border-top: 1px solid #232323; height: 44px;
  display: flex; align-items: center; padding: 0 24px;
  font-size: 10px; color: #2e2e2e; font-family: 'IBM Plex Mono', monospace;
}

/* ── Clerk overrides ── */
.rs-clerk-cardbox {
  background: transparent !important;
  box-shadow: none !important;
  width: 100%; max-width: 400px;
}
.rs-clerk-card {
  background: #111111 !important;
  border: 1px solid #232323 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 28px !important;
}
.rs-clerk-title { display: none !important; }
.rs-clerk-subtitle {
  font-size: 11px !important; color: #5c5c58 !important;
  font-family: 'IBM Plex Mono', monospace !important; margin-bottom: 20px !important;
}
.rs-clerk-subtitle a { color: #f2f2f0 !important; text-decoration: underline !important; text-decoration-color: #2e2e2e !important; }
.rs-clerk-label {
  font-size: 9px !important; color: #2e2e2e !important;
  letter-spacing: 0.1em !important; text-transform: uppercase !important;
  font-family: 'IBM Plex Mono', monospace !important; margin-bottom: 6px !important;
}
.rs-clerk-input {
  background: #0f0f0f !important; border: 1px solid #232323 !important;
  border-radius: 0 !important; color: #f2f2f0 !important;
  font-size: 12px !important; font-family: 'IBM Plex Mono', monospace !important;
  padding: 10px 14px !important; outline: none !important;
  transition: border-color 0.15s !important; box-shadow: none !important;
}
.rs-clerk-input:focus { border-color: #f2f2f0 !important; box-shadow: none !important; }
.rs-clerk-input::placeholder { color: #2e2e2e !important; }
.rs-clerk-show-pwd { color: #5c5c58 !important; background: transparent !important; }
.rs-clerk-show-pwd:hover { color: #a8a8a4 !important; }
.rs-clerk-btn-primary {
  background: transparent !important; border: 1px solid #2e2e2e !important;
  border-radius: 0 !important; color: #f2f2f0 !important;
  font-size: 12px !important; font-family: 'IBM Plex Mono', monospace !important;
  font-weight: 500 !important; padding: 11px !important;
  transition: all 0.15s !important; box-shadow: none !important;
  text-transform: none !important; letter-spacing: 0 !important;
}
.rs-clerk-btn-primary:hover { background: #f2f2f0 !important; color: #111 !important; }
.rs-clerk-btn-primary::after { content: ' →'; }
.rs-clerk-btn-social {
  background: transparent !important; border: 1px solid #232323 !important;
  border-radius: 0 !important; color: #5c5c58 !important;
  font-size: 12px !important; font-family: 'IBM Plex Mono', monospace !important;
  padding: 10px 14px !important; transition: all 0.15s !important; box-shadow: none !important;
}
.rs-clerk-btn-social:hover { border-color: #444 !important; color: #a8a8a4 !important; background: transparent !important; }
.rs-clerk-btn-social-text { font-family: 'IBM Plex Mono', monospace !important; font-size: 12px !important; }
.rs-clerk-divider-line { background: #232323 !important; }
.rs-clerk-divider-text { color: #2e2e2e !important; font-size: 10px !important; font-family: 'IBM Plex Mono', monospace !important; }
.rs-clerk-link { color: #7a9a7a !important; font-family: 'IBM Plex Mono', monospace !important; font-size: 11px !important; text-decoration: none !important; }
.rs-clerk-link:hover { color: #a8a8a4 !important; }
.rs-clerk-footer-text { color: #5c5c58 !important; font-family: 'IBM Plex Mono', monospace !important; font-size: 11px !important; }
.rs-clerk-error { font-size: 10px !important; color: #c07070 !important; font-family: 'IBM Plex Mono', monospace !important; font-style: italic !important; }
.rs-clerk-error::before { content: '// '; color: #a05858; }
.rs-clerk-alert { background: #a0585808 !important; border: 1px solid #a0585844 !important; border-radius: 0 !important; }
.rs-clerk-alert-text { color: #c07070 !important; font-family: 'IBM Plex Mono', monospace !important; font-size: 11px !important; }
.rs-clerk-otp-input {
  background: #0f0f0f !important; border: 1px solid #232323 !important;
  border-radius: 0 !important; color: #f2f2f0 !important;
  font-family: 'IBM Plex Mono', monospace !important;
  font-size: 18px !important; box-shadow: none !important;
}
.rs-clerk-otp-input:focus { border-color: #f2f2f0 !important; box-shadow: none !important; }
.cl-internal-b3fm6y { display: none !important; }
.cl-logoBox { display: none !important; }
`;

export default function SignUpPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }}/>
      <div className="rs-root">

        {/* Gutter */}
        <div className="rs-gutter">
          {Array.from({ length: LINE_COUNT }, (_, i) => (
            <div key={i} className="rs-linenum">{i + 1}</div>
          ))}
        </div>

        <div className="rs-content">
          {/* Topbar */}
          <div className="rs-topbar">
            <a href="/" className="rs-logo">Riceshare</a>
            <div className="rs-topbar-sep"/>
            <span className="rs-topbar-comment">// create your account</span>
          </div>

          {/* Form centrato */}
          <div className="rs-center">
            <div style={{ width: '100%', maxWidth: 400 }}>
              <div className="rs-pre">// sign up</div>
              <div className="rs-title">Registrati</div>
              <SignUp
                appearance={appearance}
                redirectUrl="/"
                signInUrl="/sign-in"
              />
            </div>
          </div>


        </div>
      </div>
    </>
  );
}