'use client'
// ============================================================
// CSV IMPORT MODAL — Import de journées depuis un fichier CSV
// ============================================================
import React, { useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import { DailyStatFormData } from '@/types'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CSVImportModalProps {
  onImport: (rows: DailyStatFormData[]) => Promise<void>
  onCancel: () => void
  loading?: boolean
  currencySymbol?: string
}

type Step = 'upload' | 'map' | 'preview'

type MappableField = Exclude<keyof DailyStatFormData, 'offerBreakdowns' | 'cogsTotal' | 'channelBreakdowns'>

const FIELD_LABELS: Record<MappableField, string> = {
  date:       'Date *',
  revenue:    'Revenue',
  orders:     'Commandes',
  adSpend:    'Dépense pub',
  refunds:    'Remboursements',
  addToCart:  'Ajouts panier',
  checkout:   'Checkout',
  sessions:   'Sessions',
  notes:      'Notes',
}

// ── CSV parsing ──────────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const firstLine = text.split('\n')[0] ?? ''
  const delimiter = firstLine.includes(';') ? ';' : ','
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] ?? '' })
    return obj
  })
  return { headers, rows }
}

// ── Auto-map column name → field ─────────────────────────────
function autoMap(col: string): MappableField | '' {
  const c = col.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (['date', 'jour', 'day'].includes(c)) return 'date'
  if (['revenue', 'ca', 'chiffre', 'ventes', 'revenu', 'sales', 'turnover'].includes(c)) return 'revenue'
  if (['orders', 'commandes', 'cmds', 'cmd', 'ordres'].includes(c)) return 'orders'
  if (['adspend', 'spend', 'pub', 'depensepub', 'depense', 'publicite', 'budget', 'spending'].includes(c)) return 'adSpend'
  if (['refunds', 'remboursements', 'remb', 'refund'].includes(c)) return 'refunds'
  if (['addtocart', 'panier', 'atc', 'cart', 'ajoutspanier'].includes(c)) return 'addToCart'
  if (['checkout', 'checkouts'].includes(c)) return 'checkout'
  if (['sessions', 'session', 'visits', 'visiteurs'].includes(c)) return 'sessions'
  if (['notes', 'note', 'commentaire', 'comment'].includes(c)) return 'notes'
  return ''
}

// ── Row builder ──────────────────────────────────────────────
function buildRows(
  rawRows: Record<string, string>[],
  mapping: Record<string, MappableField | ''>,
): DailyStatFormData[] {
  return rawRows
    .map((row) => {
      const d: DailyStatFormData = { date: '', revenue: 0, orders: 0, adSpend: 0, addToCart: 0, checkout: 0, refunds: 0 }
      Object.entries(mapping).forEach(([col, field]) => {
        if (!field) return
        const val = row[col] ?? ''
        if (field === 'date') {
          // Accept YYYY-MM-DD or DD/MM/YYYY
          const v = val.trim()
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
            d.date = v
          } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
            const [dd, mm, yyyy] = v.split('/')
            d.date = `${yyyy}-${mm}-${dd}`
          } else {
            d.date = v
          }
        } else if (field === 'notes') {
          d.notes = val.trim()
        } else {
          const num = parseFloat(val.replace(',', '.')) || 0
          ;(d as Record<string, unknown>)[field] = num
        }
      })
      return d
    })
    .filter((d) => d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
}

// ── Component ────────────────────────────────────────────────
export default function CSVImportModal({
  onImport,
  onCancel,
  loading = false,
  currencySymbol = '€',
}: CSVImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [csvText, setCsvText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, MappableField | ''>>({})
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const processCSV = (text: string) => {
    const { headers: h, rows: r } = parseCSV(text)
    if (h.length === 0 || r.length === 0) {
      setParseError('CSV invalide ou vide. Vérifiez le format.')
      return
    }
    setParseError(null)
    setHeaders(h)
    setRawRows(r)
    const m: Record<string, MappableField | ''> = {}
    h.forEach((col) => { m[col] = autoMap(col) })
    setMapping(m)
    setStep('map')
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => processCSV(e.target?.result as string)
    reader.readAsText(file, 'UTF-8')
  }

  const validRows = step !== 'upload' ? buildRows(rawRows, mapping) : []

  const handleImport = async () => {
    if (validRows.length === 0) { setParseError('Aucune ligne valide à importer (vérifiez la colonne Date).'); return }
    setParseError(null)
    await onImport(validRows)
  }

  return (
    <div className="space-y-4">

      {/* ── Step 1 : Upload ── */}
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-[#2F3541] rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          >
            <Upload size={24} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-400 mb-1">Déposer un fichier .csv ici</p>
            <p className="text-xs text-zinc-600">ou cliquez pour parcourir</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-[#23272F]" />
            <span className="text-xs text-zinc-600">ou collez le CSV manuellement</span>
            <div className="flex-1 border-t border-[#23272F]" />
          </div>

          {/* Paste area */}
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={'date,revenue,orders,adSpend\n2024-01-15,1500,12,350'}
            className="w-full h-28 rounded-lg border border-[#2F3541] bg-[#12151C] text-xs text-zinc-300 p-3 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none placeholder:text-zinc-700"
          />

          {parseError && <p className="text-xs text-red-400">{parseError}</p>}

          {/* Format hint */}
          <div className="rounded-lg bg-[#0E1118] p-3 space-y-1">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase mb-1">Format accepté</p>
            <p className="text-[10px] text-zinc-500 font-mono">date,revenue,orders,adSpend,refunds,addToCart,checkout,sessions,notes</p>
            <p className="text-[10px] text-zinc-600 mt-1.5">• Séparateur : virgule <span className="text-zinc-500">,</span> ou point-virgule <span className="text-zinc-500">;</span></p>
            <p className="text-[10px] text-zinc-600">• Date : <span className="text-zinc-500 font-mono">YYYY-MM-DD</span> ou <span className="text-zinc-500 font-mono">DD/MM/YYYY</span></p>
            <p className="text-[10px] text-zinc-600">• Noms de colonnes flexibles — vous les mapperez à l'étape suivante</p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={onCancel}>Annuler</Button>
            <Button fullWidth icon={<FileText size={14} />} onClick={() => { if (!csvText.trim()) { setParseError('Collez du contenu CSV.'); return } processCSV(csvText) }}>
              Analyser
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2 : Map ── */}
      {step === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-zinc-300"><span className="font-semibold text-white">{rawRows.length}</span> lignes détectées dans le CSV</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400">Correspondance des colonnes CSV → champs</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {headers.map((col) => (
                <div key={col} className="flex items-center gap-3">
                  <span className="flex-1 text-xs text-zinc-400 font-mono bg-[#0E1118] rounded px-2 py-1 truncate min-w-0">{col}</span>
                  <span className="text-zinc-600 shrink-0">→</span>
                  <select
                    value={mapping[col] ?? ''}
                    onChange={(e) => setMapping((prev) => ({ ...prev, [col]: e.target.value as MappableField | '' }))}
                    className="flex-1 rounded-lg border border-[#2F3541] bg-[#12151C] text-xs text-zinc-100 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-w-0"
                  >
                    <option value="">— Ignorer —</option>
                    {(Object.keys(FIELD_LABELS) as MappableField[]).map((f) => (
                      <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {parseError && <p className="text-xs text-red-400">{parseError}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => setStep('upload')}>Retour</Button>
            <Button fullWidth onClick={() => {
              const rows = buildRows(rawRows, mapping)
              if (rows.length === 0) { setParseError('Aucune ligne valide — vérifiez la colonne Date (YYYY-MM-DD).'); return }
              setParseError(null); setStep('preview')
            }}>
              Prévisualiser ({buildRows(rawRows, mapping).length} lignes)
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3 : Preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-zinc-300"><span className="font-semibold text-white">{validRows.length}</span> journées prêtes à importer</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#23272F] max-h-72">
            <table className="w-full text-xs">
              <thead className="bg-[#12151C] sticky top-0">
                <tr>
                  {['Date', 'Revenue', 'Cmds', 'Pub', 'Remb.', 'ATC', 'Notes'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validRows.slice(0, 30).map((row, i) => (
                  <tr key={i} className="border-t border-[#1B1F27]">
                    <td className="px-2 py-1.5 text-zinc-300 font-mono whitespace-nowrap">{row.date}</td>
                    <td className="px-2 py-1.5 text-zinc-300 whitespace-nowrap">{currencySymbol}{row.revenue.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-zinc-400">{row.orders}</td>
                    <td className="px-2 py-1.5 text-zinc-400 whitespace-nowrap">{currencySymbol}{row.adSpend.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-zinc-500">{row.refunds ?? 0}</td>
                    <td className="px-2 py-1.5 text-zinc-500">{row.addToCart ?? 0}</td>
                    <td className="px-2 py-1.5 text-zinc-600 max-w-[120px] truncate">{row.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {validRows.length > 30 && (
            <p className="text-[10px] text-zinc-600 text-center">… et {validRows.length - 30} ligne(s) supplémentaire(s)</p>
          )}

          {parseError && <p className="text-xs text-red-400">{parseError}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => setStep('map')}>Retour</Button>
            <Button fullWidth loading={loading} icon={<Upload size={14} />} onClick={handleImport}>
              Importer {validRows.length} journée{validRows.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
