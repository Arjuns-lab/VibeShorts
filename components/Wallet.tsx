import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { CoinIcon, UpiIcon } from '../constants';

interface WalletProps {
    user: User;
    transactions: Transaction[];
    onClose: () => void;
    onOpenPayoutSetup: () => void;
    onCashOut: (amount: number) => boolean;
}

const Wallet: React.FC<WalletProps> = ({ user, transactions, onClose, onOpenPayoutSetup, onCashOut }) => {
    const [isCashingOut, setIsCashingOut] = useState(false);
    const [cashOutAmount, setCashOutAmount] = useState('');
    const [error, setError] = useState('');

    const handleCashOutClick = () => {
        if (!user.payoutsSetUp) {
            onOpenPayoutSetup();
            return;
        }
        setIsCashingOut(true);
    };
    
    const handleConfirmCashOut = () => {
        const amount = Number(cashOutAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (amount > user.vibeCoinBalance) {
            setError("You don't have enough VibeCoins for this transaction.");
            return;
        }
        const success = onCashOut(amount);
        if (success) {
            setCashOutAmount('');
            setError('');
            setIsCashingOut(false);
            onClose(); // Close wallet after successful cash out
            alert(`Successfully cashed out ${amount} VibeCoins!`);
        } else {
            setError("Something went wrong. Please try again.");
        }
    };

    const getTransactionIcon = (type: Transaction['type']) => {
        switch(type) {
            case 'earn_watch': return '🎬';
            case 'earn_bonus': return '🎉';
            case 'tip_sent': return '💸';
            case 'cash_out': return '💳';
            default: return '🪙';
        }
    };

    if (isCashingOut) {
        return (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center" onClick={() => setIsCashingOut(false)}>
                <div className="bg-[var(--frame-bg-color)] text-[var(--text-color)] w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-4 font-display" onClick={e => e.stopPropagation()}>
                     <h2 className="text-2xl font-black text-center">Cash Out</h2>
                     <div className="text-center bg-[var(--bg-color)] p-3 rounded-xl">
                        <p className="text-sm font-semibold opacity-70">Available to Withdraw</p>
                        <div className="flex justify-center items-center gap-2"><CoinIcon className="w-6 h-6" /><span className="text-2xl font-black">{user.vibeCoinBalance.toLocaleString()}</span></div>
                     </div>
                     <p className="text-center text-sm opacity-70">
                        Withdrawals will be sent to your saved UPI ID: <span className="font-bold">{user.upiId}</span>
                     </p>
                     <div>
                        <label className="font-bold">Amount (VibeCoins)</label>
                        <input
                            type="number"
                            value={cashOutAmount}
                            onChange={(e) => { setCashOutAmount(e.target.value); setError(''); }}
                            placeholder="e.g., 500"
                            className="w-full mt-1 bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-medium text-lg"
                        />
                     </div>
                      {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
                     <div className="flex gap-2 mt-2">
                        <button onClick={() => setIsCashingOut(false)} className="w-full py-3 font-bold border-2 border-[var(--border-color)] rounded-xl hover:bg-[var(--text-color)]/10">Cancel</button>
                        <button onClick={handleConfirmCashOut} className="w-full py-3 font-bold text-white bg-[var(--accent-color)] rounded-xl">Confirm</button>
                    </div>
                </div>
             </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--frame-bg-color)] text-[var(--text-color)] w-full max-w-sm h-[85vh] sm:h-auto sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-xl border-4 border-[var(--border-color)] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b-2 border-[var(--border-color)]">
                    <h2 className="text-3xl font-black font-display">My Wallet</h2>
                    <button onClick={onClose} className="text-2xl font-bold opacity-60 hover:opacity-100">&times;</button>
                </header>

                <div className="p-6 text-center flex-shrink-0">
                    <p className="text-sm font-bold opacity-70">Current Balance</p>
                    <div className="flex justify-center items-center gap-2 mt-1">
                        <CoinIcon className="w-10 h-10" />
                        <p className="text-5xl font-black font-display">{user.vibeCoinBalance.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 px-6 pb-4 flex-shrink-0">
                    <button 
                        onClick={handleCashOutClick}
                        className="w-full py-3 text-lg font-bold text-center border-2 border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] transition-colors hover:bg-[var(--border-color)]"
                    >
                        Cash Out
                    </button>
                    <button className="w-full py-3 text-lg font-bold text-center border-2 border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        Buy More
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto px-6 space-y-3 pb-6">
                    <h3 className="font-bold text-lg font-display">Transaction History</h3>
                    {transactions.length > 0 ? (
                        [...transactions].reverse().map(tx => (
                            <div key={tx.id} className="flex items-center justify-between bg-[var(--bg-color)] p-3 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{getTransactionIcon(tx.type)}</div>
                                    <div>
                                        <p className="font-bold">{tx.description}</p>
                                        <p className="text-xs opacity-60">{new Date(tx.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                                <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center opacity-70 pt-8">No transactions yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wallet;