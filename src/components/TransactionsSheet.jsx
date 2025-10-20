import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// A simple slide-over sheet showing recent income and expense rows
export default function TransactionsSheet({ open, onClose }) {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [items, setItems] = useState([])

	useEffect(() => {
		if (!open) return
		;(async () => {
			try {
				setError('')
				setLoading(true)
				const { data: session } = await supabase.auth.getSession()
				const uid = session?.session?.user?.id
				if (!uid) throw new Error('Not signed in')

				// Fetch last 10 combined transactions (expenses + incomes)
				const { data: exp } = await supabase
					.from('expenses')
					.select('id, amount, date, description, category')
					.eq('user_id', uid)
					.order('date', { ascending: false })
					.limit(10)

				const { data: inc } = await supabase
					.from('incomes')
					.select('id, amount, date, description, category')
					.eq('user_id', uid)
					.order('date', { ascending: false })
					.limit(10)

				const rows = [
					...(exp || []).map(r => ({ ...r, _type: 'expense' })),
					...(inc || []).map(r => ({ ...r, _type: 'income' })),
				]
				rows.sort((a, b) => new Date(b.date) - new Date(a.date))
				setItems(rows.slice(0, 12))
			} catch (e) {
				setError(e.message || 'Failed to load')
			} finally {
				setLoading(false)
			}
		})()
	}, [open])

	const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)

	const downloadPdf = async () => {
		try {
			// Lazy load PDF deps to avoid bundler errors if not installed
			const { default: jsPDF } = await import('jspdf')
			await import('jspdf-autotable')

			const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
			doc.setFontSize(14)
			doc.text('ExpenseAI - Recent Transactions', 40, 40)
			doc.setFontSize(10)
			doc.text(new Date().toLocaleString(), 40, 58)

			const rows = items.map(t => [
				new Date(t.date).toLocaleDateString('en-IN'),
				t._type.toUpperCase(),
				t.category || '—',
				fmt(t.amount),
				t.description || ''
			])

			// @ts-ignore - plugin injected
			doc.autoTable({
				head: [['Date', 'Type', 'Category', 'Amount', 'Description']],
				body: rows,
				startY: 75,
				styles: { fontSize: 9 },
				theme: 'grid'
			})

			doc.save('recent-transactions.pdf')
		} catch (e) {
			// Fallback: open printable HTML if PDF libs are missing
			try {
				const html = `
				<!doctype html>
				<html>
				<head>
				  <meta charset="utf-8" />
				  <title>Recent Transactions</title>
				  <style>
				    body { font-family: Arial, sans-serif; padding: 20px; }
				    h1 { margin: 0 0 10px; }
				    table { width: 100%; border-collapse: collapse; }
				    th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
				    th { background: #f0fdf4; }
				  </style>
				</head>
				<body>
				  <h1>ExpenseAI - Recent Transactions</h1>
				  <div>${new Date().toLocaleString()}</div>
				  <table>
				    <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead>
				    <tbody>
				      ${items.map(t => `<tr>
				        <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
				        <td>${t._type.toUpperCase()}</td>
				        <td>${(t.category||'—')}</td>
				        <td>${fmt(t.amount)}</td>
				        <td>${(t.description||'')}</td>
				      </tr>`).join('')}
				    </tbody>
				  </table>
				  <script>window.print();</script>
				</body>
				</html>`;
				const w = window.open('', '_blank')
				if (w) {
					w.document.write(html)
					w.document.close()
				}
			} catch (fallbackErr) {
				console.error('PDF export failed', e, fallbackErr)
			}
		}
	}

    return (
        <div className={`${open ? 'fixed' : 'hidden'} inset-0 z-50`}> 
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            {/* Sheet */}
            <div className="absolute top-0 right-0 h-full w-full sm:w-[440px] bg-gradient-to-b from-white to-green-50 shadow-xl border-l border-green-200 p-4 overflow-y-auto">
				<div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                        <p className="text-xs text-gray-500">Incomes are green, expenses are red</p>
                    </div>
					<div className="flex items-center gap-2">
						<button onClick={downloadPdf} className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700">Download PDF</button>
						<button onClick={onClose} className="p-2 rounded hover:bg-green-100">✕</button>
					</div>
                </div>
                {loading ? (
                    <p className="text-sm text-gray-500">Loading…</p>
                ) : error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent transactions</p>
                ) : (
                    <ul className="space-y-2">
                        {items.map((t) => (
                            <li key={`${t._type}-${t.id}`} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${t._type === 'expense' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                                <div>
                                    <p className={`text-sm font-semibold ${t._type === 'expense' ? 'text-red-700' : 'text-green-700'}`}>
                                        {t._type === 'expense' ? '−' : '+'} {fmt(t.amount)}
                                    </p>
                                    <p className="text-xs text-gray-600">{t.category || '—'} • {new Date(t.date).toLocaleDateString('en-IN')}</p>
                                </div>
                                <span className="text-xs text-gray-700 truncate max-w-[55%]">{t.description || ''}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}


