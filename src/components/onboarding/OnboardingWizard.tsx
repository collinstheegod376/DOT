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
  RefreshCw,
  Sparkles,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { SupportedChainId } from '@/types/wallet';
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

  // Transition to Step 3: generate Solana account
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
    downloadDot1File(env, `dot-offline-vault-${Date.now()}.dot1`);
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
          setImportError('Invalid 12-word recovery phrase. Please check spelling.');
          return;
        }
        if (password.length < 8) {
          setImportError('Please provide a secure Security Password (at least 8 characters).');
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
          setImportError('Decryption failed. Incorrect password or corrupted backup file.');
          return;
        }
      }
    } catch (err: unknown) {
      setImportError((err as Error)?.message || 'Failed to restore Offline Vault.');
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

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Top Branding / Step Progress Indicator */}
      <div className="mb-8 text-center relative">

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-xs font-sans font-bold uppercase tracking-wider mb-4 shadow-none">
          <span className="w-2 h-2 rounded-none bg-emerald-500" />
          <span>SOLANA SOVEREIGN VAULT</span>
        </div>

        {/* Step Progress Bar (4 streamlined phases) */}
        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-none transition-all duration-150 ${
                s <= step
                  ? 'bg-black dark:bg-white'
                  : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <div className="text-[11px] font-sans font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          Phase {step} of 4
        </div>
      </div>

      {/* STEP 1: Welcome & Value Proposition */}
      {step === 1 && (
        <div className="bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] p-6 md:p-10 rounded-none shadow-none animate-in fade-in duration-200">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl md:text-3xl font-sans font-[900] tracking-tighter uppercase text-black dark:text-white mb-2">
              Dot Sovereign Solana Vault
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-md mx-auto leading-relaxed">
              &ldquo;Dot holds no keys and runs no servers. Your funds, your device, your call.&rdquo;
            </p>
          </div>

          {/* Value proposition pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="p-4 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
              <div className="text-black dark:text-white mb-2 flex justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-xs font-sans font-bold uppercase tracking-wider text-black dark:text-white">
                Self-Custodial
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                Security keys generated and stored locally on your device
              </div>
            </div>

            <div className="p-4 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
              <div className="text-black dark:text-white mb-2 flex justify-center">
                <Fingerprint size={20} />
              </div>
              <div className="text-xs font-sans font-bold uppercase tracking-wider text-black dark:text-white">
                Passkey Protection
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                Biometric authentication via device Secure Enclave
              </div>
            </div>

            <div className="p-4 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
              <div className="text-black dark:text-white mb-2 flex justify-center">
                <Coins size={20} />
              </div>
              <div className="text-xs font-sans font-bold uppercase tracking-wider text-black dark:text-white">
                Native & SPL Tokens
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                Real-time balances for SOL, USDC, USDT, JUP, RAY, BONK
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          {mode === 'create' ? (
            <div className="space-y-3">
              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white h-12 uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:opacity-85 transition cursor-pointer"
              >
                <span>Create Sovereign Solana Vault</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setMode('import')}
                className="w-full flex items-center justify-center gap-2 bg-transparent text-black dark:text-white border border-black dark:border-white h-12 uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer"
              >
                <Key size={16} />
                <span>Import Wallet / Restore Backup</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex rounded-none bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setImportTab('dot1')}
                  className={`flex-1 h-10 text-xs font-sans font-bold uppercase tracking-wider rounded-none transition cursor-pointer ${
                    importTab === 'dot1'
                      ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-transparent'
                  }`}
                >
                  Restore Offline Vault Backup (.dot1)
                </button>
                <button
                  onClick={() => setImportTab('mnemonic')}
                  className={`flex-1 h-10 text-xs font-sans font-bold uppercase tracking-wider rounded-none transition cursor-pointer ${
                    importTab === 'mnemonic'
                      ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-transparent'
                  }`}
                >
                  Import 12-Word Recovery Phrase
                </button>
              </div>

              {importTab === 'dot1' ? (
                <div className="space-y-4">
                  <div className="p-6 rounded-none border border-dashed border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 text-center">
                    <FileCode size={24} className="mx-auto text-black dark:text-white mb-2" />
                    <label className="cursor-pointer text-xs font-sans font-bold uppercase tracking-wider text-black dark:text-white hover:underline block">
                      <span>Click to select your Offline Vault backup (.dot1)</span>
                      <input
                        type="file"
                        accept=".dot1,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="text-[11px] font-mono text-zinc-500 mt-1">
                      {importDot1FileContent ? 'File loaded successfully' : 'Encrypted Offline Vault backup file'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-sans font-bold tracking-wider text-black dark:text-white mb-2">
                      Decryption Security Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter the password used when creating backup"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                      className="w-full px-4 h-12 rounded-none bg-transparent border border-black dark:border-white text-black dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-sans font-bold tracking-wider text-black dark:text-white mb-2">
                      12-Word Recovery Phrase
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. apple banana cherry dog elephant fox grape horse igloo jaguar kite lemon"
                      value={importMnemonicInput}
                      onChange={(e) => setImportMnemonicInput(e.target.value)}
                      className="w-full p-4 rounded-none bg-transparent border border-black dark:border-white text-black dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-sans font-bold tracking-wider text-black dark:text-white mb-2">
                      Set New Security Password
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 h-12 rounded-none bg-transparent border border-black dark:border-white text-black dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
              )}

              {importError && (
                <div className="p-3.5 rounded-none bg-red-50 dark:bg-red-950/20 border border-red-600 flex items-center gap-2 text-xs font-mono text-red-600 dark:text-red-400">
                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMode('create')}
                  className="h-12 px-6 rounded-none border border-black dark:border-white bg-transparent text-black dark:text-white uppercase font-sans font-bold text-xs tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestoreSubmit}
                  className="flex-1 h-12 rounded-none bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white uppercase font-sans font-bold text-xs tracking-wider hover:opacity-85 transition cursor-pointer"
                >
                  Unlock Offline Vault
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Security & Passkey Ceremony */}
      {step === 2 && (
        <div className="bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] p-6 md:p-10 rounded-none shadow-none animate-in fade-in duration-200">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-sans font-[900] tracking-tighter uppercase text-black dark:text-white flex items-center gap-2">
              <Fingerprint size={22} />
              <span>Security & Passkey Setup</span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Establish biometric signing and offline vault security password protection.
            </p>
          </div>

          {/* Primary Biometric Passkey Registration */}
          <div className="p-5 rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <Fingerprint size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-sans font-[900] tracking-tighter uppercase text-black dark:text-white">
                    Primary: Biometric Passkey
                  </h3>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    Touch ID / Face ID / Windows Hello security key
                  </div>
                </div>
              </div>

              {passkeyRegistered && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase px-2.5 py-1 border border-emerald-600 rounded-none">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500" />
                  <span>Registered</span>
                </span>
              )}
            </div>

            <button
              onClick={handleRegisterPasskey}
              disabled={passkeyRegistered || passkeyRegistering}
              className={`w-full h-12 uppercase font-sans font-bold text-xs tracking-wider rounded-none flex items-center justify-center gap-2 transition cursor-pointer ${
                passkeyRegistered
                  ? 'border border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white hover:opacity-85'
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
                  <span>Hardware Passkey Activated</span>
                </>
              ) : (
                <>
                  <Fingerprint size={16} />
                  <span>Register Biometric Passkey</span>
                </>
              )}
            </button>
          </div>

          {/* Mandatory Password Fallback */}
          <div className="p-5 rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} />
              <h3 className="text-sm font-sans font-[900] tracking-tighter uppercase text-black dark:text-white">
                Security Password Backup
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Protects against hardware loss. High-grade device encryption safeguards your Offline Vault.
            </p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter strong security password (min 10 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 h-12 rounded-none bg-transparent border border-black dark:border-white text-black dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-black dark:hover:text-white transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-sans font-bold uppercase tracking-wider text-zinc-500">
                      Password Strength:
                    </span>
                    <span className="font-mono font-bold uppercase" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-none overflow-hidden flex gap-1">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="flex-1 rounded-none transition-all duration-150"
                        style={{
                          backgroundColor:
                            idx <= strength.score - 1 ? strength.color : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono pt-1 text-zinc-500">
                    <span className={strength.hasLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                      ✓ 10+ characters
                    </span>
                    <span className={strength.hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                      ✓ Uppercase letter
                    </span>
                    <span className={strength.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                      ✓ Number digit
                    </span>
                    <span className={strength.hasSymbol ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                      ✓ Special symbol
                    </span>
                  </div>
                </div>
              )}

              <div>
                <input
                  type="password"
                  placeholder="Confirm security password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 h-12 rounded-none bg-transparent border border-black dark:border-white text-black dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {confirmPassword.length > 0 && !passwordsMatch && (
                <div className="text-[11px] font-mono text-red-600 dark:text-red-400">
                  Passwords do not match.
                </div>
              )}
            </div>
          </div>

          {/* Explanatory callout */}
          <div className="p-4 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 mb-6">
            <Sparkles size={18} className="text-black dark:text-white shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span className="font-sans font-bold uppercase tracking-wider text-black dark:text-white">
                Why Dual-Factor Device Defense?
              </span>{' '}
              Passkeys bind to your device&apos;s Secure Enclave for instantaneous, phish-proof daily signing. The
              Security Password provides an emergency bridge to restore your encrypted Offline Vault backup if your
              physical hardware is lost or upgraded.
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setStep(1)}
              className="h-12 px-6 rounded-none border border-black dark:border-white bg-transparent text-black dark:text-white uppercase font-sans font-bold text-xs tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={handleProceedToAddresses}
              disabled={password.length < 8 || !passwordsMatch}
              className="h-12 px-6 rounded-none bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white uppercase font-sans font-bold text-xs tracking-wider hover:opacity-85 disabled:opacity-40 transition cursor-pointer flex items-center gap-2"
            >
              <span>Continue to Solana Account</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Sovereign Solana Address Preview */}
      {step === 3 && generatedAddresses && (
        <div className="bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] p-6 md:p-10 rounded-none shadow-none animate-in fade-in duration-200">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-sans font-[900] tracking-tighter uppercase text-black dark:text-white flex items-center gap-2">
                  <Key size={22} />
                  <span>Sovereign Solana Account</span>
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Cryptographically verified and protected directly on your hardware.
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black text-[11px] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500" />
                <span>Solana Mainnet</span>
              </div>
            </div>
          </div>

          {/* Showcase Address Card */}
          <div className="p-5 rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-sans font-[900] text-xs">
                  SOL
                </div>
                <div>
                  <div className="text-sm font-sans font-[900] tracking-tighter uppercase text-black dark:text-white">
                    Solana Account Address
                  </div>
                  <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    Standard Solana Account (Mainnet)
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
                    })
                  }
                  className="p-2.5 rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition cursor-pointer"
                  title="View QR Code"
                >
                  <QrCode size={16} />
                </button>

                <button
                  onClick={() => handleCopyAddress(solanaAddress)}
                  className="p-2.5 rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition cursor-pointer"
                  title="Copy Address"
                >
                  {copiedAddress ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>

                <a
                  href={`https://solscan.io/account/${solanaAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition cursor-pointer"
                  title="View on Solscan"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            {/* Address Box */}
            <div className="p-4 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs sm:text-sm text-black dark:text-white break-all select-all leading-relaxed">
              {solanaAddress}
            </div>

            {/* ATA Explanation Callout */}
            <div className="mt-4 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Coins size={14} />
                <span>Single address receives SOL & all SPL tokens (USDC, USDT, etc.)</span>
              </span>
              <span className="font-sans font-bold uppercase text-[10px] tracking-wider text-black dark:text-white">
                Native & SPL Tokens
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setStep(2)}
              className="h-12 px-6 rounded-none border border-black dark:border-white bg-transparent text-black dark:text-white uppercase font-sans font-bold text-xs tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(4)}
              className="h-12 px-6 rounded-none bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white uppercase font-sans font-bold text-xs tracking-wider hover:opacity-85 transition cursor-pointer flex items-center gap-2"
            >
              <span>Backup & Recovery</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Key Reveal & Backup Modal */}
      {step === 4 && (
        <div className="bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] p-6 md:p-10 rounded-none shadow-none animate-in fade-in duration-200">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-sans font-[900] tracking-tighter uppercase text-black dark:text-white flex items-center gap-2">
              <Shield size={22} />
              <span>Offline Vault Backup & Recovery</span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Choose your backup strategy. We recommend downloading the encrypted Offline Vault backup file.
            </p>
          </div>

          {/* Option A: Download Encrypted .dot1 Envelope (Recommended) */}
          <div className="p-5 rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] mb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
              Recommended
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                <FileCode size={20} />
              </div>
              <div>
                <h3 className="text-sm font-sans font-[900] tracking-tighter uppercase text-black dark:text-white">
                  Option A: Encrypted Offline Vault File (.dot1)
                </h3>
                <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  Safe for Cloud Drive, USB, or Email (Encrypted Offline Vault)
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 my-4 leading-relaxed font-sans">
              Contains your encrypted Offline Vault state. Without your Security Password, it is mathematically infeasible to
              crack. Keep this file anywhere for disaster recovery.
            </p>

            <button
              onClick={handleDownloadEnvelope}
              className="w-full h-12 flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:opacity-85 transition cursor-pointer"
            >
              {hasDownloadedDot1 ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Offline Vault Backup Downloaded (.dot1)</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Encrypted Backup (.dot1)</span>
                </>
              )}
            </button>
          </div>

          {/* Option B: Escape Hatch - Reveal 12-Word Mnemonic / Raw Keys */}
          <div className="p-5 rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-sm font-sans font-[900] tracking-tighter uppercase text-black dark:text-white">
                  Option B: Emergency Recovery Phrase
                </h3>
              </div>
              <button
                onClick={() => setRevealMnemonic(!revealMnemonic)}
                className="text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 text-black dark:text-white hover:underline cursor-pointer"
              >
                {revealMnemonic ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{revealMnemonic ? 'Conceal Keys' : 'Reveal Keys'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-none bg-amber-50 dark:bg-amber-950/20 border border-amber-600 text-xs text-amber-800 dark:text-amber-300 mb-4 leading-relaxed font-mono">
              ⚠️ WARNING: Anyone with this phrase can steal your funds. Never share it with anyone or paste
              it into unverified websites.
            </div>

            {revealMnemonic ? (
              <div className="space-y-4">
                {/* Switch between mnemonic and raw private key */}
                <div className="flex rounded-none bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setRevealKeysTab('mnemonic')}
                    className={`flex-1 h-9 text-xs font-sans font-bold uppercase tracking-wider rounded-none transition cursor-pointer ${
                      revealKeysTab === 'mnemonic'
                        ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-transparent'
                    }`}
                  >
                    12-Word Recovery Phrase
                  </button>
                  <button
                    onClick={() => setRevealKeysTab('keys')}
                    className={`flex-1 h-9 text-xs font-sans font-bold uppercase tracking-wider rounded-none transition cursor-pointer ${
                      revealKeysTab === 'keys'
                        ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-transparent'
                    }`}
                  >
                    Solana Account Secret Key
                  </button>
                </div>

                {revealKeysTab === 'mnemonic' ? (
                  <div>
                    {/* 12-word grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                      {(generatedMnemonic ? generatedMnemonic.split(' ') : []).map((word, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
                        >
                          <span className="text-[10px] font-mono text-zinc-500 w-4">{idx + 1}.</span>
                          <span className="text-xs font-mono font-bold text-black dark:text-white">{word}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMnemonic);
                        setCopiedMnemonic(true);
                        setTimeout(() => setCopiedMnemonic(false), 2000);
                      }}
                      className="h-10 px-4 rounded-none border border-black dark:border-white bg-transparent text-black dark:text-white uppercase font-sans font-bold text-xs tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer flex items-center gap-2"
                    >
                      {copiedMnemonic ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span>Copied Recovery Phrase</span>
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
                    <div className="p-3.5 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs font-sans font-bold uppercase tracking-wider text-black dark:text-white mb-2 flex items-center justify-between">
                        <span>Solana Account Secret Key</span>
                        <button
                          onClick={() => {
                            if (generatedKeys?.solana) {
                              navigator.clipboard.writeText(generatedKeys.solana);
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2000);
                            }
                          }}
                          className="text-black dark:text-white hover:underline flex items-center gap-1 text-xs font-sans font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs text-black dark:text-white break-all select-all">
                        {generatedKeys?.solana || 'Generating...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => setRevealMnemonic(true)}
                className="p-6 rounded-none border border-dashed border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition"
              >
                <Lock size={20} className="mx-auto text-black dark:text-white mb-2" />
                <div className="text-xs font-sans font-bold uppercase tracking-wider text-black dark:text-white">
                  Click to reveal secret recovery phrase
                </div>
                <div className="text-[11px] font-mono text-zinc-500 mt-1">
                  Ensure no one is looking at your screen
                </div>
              </div>
            )}
          </div>

          {/* Acknowledgement checkbox */}
          <div className="p-4 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-black dark:border-[#353536] mb-6 flex items-start gap-3">
            <input
              type="checkbox"
              id="backupCheck"
              checked={backupAcknowledged}
              onChange={(e) => setBackupAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-none border border-black dark:border-white text-black focus:ring-0 cursor-pointer"
            />
            <label htmlFor="backupCheck" className="text-xs font-sans text-zinc-700 dark:text-zinc-300 leading-relaxed cursor-pointer">
              I understand that Dot holds no keys, runs no servers, and cannot recover my funds if I lose both
              my Passkey and my Security Password.
            </label>
          </div>

          {/* Complete Button */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setStep(3)}
              className="h-12 px-6 rounded-none border border-black dark:border-white bg-transparent text-black dark:text-white uppercase font-sans font-bold text-xs tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={handleFinishOnboarding}
              disabled={!backupAcknowledged || isFinishing}
              className="h-12 px-6 rounded-none bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white uppercase font-sans font-bold text-xs tracking-wider hover:opacity-85 disabled:opacity-40 transition cursor-pointer flex items-center gap-2"
            >
              {isFinishing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Initializing Offline Vault...</span>
                </>
              ) : (
                <>
                  <span>Enter Solana Vault</span>
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
        />
      )}
    </div>
  );
}
