import React from 'react'
import { useLiveBalance } from '../lib/useLiveBalance'

// Example: set per-user base monthly income here or pass as a prop
// In a real app you may fetch this from a user profile/settings table.
const BASE_MONTHLY_INCOME_INR = 40000

export default function Navbar() {
	const { loading, error, balanceInr, isNegative } = useLiveBalance(BASE_MONTHLY_INCOME_INR)

	return (
		<header className="w-full bg-white/80 backdrop-blur border-b border-gray-200">
			<nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-xl">💹</span>
					<span className="font-semibold text-gray-900">ExpenseAI</span>
				</div>

				<div className="flex items-center gap-4">
					{loading && (
						<span className="text-sm text-gray-500 animate-pulse">Calculating balance…</span>
					)}
					{!loading && error && (
						<span className="text-sm text-red-600" title={error}>Failed to load</span>
					)}
					{!loading && !error && (
						<span className={`text-sm md:text-base font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
							💰 Balance: {balanceInr}
						</span>
					)}
				</div>
			</nav>
		</header>
	)
}


