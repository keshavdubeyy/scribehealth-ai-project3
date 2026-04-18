import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const TABLES = ['patients', 'sessions', 'prescription_templates'] as const

export default async function SupabaseTestPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const results = await Promise.all(
    TABLES.map(async (table) => {
      const { error } = await supabase.from(table).select('*').limit(1)
      return { table, ok: !error, error: error?.message }
    })
  )

  const allOk = results.every(r => r.ok)

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-2">Supabase Connection Test</h1>
      <p className={`text-sm mb-6 font-medium ${allOk ? 'text-green-600' : 'text-red-600'}`}>
        {allOk
          ? '✓ Connected — all tables reachable'
          : '✗ One or more tables missing — run frontend/supabase/schema.sql in the Supabase SQL Editor'}
      </p>
      <ul className="space-y-2">
        {results.map(r => (
          <li key={r.table} className="flex items-center gap-3 text-sm">
            <span className={r.ok ? 'text-green-600' : 'text-red-500'}>{r.ok ? '✓' : '✗'}</span>
            <span className="font-mono">{r.table}</span>
            {r.error && <span className="text-red-400 text-xs">{r.error}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
