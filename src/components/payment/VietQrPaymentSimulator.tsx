'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  Check,
  CheckCircle2,
  Copy,
  Clock,
  RefreshCw,
  Volume2,
  VolumeX,
  ArrowRight,
  X,
  Sparkles,
  Building2,
  ShieldCheck,
  Zap,
  Wifi,
  Battery,
  Scan,
  Fingerprint,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

export interface VietQrSimulatorProps {
  amount: number;
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  isPaid?: boolean;
  onPaymentSuccess?: (transaction: {
    transactionId: string;
    bankName: string;
    amount: number;
    paidAt: string;
    orderCode: string;
  }) => void;
  className?: string;
}

interface BankOption {
  code: string;
  shortName: string;
  fullName: string;
  accountNumber: string;
  accountName: string;
  primaryColor: string;
  accentColor: string;
  logoBg: string;
}

const SUPPORTED_BANKS: BankOption[] = [
  {
    code: 'MB',
    shortName: 'MBBank',
    fullName: 'Ngân hàng TMCP Quân Đội',
    accountNumber: '0988888888',
    accountName: 'PHAP LAM DIEN',
    primaryColor: '#002B7F',
    accentColor: '#E60000',
    logoBg: 'bg-blue-900 text-white'
  },
  {
    code: 'VCB',
    shortName: 'Vietcombank',
    fullName: 'Ngân hàng Ngoại Thương Việt Nam',
    accountNumber: '1028889999',
    accountName: 'PHAP LAM DIEN',
    primaryColor: '#005826',
    accentColor: '#79B828',
    logoBg: 'bg-emerald-800 text-white'
  },
  {
    code: 'TCB',
    shortName: 'Techcombank',
    fullName: 'Ngân hàng Kỹ Thương Việt Nam',
    accountNumber: '1903888777',
    accountName: 'PHAP LAM DIEN',
    primaryColor: '#EA1D25',
    accentColor: '#1E1E1E',
    logoBg: 'bg-red-600 text-white'
  },
  {
    code: 'ACB',
    shortName: 'ACB',
    fullName: 'Ngân hàng Á Châu',
    accountNumber: '246888999',
    accountName: 'PHAP LAM DIEN',
    primaryColor: '#0066B2',
    accentColor: '#00A3E0',
    logoBg: 'bg-sky-700 text-white'
  }
];

export default function VietQrPaymentSimulator({
  amount,
  orderCode: propOrderCode,
  customerName = 'Khách hàng',
  customerPhone = '0901234567',
  isPaid: propIsPaid = false,
  onPaymentSuccess,
  className = ''
}: VietQrSimulatorProps) {
  // Generate a consistent unique order code if not provided
  const [orderCode] = useState(() => {
    if (propOrderCode) return propOrderCode;
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `LD${randomSuffix}`;
  });

  const [selectedBank, setSelectedBank] = useState<BankOption>(SUPPORTED_BANKS[0]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
  const [isPaid, setIsPaid] = useState(propIsPaid);
  const [transactionInfo, setTransactionInfo] = useState<{
    transactionId: string;
    bankName: string;
    amount: number;
    paidAt: string;
    orderCode: string;
  } | null>(null);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mobile Banking Simulator States
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [simStep, setSimStep] = useState<'SCAN' | 'CONFIRM' | 'FACE_ID' | 'SUCCESS'>('SCAN');
  const [simSenderBalance, setSimSenderBalance] = useState(58500000);
  const [showPushNotification, setShowPushNotification] = useState(false);
  const [simBankApp, setSimBankApp] = useState<'VCB' | 'MB'>('VCB');
  const [isQuickProcessing, setIsQuickProcessing] = useState(false);
  const [quickProcessStep, setQuickProcessStep] = useState<string>('');

  const [currentTime, setCurrentTime] = useState('');

  // Update clock for phone status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync propIsPaid
  useEffect(() => {
    if (propIsPaid !== isPaid) {
      setIsPaid(propIsPaid);
    }
  }, [propIsPaid]);

  // Countdown timer
  useEffect(() => {
    if (isPaid || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid, timeLeft]);

  // Web Audio Synth for ultra-realistic sound effects
  const playSound = (type: 'beep' | 'success' | 'faceid') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'beep') {
        // Quick high-pitched camera scanner beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'faceid') {
        // Subtle biometric chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'success') {
        // 3-tone cheerful luxury banking POS chime (Ting-ting-ting!)
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };
        playTone(523.25, 0, 0.22); // C5
        playTone(659.25, 0.14, 0.28); // E5
        playTone(783.99, 0.28, 0.35); // G5
        playTone(1046.5, 0.44, 0.65); // C6
      }
    } catch (err) {
      console.warn('Audio play error:', err);
    }
  };

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Format currency VND
  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Real VietQR Image URL
  const vietQrUrl = `https://img.vietqr.io/image/${selectedBank.code}-${selectedBank.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    orderCode
  )}&accountName=${encodeURIComponent(selectedBank.accountName)}`;

  // Trigger successful payment
  const completePayment = () => {
    const randomTransNum = Math.floor(1000000000 + Math.random() * 9000000000);
    const transId = `FT26${randomTransNum}`;
    const paidAt = new Date().toLocaleString('vi-VN');

    const info = {
      transactionId: transId,
      bankName: selectedBank.shortName,
      amount,
      paidAt,
      orderCode
    };

    setTransactionInfo(info);
    setIsPaid(true);
    playSound('success');

    if (onPaymentSuccess) {
      onPaymentSuccess(info);
    }
  };

  // Start Smartphone Simulator
  const openPhoneSimulator = () => {
    setSimStep('SCAN');
    setShowPushNotification(false);
    setIsPhoneModalOpen(true);
  };

  // Smartphone Step Flow Actions
  const handlePhoneScanQr = () => {
    playSound('beep');
    setSimStep('CONFIRM');
  };

  const handlePhoneConfirmTransfer = () => {
    setSimStep('FACE_ID');
    playSound('faceid');
    setTimeout(() => {
      // Deduct sender balance
      setSimSenderBalance((prev) => Math.max(0, prev - amount));
      setSimStep('SUCCESS');
      setShowPushNotification(true);
      completePayment();
    }, 1800);
  };

  // Quick 1-click Payment Simulation
  const handleQuickSimulation = async () => {
    if (isPaid || isQuickProcessing) return;
    setIsQuickProcessing(true);

    setQuickProcessStep('1. Kết nối cổng Napas247...');
    await new Promise((r) => setTimeout(r, 600));

    setQuickProcessStep('2. Nhận diện QR và kiểm tra tài khoản...');
    playSound('beep');
    await new Promise((r) => setTimeout(r, 700));

    setQuickProcessStep('3. Xác thực sinh trắc học Face ID...');
    playSound('faceid');
    await new Promise((r) => setTimeout(r, 700));

    setQuickProcessStep('4. Chuyển tiền & Đồng bộ Webhook...');
    await new Promise((r) => setTimeout(r, 600));

    completePayment();
    setIsQuickProcessing(false);
    setQuickProcessStep('');
  };

  return (
    <div className={`w-full ${className}`}>
      {/* =========================================================================
          MAIN VIETQR CARD VIEW
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden transition-all">
        {/* VietQR Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wider text-white">VietQR</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500 text-white uppercase tracking-wider">
                  Napas 247
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Cổng thanh toán tự động thời gian thực</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh thông báo' : 'Bật âm thanh'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className={`font-bold ${timeLeft < 120 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Selector Pills */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
            Ngân hàng nhận:
          </span>
          <div className="flex items-center gap-1.5">
            {SUPPORTED_BANKS.map((b) => {
              const isSelected = selectedBank.code === b.code;
              return (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => setSelectedBank(b)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20 ring-2 ring-teal-600/30'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.primaryColor }}></span>
                  {b.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: Left QR & Right Banking Details */}
        <div className="p-5 sm:p-6">
          {!isPaid ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: QR Code with Live Radar Effect */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="relative group p-3 bg-gradient-to-b from-white to-slate-50 rounded-2xl border-2 border-dashed border-teal-500/40 shadow-md hover:shadow-lg transition-all flex flex-col items-center">
                  {/* Radar Scanning Line Animation */}
                  <div className="relative w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-xl overflow-hidden flex items-center justify-center p-1.5 border border-slate-100">
                    <img
                      src={vietQrUrl}
                      alt={`VietQR - ${selectedBank.shortName}`}
                      className="w-full h-full object-contain"
                      loading="eager"
                      onError={(e) => {
                        // Fallback in case vietqr.io has momentary timeout
                        (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=247_TRANSFER_${selectedBank.code}_${selectedBank.accountNumber}_${amount}_${orderCode}`;
                      }}
                    />

                    {/* Animated Laser Scanning Line */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-[scan_2.5s_ease-in-out_infinite] opacity-80 pointer-events-none" />

                    {/* Corner Reticle Markers */}
                    <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-teal-600 rounded-tl pointer-events-none" />
                    <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-teal-600 rounded-tr pointer-events-none" />
                    <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-teal-600 rounded-bl pointer-events-none" />
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-teal-600 rounded-br pointer-events-none" />
                  </div>

                  {/* QR Footer Status */}
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-800">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
                    </span>
                    <span>Đang chờ quét mã QR...</span>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Mở bất kỳ ứng dụng ngân hàng hoặc ví điện tử để quét</p>
                </div>
              </div>

              {/* Right Column: Banking Information Table */}
              <div className="md:col-span-7 space-y-3">
                {/* Bank Name */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-teal-800 font-black text-xs shadow-xs">
                      <Building2 className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ngân hàng thụ hưởng</p>
                      <p className="text-sm font-bold text-slate-800">{selectedBank.fullName}</p>
                    </div>
                  </div>
                </div>

                {/* Account Number */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Số tài khoản</p>
                    <p className="text-base font-black text-teal-800 tracking-wider font-mono">
                      {selectedBank.accountNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedBank.accountNumber, 'STK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      copiedField === 'STK'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {copiedField === 'STK' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'STK' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                {/* Account Holder */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chủ tài khoản</p>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      {selectedBank.accountName}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                    ĐÃ XÁC THỰC
                  </span>
                </div>

                {/* Amount */}
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Số tiền thanh toán</p>
                    <p className="text-lg font-black text-emerald-700">{formatVND(amount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(amount.toString(), 'AMOUNT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      copiedField === 'AMOUNT'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {copiedField === 'AMOUNT' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'AMOUNT' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                {/* Transfer Content / Order Code */}
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Nội dung chuyển khoản</p>
                      <span className="text-[9px] font-extrabold text-rose-600 bg-rose-100 px-1 rounded">BẮT BUỘC</span>
                    </div>
                    <p className="text-base font-black text-amber-900 tracking-wider font-mono">{orderCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(orderCode, 'CODE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      copiedField === 'CODE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {copiedField === 'CODE' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'CODE' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* =====================================================================
               PAID SUCCESS STATE VIEW
               ===================================================================== */
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
              <div className="relative mb-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 p-1.5 rounded-full shadow-sm">
                  <Sparkles className="w-4 h-4 fill-amber-400" />
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs tracking-wider uppercase mb-2">
                Giao Dịch Đã Hoàn Tất
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-1">Thanh toán thành công!</h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                Cổng thanh toán tự động đã ghi nhận số tiền <strong className="text-slate-800">{formatVND(amount)}</strong> từ
                ngân hàng đối tác.
              </p>

              {/* Receipt Summary Card */}
              <div className="w-full max-w-md bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 mb-6 font-mono text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-400">Mã giao dịch (Napas):</span>
                  <span className="font-bold text-slate-800">{transactionInfo?.transactionId || 'FT2698234190'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-400">Mã đơn hàng:</span>
                  <span className="font-bold text-teal-800">{orderCode}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-400">Ngân hàng nhận:</span>
                  <span className="font-bold text-slate-800">{selectedBank.shortName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian ghi nhận:</span>
                  <span className="font-bold text-slate-800">
                    {transactionInfo?.paidAt || new Date().toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPaid(false);
                  setTimeLeft(600);
                }}
                className="text-xs font-bold text-slate-400 hover:text-teal-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Giả lập lại thanh toán
              </button>
            </div>
          )}

          {/* =====================================================================
              SIMULATION CONTROLLER BUTTONS
              ===================================================================== */}
          {!isPaid && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              {/* Button 1: Open Smartphone Mobile Banking Simulator */}
              <button
                type="button"
                onClick={openPhoneSimulator}
                className="w-full sm:flex-1 py-3.5 px-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 hover:from-teal-800 hover:to-slate-950 text-white text-xs sm:text-sm font-extrabold uppercase rounded-2xl shadow-lg shadow-teal-900/20 hover:shadow-teal-900/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-95"
              >
                <Smartphone className="w-5 h-5 text-teal-300" />
                <span>Mở App Ngân Hàng Giả Lập</span>
              </button>

              {/* Button 2: Quick Pay Simulator (1-touch 2s test) */}
              <button
                type="button"
                disabled={isQuickProcessing}
                onClick={handleQuickSimulation}
                className="w-full sm:w-auto py-3.5 px-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs sm:text-sm font-bold uppercase rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${isQuickProcessing ? 'animate-spin text-amber-500' : 'text-indigo-600'}`} />
                <span>{isQuickProcessing ? quickProcessStep : '⚡ Thanh toán nhanh (3s)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SMARTPHONE MOBILE BANKING SIMULATOR MODAL (IPHONE 16 PRO MOCKUP)
          ========================================================================= */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm sm:max-w-md my-auto">
            {/* Close Button Top-Right Outside Phone */}
            <button
              type="button"
              onClick={() => setIsPhoneModalOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <span>Đóng Giả Lập</span>
              <X className="w-4 h-4" />
            </button>

            {/* Smartphone Outer Bezel Frame */}
            <div className="relative w-full aspect-[9/19] sm:h-[720px] bg-slate-900 rounded-[50px] p-3 shadow-2xl ring-1 ring-white/20 shadow-teal-500/10 border-4 border-slate-700/80 flex flex-col justify-between overflow-hidden">
              {/* Push Notification Dropdown Banner */}
              {showPushNotification && (
                <div className="absolute top-12 inset-x-5 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-3.5 shadow-2xl text-white animate-in slide-in-from-top-6 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-[10px] shadow-sm">
                      {simBankApp}
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-emerald-400 uppercase">Biến động số dư</span>
                        <span>Vừa xong</span>
                      </div>
                      <p className="font-bold text-white mt-0.5">
                        TK 102xxx: <span className="text-rose-400">-{formatVND(amount)}</span>
                      </p>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">
                        ND: {orderCode} | SD: {formatVND(simSenderBalance)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Island & Status Bar Top */}
              <div className="w-full pt-1 px-4 flex items-center justify-between text-white text-[11px] font-semibold z-40 select-none">
                <span>{currentTime || '14:20'}</span>

                {/* Dynamic Island Pill */}
                <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center px-2 gap-1.5 shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold">5G</span>
                  <Battery className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* App Screen Container */}
              <div className="relative flex-1 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 rounded-[38px] mt-2 overflow-hidden flex flex-col text-slate-100">
                {/* Banking App Header */}
                <div
                  className={`p-4 ${
                    simBankApp === 'VCB' ? 'bg-emerald-900/80' : 'bg-blue-900/80'
                  } backdrop-blur-md border-b border-white/10 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs text-white">
                      {simBankApp === 'VCB' ? 'VCB' : 'MB'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-wide text-white uppercase">
                        {simBankApp === 'VCB' ? 'VCB Digibank' : 'MB Bank App'}
                      </h4>
                      <p className="text-[9px] text-slate-300 font-mono">
                        Số dư: {formatVND(simSenderBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSimBankApp(simBankApp === 'VCB' ? 'MB' : 'VCB')}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors"
                    >
                      Đổi App
                    </button>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    STEP 1: CAMERA SCANNER VIEWFINDER
                    ------------------------------------------------------------- */}
                {simStep === 'SCAN' && (
                  <div className="flex-1 p-5 flex flex-col items-center justify-between text-center relative animate-in fade-in duration-200">
                    <div>
                      <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-[10px] uppercase tracking-wider">
                        Bước 1 / 3: Quét QR
                      </span>
                      <h3 className="text-base font-black text-white mt-2">Quét mã QR Napas 247</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Hướng camera về phía mã QR trên hóa đơn</p>
                    </div>

                    {/* Camera Mockup Viewport */}
                    <div className="relative w-52 h-52 bg-slate-950/80 rounded-3xl border border-white/20 overflow-hidden flex items-center justify-center shadow-inner group">
                      {/* Fake live camera feed background with animated scan line */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950/50 flex items-center justify-center">
                        <QrCode className="w-28 h-28 text-white/20 group-hover:text-teal-400/40 transition-colors" />
                      </div>

                      {/* Camera Corner Brackets */}
                      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg pointer-events-none" />
                      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg pointer-events-none" />
                      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg pointer-events-none" />
                      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg pointer-events-none" />

                      {/* Scanning Laser Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[scan_2s_ease-in-out_infinite]" />

                      {/* Center Focus Dot */}
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>

                    <div className="w-full space-y-2">
                      <button
                        type="button"
                        onClick={handlePhoneScanQr}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                      >
                        <Scan className="w-4 h-4" />
                        <span>Bấm để Quét Trúng Mã QR</span>
                      </button>
                      <p className="text-[10px] text-slate-400">Tự động nhận diện STK & Số tiền</p>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    STEP 2: CONFIRM TRANSFER DETAILS
                    ------------------------------------------------------------- */}
                {simStep === 'CONFIRM' && (
                  <div className="flex-1 p-5 flex flex-col justify-between text-left animate-in slide-in-from-right-4 duration-200">
                    <div>
                      <div className="text-center mb-3">
                        <span className="px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-[10px] uppercase tracking-wider">
                          Bước 2 / 3: Xác nhận
                        </span>
                        <h3 className="text-base font-black text-white mt-1">Chi tiết Chuyển tiền 24/7</h3>
                      </div>

                      {/* Transfer Details Card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Người nhận</p>
                          <p className="text-sm font-black text-emerald-400 uppercase">{selectedBank.accountName}</p>
                          <p className="text-[11px] text-slate-300 font-mono">
                            {selectedBank.shortName} - {selectedBank.accountNumber}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                          <span className="text-slate-400">Số tiền:</span>
                          <span className="text-base font-black text-white">{formatVND(amount)}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Phí giao dịch:</span>
                          <span className="font-bold text-emerald-400">0 VND (Miễn phí)</span>
                        </div>

                        <div className="pt-2 border-t border-white/10">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Nội dung:</span>
                          <p className="font-mono font-bold text-amber-300 text-xs mt-0.5">{orderCode}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handlePhoneConfirmTransfer}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác nhận & Chuyển tiền</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimStep('SCAN')}
                        className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors text-center"
                      >
                        Quay lại quét mã
                      </button>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    STEP 3: BIOMETRIC FACE ID / OTP AUTHENTICATION
                    ------------------------------------------------------------- */}
                {simStep === 'FACE_ID' && (
                  <div className="flex-1 p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-3xl border-2 border-emerald-400/80 bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)] animate-pulse">
                        <Fingerprint className="w-12 h-12" />
                      </div>
                      <div className="absolute inset-0 rounded-3xl border-2 border-teal-300 animate-ping opacity-30" />
                    </div>

                    <h3 className="text-base font-black text-white mb-1">Đang xác thực Face ID</h3>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Hệ thống đang tiến hành ký số giao dịch chuyển khoản Napas247 bảo mật...
                    </p>

                    <div className="mt-6 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Xác thực thành công, đang chuyển tiền...</span>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    STEP 4: ELECTRONIC TRANSACTION RECEIPT SUCCESS
                    ------------------------------------------------------------- */}
                {simStep === 'SUCCESS' && (
                  <div className="flex-1 p-5 flex flex-col justify-between text-left animate-in zoom-in-95 duration-300">
                    <div className="text-center pt-2">
                      <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/30">
                        <Check className="w-8 h-8 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        Napas 247 Hoàn Tất
                      </span>
                      <h3 className="text-base font-black text-white">Chuyển tiền thành công!</h3>
                      <p className="text-xl font-black text-emerald-400 mt-1">{formatVND(amount)}</p>
                    </div>

                    {/* Receipt Details */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Người nhận:</span>
                        <span className="font-bold text-white">{selectedBank.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Số tài khoản:</span>
                        <span className="font-bold text-slate-200">{selectedBank.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ngân hàng:</span>
                        <span className="font-bold text-slate-200">{selectedBank.shortName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mã giao dịch:</span>
                        <span className="font-bold text-emerald-400">{transactionInfo?.transactionId || 'FT26892341'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Thời gian:</span>
                        <span className="font-bold text-slate-300">{transactionInfo?.paidAt || 'Vừa xong'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsPhoneModalOpen(false)}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Trở lại Màn Hình Đặt Hàng</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* iPhone Home Bar */}
              <div className="w-full py-1 flex items-center justify-center">
                <div className="w-32 h-1 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
