'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Fingerprint,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  QrCode,
  FileCode,
  HardDrive,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { SupportedChainId } from '@/types/wallet';
import { SUPPORTED_CHAINS } from '@/lib/constants';
import {
  deriveAddressesFromMnemonic,
  derivePrivateKeys,
  downloadDot1File,
  evaluatePasswordStrength,
  generateNewMnemonic,
  isValidMnemonic,
  registerPasskeyWithPrf,
} from '@/lib/crypto';
import { QrModal } from '@/components/common/QrModal';

// 4-Phase Streamlined Solana Onboarding
type OnboardingStep = 1 | 2 | 3 | 4;

export function OnboardingWizard() {
  const { initializeNewVault, restoreVaultFromMnemonic, restoreVaultFromEnvelope } = useWallet();

  // Wizard state
  const [step, setStep] = useState<OnboardingStep>(1);
  const [mode, setMode] = useState<'create' | 'import'>('create');
  const [importTab, setImportTab] = useState<'mnemonic' | 'dot1'>('dot1');

  // Step 1: Import form
  const [importMnemonicInput, setImportMnemonicInput] = useState('');
  const [importDot1FileContent, setImportDot1FileContent] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Solana-focused chain selection
  const selectedChains: SupportedChainId[] = ['solana'];

  // Step 2: Security & Passkey Ceremony
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Generated state during ceremony
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string>('');
  const [generatedAddresses, setGeneratedAddresses] = useState<ReturnType<typeof deriveAddressesFromMnemonic> | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<ReturnType<typeof derivePrivateKeys> | null>(null);

  useEffect(() => {
    if (!generatedMnemonic) {
      setGeneratedMnemonic(generateNewMnemonic());
    }
  }, [generatedMnemonic]);

  // Step 3: QR Modal preview
  const [activeQrModal, setActiveQrModal] = useState<{
    isOpen: boolean;
    chainId: SupportedChainId;
    address: string;
    path: string;
  } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Step 4: Backup
  const [hasDownloadedDot1, setHasDownloadedDot1] = useState(false);
  const [revealMnemonic, setRevealMnemonic] = useState(false);
  const [revealKeysTab, setRevealKeysTab] = useState<'mnemonic' | 'keys'>('mnemonic');
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [backupAcknowledged, setBackupAcknowledged] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [prfSecretKey, setPrfSecretKey] = useState<Uint8Array | null>(null);

  // Password evaluation
  const strength = evaluatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Passkey Registration handler
  const handleRegisterPasskey = async () => {
    setPasskeyRegistering(true);
    try {
      const res = await registerPasskeyWithPrf();
      if (res.credentialId) {
        setPasskeyRegistered(true);
        if (res.secretKey) {
          setPrfSecretKey(res.secretKey);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPasskeyRegistering(false);
    }
  };

  // Transition to Step 3: derive Solana address
  const handleProceedToAddresses = () => {
    const addresses = deriveAddressesFromMnemonic(generatedMnemonic, selectedChains);
    const keys = derivePrivateKeys(generatedMnemonic, selectedChains);
    setGeneratedAddresses(addresses);
    setGeneratedKeys(keys);
    setStep(3);
  };

  // Copy address helper
  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Download dot1 envelope helper
  const handleDownloadEnvelope = async () => {
    const { createDot1Envelope } = await import('@/lib/crypto');
    const env = await createDot1Envelope(generatedMnemonic, password, selectedChains);
    downloadDot1File(env, `dot-solana-vault-${Date.now()}.dot1`);
    setHasDownloadedDot1(true);
  };

  // Import file reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportDot1FileContent((event.target?.result as string) || '');
      setImportError(null);
    };
    reader.readAsText(file);
  };

  // Handle Restore
  const handleRestoreSubmit = async () => {
    setImportError(null);
    try {
      if (importTab === 'mnemonic') {
        if (!isValidMnemonic(importMnemonicInput)) {
          setImportError('Invalid 12-word BIP-39 mnemonic phrase. Please check spelling.');
          return;
        }
        if (password.length < 8) {
          setImportError('Please provide a secure fallback password (at least 8 characters).');
          return;
        }
        await restoreVaultFromMnemonic(importMnemonicInput, password, selectedChains);
      } else {
        if (!importDot1FileContent) {
          setImportError('Please select a valid .dot1 backup file.');
          return;
        }
        const parsed = JSON.parse(importDot1FileContent);
        const success = await restoreVaultFromEnvelope(parsed, importPassword);
        if (!success) {
          setImportError('Decryption failed. Incorrect password or corrupted envelope.');
          return;
        }
      }
    } catch (err: unknown) {
      setImportError((err as Error)?.message || 'Failed to restore vault.');
    }
  };

  // Complete onboarding
  const handleFinishOnboarding = async () => {
    if (!backupAcknowledged) return;
    setIsFinishing(true);
    try {
      await initializeNewVault(generatedMnemonic, password, selectedChains, passkeyRegistered);
      if (prfSecretKey) {
        const { createDot1Envelope } = await import('@/lib/crypto');
        const { savePrfVaultEnvelope } = await import('@/lib/storage');
        const prfEnv = await createDot1Envelope(generatedMnemonic, prfSecretKey, selectedChains);
        await savePrfVaultEnvelope(prfEnv);
      }
    } catch (err) {
      console.error(err);
      setIsFinishing(false);
    }
  };

  const solanaAddress = generatedAddresses?.solana?.address || '';
  const solanaDerivationPath = "m/44'/501'/0'/0'";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Top Branding / Step Progress Indicator */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono mb-4 shadow-[0_0_15px_rgba(20,241,149,0.15)]">
          <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
          <span>SOLANA SOVEREIGN VAULT</span>
        </div>

        {/* Step Progress Bar (4 streamlined phases) */}
        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s === step
                  ? 'bg-[#14F195] shadow-[0_0_10px_#14F195]'
                  : s < step
                  ? 'bg-cyan-500'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
          Ceremony Phase {step} of 4
        </div>
      </div>

      {/* STEP 1: Welcome & Value Proposition */}
      {step === 1 && (
        <div className="crypto-panel rounded-3xl p-6 md:p-10 shadow-2xl animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#14141E] border border-emerald-500/30 flex items-center justify-center glow-cyan">
              <Shield size={32} className="text-[#14F195]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              Dot Sovereign Solana Vault
            </h1>
            <p className="text-sm md:text-base text-zinc-300 font-medium max-w-md mx-auto leading-relaxed">
              &ldquo;Dot holds no keys and runs no servers. Your funds, your device, your call.&rdquo;
            </p>
          </div>

          {/* Value proposition pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="p-4 rounded-2xl bg-[#121218] border border-[#1F1F24] text-center">
              <div className="text-[#14F195] mb-1.5 flex justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-xs font-semibold text-zinc-200">Pure Ed25519</div>
              <div className="text-[11px] text-zinc-400 mt-1">SLIP-0010 hardened keys derived locally on device</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#121218] border border-[#1F1F24] text-center">
              <div className="text-cyan-400 mb-1.5 flex justify-center">
                <Fingerprint size={20} />
              </div>
              <div className="text-xs font-semibold text-zinc-200">WebAuthn PRF</div>
              <div className="text-[11px] text-zinc-400 mt-1">Hardware biometric authentication via Secure Enclave</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#121218] border border-[#1F1F24] text-center">
              <div className="text-amber-400 mb-1.5 flex justify-center">
                <Coins size={20} />
              </div>
              <div className="text-xs font-semibold text-zinc-200">Native + SPL Tokens</div>
              <div className="text-[11px] text-zinc-400 mt-1">Real-time balances for SOL, USDC, USDT, JUP, RAY, BONK</div>
            </div>
          </div>

          {/* Mode Switcher */}
          {mode === 'create' ? (
            <div className="space-y-3">
              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <span>Create Sovereign Solana Vault</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setMode('import')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm bg-[#14141C] hover:bg-[#1A1A24] text-zinc-300 border border-[#272732] transition cursor-pointer"
              >
                <Key size={16} className="text-[#14F195]" />
                <span>Import Wallet / Restore Backup</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex rounded-xl bg-[#14141C] p-1 border border-[#1F1F24]">
                <button
                  onClick={() => setImportTab('dot1')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    importTab === 'dot1'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Restore .dot1 Backup File
                </button>
                <button
                  onClick={() => setImportTab('mnemonic')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    importTab === 'mnemonic'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Import 12-Word Seed Phrase
                </button>
              </div>

              {importTab === 'dot1' ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-[#121218] text-center">
                    <FileCode size={24} className="mx-auto text-emerald-400 mb-2" />
                    <label className="cursor-pointer text-xs font-medium text-emerald-400 hover:underline">
                      <span>Click to select your .dot1 backup</span>
                      <input
                        type="file"
                        accept=".dot1,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {importDot1FileContent ? 'File loaded successfully' : 'Encrypted Argon2id envelope format'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Decryption Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter the password used when creating backup"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#121218] border border-[#272732] text-zinc-200 text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      12-Word Recovery Mnemonic Phrase
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. apple banana cherry dog elephant fox grape horse igloo jaguar kite lemon"
                      value={importMnemonicInput}
                      onChange={(e) => setImportMnemonicInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#121218] border border-[#272732] text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Set New Fallback Password (Argon2id)
                    </label>
                    <input
                      type="password"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#121218] border border-[#272732] text-zinc-200 text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMode('create')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#14141C] text-zinc-400 hover:text-white border border-[#272732] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestoreSubmit}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition"
                >
                  Decrypt & Unlock Solana Vault
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Security & Passkey Ceremony */}
      {step === 2 && (
        <div className="crypto-panel rounded-3xl p-6 md:p-10 shadow-2xl animate-in fade-in duration-300">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Fingerprint size={22} className="text-[#14F195]" />
              <span>Security & Passkey Ceremony</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Establish hardware biometric signing and memory-hard Argon2id backup protection.
            </p>
          </div>

          {/* Primary Biometric Passkey Registration */}
          <div className="p-5 rounded-2xl bg-[#14141E] border border-emerald-500/30 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-[#14F195]">
                  <Fingerprint size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Primary: WebAuthn PRF Passkey
                  </h3>
                  <div className="text-xs text-zinc-400">
                    Touch ID / Face ID / Windows Hello hardware key
                  </div>
                </div>
              </div>

              {passkeyRegistered && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
                  <CheckCircle2 size={14} /> Registered
                </span>
              )}
            </div>

            <button
              onClick={handleRegisterPasskey}
              disabled={passkeyRegistered || passkeyRegistering}
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                passkeyRegistered
                  ? 'bg-emerald-950/30 border border-emerald-600/40 text-emerald-300'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-lg shadow-emerald-500/15'
              }`}
            >
              {passkeyRegistering ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Prompting Biometric Ceremony...</span>
                </>
              ) : passkeyRegistered ? (
                <>
                  <Check size={16} />
                  <span>Hardware Passkey Bound to Silicon</span>
                </>
              ) : (
                <>
                  <Fingerprint size={16} />
                  <span>Register Biometric Passkey (WebAuthn PRF)</span>
                </>
              )}
            </button>
          </div>

          {/* Mandatory Password Fallback */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#1F1F24] mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                Mandatory Password Fallback (Argon2id)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Protects against hardware loss. Derived using memory-hard Argon2id to prevent GPU brute-force.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter strong fallback password (min 10 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#0F0F14] border border-[#272732] text-zinc-200 text-sm focus:outline-none focus:border-emerald-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Argon2id Strength:</span>
                    <span className="font-semibold font-mono" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="flex-1 transition-all duration-300"
                        style={{
                          backgroundColor:
                            idx <= strength.score - 1 ? strength.color : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-400 pt-1">
                    <span className={strength.hasLength ? 'text-emerald-400' : 'text-zinc-600'}>
                      ✓ 10+ characters
                    </span>
                    <span className={strength.hasUpper ? 'text-emerald-400' : 'text-zinc-600'}>
                      ✓ Uppercase letter
                    </span>
                    <span className={strength.hasNumber ? 'text-emerald-400' : 'text-zinc-600'}>
                      ✓ Number digit
                    </span>
                    <span className={strength.hasSymbol ? 'text-emerald-400' : 'text-zinc-600'}>
                      ✓ Special symbol
                    </span>
                  </div>
                </div>
              )}

              <div>
                <input
                  type="password"
                  placeholder="Confirm fallback password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0F0F14] border border-[#272732] text-zinc-200 text-sm focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              {confirmPassword.length > 0 && !passwordsMatch && (
                <div className="text-[11px] text-red-400">Passwords do not match.</div>
              )}
            </div>
          </div>

          {/* Explanatory callout */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-start gap-3 mb-6">
            <Sparkles size={18} className="text-[#14F195] shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 leading-relaxed">
              <span className="font-semibold text-emerald-300">Why Dual-Factor Silicon Defense?</span> Passkeys
              bind to your device&apos;s Secure Enclave for instantaneous, phish-proof daily signing. The
              Argon2id password provides an emergency bridge to restore your encrypted `.dot1` envelope if
              your physical hardware is lost or upgraded.
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1F1F24]">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={handleProceedToAddresses}
              disabled={password.length < 8 || !passwordsMatch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black transition cursor-pointer font-bold shadow-lg shadow-emerald-500/20"
            >
              <span>Derive Solana Address</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Sovereign Solana Address Preview */}
      {step === 3 && generatedAddresses && (
        <div className="crypto-panel rounded-3xl p-6 md:p-10 shadow-2xl animate-in fade-in duration-300">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Key size={22} className="text-[#14F195]" />
                  <span>Sovereign Solana Address</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Cryptographically derived using SLIP-0010 Ed25519 standard derivation.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                <span>Base58 Ed25519</span>
              </div>
            </div>
          </div>

          {/* Showcase Address Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12121A] to-[#141824] border border-emerald-500/40 shadow-xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-black"
                  style={{ backgroundColor: '#14F195' }}
                >
                  SOL
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Solana Base58 Address</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                      SVM
                    </span>
                  </div>
                  <div className="text-xs font-mono text-zinc-500">
                    Derivation Path: <span className="text-emerald-400/90">{solanaDerivationPath}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons on card */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setActiveQrModal({
                      isOpen: true,
                      chainId: 'solana',
                      address: solanaAddress,
                      path: solanaDerivationPath,
                    })
                  }
                  className="p-2 rounded-xl text-zinc-400 hover:text-[#14F195] hover:bg-[#1A1A24] transition cursor-pointer"
                  title="View QR Code"
                >
                  <QrCode size={17} />
                </button>

                <button
                  onClick={() => handleCopyAddress(solanaAddress)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-[#1A1A24] transition cursor-pointer"
                  title="Copy Address"
                >
                  {copiedAddress ? (
                    <Check size={17} className="text-emerald-400" />
                  ) : (
                    <Copy size={17} />
                  )}
                </button>

                <a
                  href={`https://solscan.io/account/${solanaAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-zinc-400 hover:text-cyan-400 hover:bg-[#1A1A24] transition cursor-pointer"
                  title="View on Solscan"
                >
                  <ExternalLink size={17} />
                </a>
              </div>
            </div>

            {/* Address Box */}
            <div className="p-3.5 rounded-xl bg-[#09090D] border border-[#1A1A22] font-mono text-xs sm:text-sm text-zinc-200 break-all select-all leading-relaxed shadow-inner">
              {solanaAddress}
            </div>

            {/* ATA Explanation Callout */}
            <div className="mt-4 pt-3.5 border-t border-[#1F1F24] flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Coins size={14} className="text-[#14F195]" />
                <span>Single address receives SOL & all SPL tokens (USDC, USDT, etc.)</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-500">Associated Token Accounts</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1F1F24]">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <span>Backup & Sovereign Keys</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Key Reveal & Backup Modal */}
      {step === 4 && (
        <div className="crypto-panel rounded-3xl p-6 md:p-10 shadow-2xl animate-in fade-in duration-300">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={22} className="text-emerald-400" />
              <span>Vault Backup & Sovereign Keys</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Choose your backup strategy. We recommend downloading the encrypted .dot1 envelope.
            </p>
          </div>

          {/* Option A: Download Encrypted .dot1 Envelope (Recommended) */}
          <div className="p-5 rounded-2xl bg-[#12151D] border border-emerald-500/40 mb-6 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Primary Backup
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                <FileCode size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Option A: Encrypted `.dot1` Envelope
                </h3>
                <div className="text-xs text-zinc-400">
                  Safe for Cloud Drive, USB, or Email (Argon2id + AES-256-GCM)
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              Contains your encrypted vault state. Without your password, it is mathematically infeasible to
              crack. Keep this file anywhere for disaster recovery.
            </p>

            <button
              onClick={handleDownloadEnvelope}
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                hasDownloadedDot1
                  ? 'bg-emerald-950/40 border border-emerald-600/50 text-emerald-300'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-500/20'
              }`}
            >
              {hasDownloadedDot1 ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Envelope Downloaded (.dot1)</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Encrypted .dot1 Backup</span>
                </>
              )}
            </button>
          </div>

          {/* Option B: Escape Hatch - Reveal 12-Word Mnemonic / Raw Keys */}
          <div className="p-5 rounded-2xl bg-[#161214] border border-amber-900/40 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-200">
                  Option B: Sovereign Escape Hatch (Mnemonic & Keys)
                </h3>
              </div>
              <button
                onClick={() => setRevealMnemonic(!revealMnemonic)}
                className="text-xs font-mono flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
              >
                {revealMnemonic ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{revealMnemonic ? 'Conceal Keys' : 'Reveal Keys'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 mb-4 leading-relaxed font-medium">
              ⚠️ Warning: Anyone with this phrase can steal your funds. Never share it with anyone or paste
              it into unverified websites.
            </div>

            {revealMnemonic ? (
              <div className="space-y-4">
                {/* Switch between mnemonic and raw private key */}
                <div className="flex rounded-lg bg-[#0F0F14] p-1 border border-[#272732]">
                  <button
                    onClick={() => setRevealKeysTab('mnemonic')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      revealKeysTab === 'mnemonic'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    12-Word BIP-39 Seed
                  </button>
                  <button
                    onClick={() => setRevealKeysTab('keys')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      revealKeysTab === 'keys'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Solana Ed25519 Secret Key
                  </button>
                </div>

                {revealKeysTab === 'mnemonic' ? (
                  <div>
                    {/* 12-word grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                      {(generatedMnemonic ? generatedMnemonic.split(' ') : []).map((word, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-[#0A0A0C] border border-[#272732] flex items-center gap-1.5"
                        >
                          <span className="text-[10px] font-mono text-zinc-500 w-4">{idx + 1}.</span>
                          <span className="text-xs font-mono font-medium text-amber-100">{word}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMnemonic);
                        setCopiedMnemonic(true);
                        setTimeout(() => setCopiedMnemonic(false), 2000);
                      }}
                      className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedMnemonic ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied Seed to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy 12 Words</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-[#0A0A0C] border border-[#272732]">
                      <div className="text-[11px] font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                        <span>Solana Private Key Seed (Ed25519 32-byte Hex)</span>
                        <button
                          onClick={() => {
                            if (generatedKeys?.solana) {
                              navigator.clipboard.writeText(generatedKeys.solana);
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2000);
                            }
                          }}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-mono"
                        >
                          {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs text-amber-300 break-all select-all">
                        {generatedKeys?.solana || 'Generating...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => setRevealMnemonic(true)}
                className="p-6 rounded-xl bg-[#0A0A0E] border border-dashed border-zinc-700 text-center cursor-pointer hover:border-amber-500/50 transition"
              >
                <Lock size={20} className="mx-auto text-amber-400/80 mb-2" />
                <div className="text-xs font-medium text-zinc-300">Click to reveal secret recovery phrase</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Ensure no one is looking at your screen</div>
              </div>
            )}
          </div>

          {/* Acknowledgement checkbox */}
          <div className="p-4 rounded-xl bg-[#121218] border border-[#1F1F24] mb-6 flex items-start gap-3">
            <input
              type="checkbox"
              id="backupCheck"
              checked={backupAcknowledged}
              onChange={(e) => setBackupAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-0 bg-[#0A0A0C] cursor-pointer"
            />
            <label htmlFor="backupCheck" className="text-xs text-zinc-300 leading-relaxed cursor-pointer">
              I understand that Dot holds no keys, runs no servers, and cannot recover my funds if I lose both
              my Passkey and my Backup.
            </label>
          </div>

          {/* Complete Button */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1F1F24]">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={handleFinishOnboarding}
              disabled={!backupAcknowledged || isFinishing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-black font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              {isFinishing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Initializing Sovereign Solana Vault...</span>
                </>
              ) : (
                <>
                  <span>Enter Sovereign Solana Vault</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* QR Code preview modal */}
      {activeQrModal && (
        <QrModal
          isOpen={activeQrModal.isOpen}
          onClose={() => setActiveQrModal(null)}
          chainId={activeQrModal.chainId}
          address={activeQrModal.address}
          derivationPath={activeQrModal.path}
        />
      )}
    </div>
  );
}
