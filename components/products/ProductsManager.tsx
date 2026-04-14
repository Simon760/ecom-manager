'use client'
// ============================================================
// PRODUCTS MANAGER — Suivi des produits
// ============================================================
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/services/products.service'
import { Product, ProductFormData, Currency } from '@/types'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import { CURRENCY_SYMBOLS } from '@/types'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import { Plus, Trash2, Pencil, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductsManagerProps {
  projectId: string
  currency: Currency
}

export default function ProductsManager({ projectId, currency }: ProductsManagerProps) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'margin'>('revenue')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getProducts(projectId, user.uid)
      .then((items) => { if (!cancelled) setProducts(items) })
      .catch((err) => {
        if (!cancelled) {
          console.error('Erreur chargement produits:', err)
          setLoadError('Erreur lors du chargement des produits.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId, user])

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'orders') return b.orders - a.orders
    if (sortBy === 'margin') return b.margin - a.margin
    return b.revenue - a.revenue
  })

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const totalOrders = products.reduce((s, p) => s + p.orders, 0)

  const handleSubmit = async (data: ProductFormData) => {
    setSaving(true)
    setSaveError(null)
    try {
      if (editItem) {
        await updateProduct(editItem.id, data)
        // Recalc localement (cohérent avec products.service.ts)
        const aov = data.orders > 0 ? data.revenue / data.orders : 0
        const netRev = aov * (1 - data.refundRate / 100)
        const margin = netRev > 0 ? ((netRev - data.cogs) / netRev) * 100 : 0
        setProducts((prev) => prev.map((p) => p.id === editItem.id ? { ...p, ...data, aov, margin } : p))
      } else {
        const newP = await addProduct(projectId, user!.uid, data)
        setProducts((prev) => [newP, ...prev])
      }
      setShowModal(false)
      setEditItem(null)
    } catch (err) {
      console.error('Erreur sauvegarde produit:', err)
      setSaveError('Erreur lors de l\'enregistrement du produit.')
    } finally { setSaving(false) }
  }

  if (loading) return <Spinner size="md" className="mt-10 mx-auto" />
  if (loadError) return (
    <div className="mt-10 mx-auto max-w-md p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-center">
      {loadError}
    </div>
  )

  return (
    <div className="space-y-5">
      {saveError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {saveError}
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-[10px] text-zinc-500 mb-1">Revenue total</p>
          <p className="text-sm font-bold text-zinc-100">{formatCurrency(totalRevenue, currency)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[10px] text-zinc-500 mb-1">Commandes totales</p>
          <p className="text-sm font-bold text-zinc-100">{formatNumber(totalOrders)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[10px] text-zinc-500 mb-1">Produits suivis</p>
          <p className="text-sm font-bold text-zinc-100">{products.length}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <CardHeader title="Produits" className="mb-0" />
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
            >
              <option value="revenue">Trier : Revenue</option>
              <option value="orders">Trier : Commandes</option>
              <option value="margin">Trier : Marge</option>
            </select>
            <Button size="sm" icon={<Plus size={12} />} onClick={() => { setEditItem(null); setShowModal(true) }}>
              Ajouter
            </Button>
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<Package size={22} />}
            title="Aucun produit"
            description="Suivez les performances de vos produits."
            action={{ label: '+ Ajouter un produit', onClick: () => setShowModal(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Produit', 'Revenue', 'Commandes', 'AOV', 'COGS', 'Marge', 'Remb.', ''].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-zinc-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((product) => (
                  <tr key={product.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 group">
                    <td className="px-3 py-3 text-zinc-200 font-medium max-w-[180px] truncate">
                      {product.name}
                    </td>
                    <td className="px-3 py-3 text-zinc-100 font-medium">{formatCurrency(product.revenue, currency)}</td>
                    <td className="px-3 py-3 text-zinc-400">{formatNumber(product.orders)}</td>
                    <td className="px-3 py-3 text-zinc-400">{formatCurrency(product.aov, currency)}</td>
                    <td className="px-3 py-3 text-zinc-500">{formatCurrency(product.cogs, currency)}</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'font-semibold',
                        product.margin >= 30 ? 'text-emerald-400' :
                        product.margin >= 15 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {formatPercent(product.margin)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-500">{formatPercent(product.refundRate)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => { setEditItem(product); setShowModal(true) }}
                          className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => setDeleteId(product.id)}
                          className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editItem ? 'Modifier le produit' : 'Nouveau produit'} size="sm">
        <ProductForm
          defaultValues={editItem ? {
            name: editItem.name, revenue: editItem.revenue, orders: editItem.orders,
            cogs: editItem.cogs, refundRate: editItem.refundRate,
          } : undefined}
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          currencySymbol={CURRENCY_SYMBOLS[currency]}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        message="Supprimer ce produit ?"
        loading={saving}
        onConfirm={async () => {
          if (!deleteId) return
          setSaving(true)
          setSaveError(null)
          try {
            await deleteProduct(deleteId)
            setProducts((prev) => prev.filter((p) => p.id !== deleteId))
            setDeleteId(null)
          } catch (err) {
            console.error('Erreur suppression produit:', err)
            setSaveError('Erreur lors de la suppression.')
          } finally { setSaving(false) }
        }}
      />
    </div>
  )
}

function ProductForm({ defaultValues, loading, onSubmit, onCancel, currencySymbol }: {
  defaultValues?: Partial<ProductFormData>
  loading: boolean
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  currencySymbol?: string
}) {
  const { register, handleSubmit } = useForm<ProductFormData>({
    defaultValues: { refundRate: 3, orders: 0, revenue: 0, cogs: 0, ...defaultValues },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input label="Nom du produit" required {...register('name', { required: true })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Revenue total" type="number" step="0.01" prefix={currencySymbol}
          {...register('revenue', { valueAsNumber: true, min: 0 })} />
        <Input label="Nombre de commandes" type="number" step="1"
          {...register('orders', { valueAsNumber: true, min: 0 })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="COGS / unité" type="number" step="0.01" prefix={currencySymbol}
          hint="Coût d'achat unitaire"
          {...register('cogs', { valueAsNumber: true, min: 0 })} />
        <Input label="Taux remboursement" type="number" step="0.1" suffix="%"
          {...register('refundRate', { valueAsNumber: true, min: 0, max: 100 })} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>Annuler</Button>
        <Button type="submit" fullWidth loading={loading}>Enregistrer</Button>
      </div>
    </form>
  )
}
