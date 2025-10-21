import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

// Computes live balance for current month using:
// balance = baseMonthlyIncome + SUM(income.amount) - SUM(expense.amount)
export function useLiveBalance(baseMonthlyIncomeInr = 0) {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [totalIncome, setTotalIncome] = useState(0)
	const [totalExpense, setTotalExpense] = useState(0)

	const fmtInr = (n) =>
		new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

	const monthRange = useMemo(() => {
		const now = new Date()
		const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
		return { start, end }
	}, [])

	const fetchTotals = async () => {
		try {
			setError('')
			setLoading(true)

			const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
			if (sessionErr) throw sessionErr
			const userId = sessionData?.session?.user?.id
			if (!userId) throw new Error('No authenticated user')

			const { data: incomeRows, error: incomeErr } = await supabase
				.from('incomes')
				.select('amount')
				.eq('user_id', userId)
				.gte('date', monthRange.start)
				.lte('date', monthRange.end)

			if (incomeErr) throw incomeErr
			let incomeSum = (incomeRows || []).reduce((s, r) => s + Number(r.amount || 0), 0)


			const { data: expenseRows, error: expenseErr } = await supabase
				.from('expenses')
				.select('amount')
				.eq('user_id', userId)
				.gte('date', monthRange.start)
				.lte('date', monthRange.end)

			if (expenseErr) throw expenseErr
			const expenseSum = (expenseRows || []).reduce((s, r) => s + Number(r.amount || 0), 0)

			setTotalIncome(incomeSum)
			setTotalExpense(expenseSum)
		} catch (e) {
			setError(e.message || 'Unknown error')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTotals()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [monthRange.start, monthRange.end])

	useEffect(() => {
		let channel
		;(async () => {
			const { data: sessionData } = await supabase.auth.getSession()
			const userId = sessionData?.session?.user?.id

			channel = supabase
				.channel('realtime-balance')
				.on('postgres_changes', { event: '*', schema: 'public', table: 'incomes' }, () => fetchTotals())
				.on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchTotals())
				.subscribe()
		})()

		return () => {
			if (channel) supabase.removeChannel(channel)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const balance = useMemo(() => baseMonthlyIncomeInr + totalIncome - totalExpense, [baseMonthlyIncomeInr, totalIncome, totalExpense])

	return {
		loading,
		error,
		totalIncome,
		totalExpense,
		balance,
		balanceInr: fmtInr(balance),
		isNegative: balance < 0,
	}
}


