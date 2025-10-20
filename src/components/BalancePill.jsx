import React from 'react'
import { useLiveBalance } from '../lib/useLiveBalance'

// A compact, highly visible balance pill for the navbar
export default function BalancePill({ onClick, baseIncome = undefined }) {
	const { loading, error, balanceInr, isNegative } = useLiveBalance(baseIncome)

	return (
		<button
			onClick={onClick}
			className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
				loading || error
					? 'border-gray-300 text-gray-500 bg-white'
					: isNegative
					? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
					: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
			}`}
			title="Click to view recent transactions"
		>
			<span className="text-base">💰</span>
			{loading ? (
				<span className="animate-pulse">Calculating…</span>
			) : error ? (
				<span>—</span>
			) : (
				<span>{balanceInr}</span>
			)}
		</button>
	)
}


