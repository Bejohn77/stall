import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiPlus, FiSearch, FiTrash2, FiEdit3, FiPackage } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Topbar from '../components/Topbar'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      category: '',
      buyingPrice: '',
      sellingPrice: '',
      stockQuantity: '',
      unit: 'pcs',
      barcode: '',
    },
  })

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await api.get('/products')
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const normalizedCategory = category.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !normalizedCategory || `${product.category}`.toLowerCase().includes(normalizedCategory)
      return matchesSearch && matchesCategory
    })
  }, [products, search, category])

  const openCreateModal = () => {
    setEditingProduct(null)
    reset({ name: '', category: '', buyingPrice: '', sellingPrice: '', stockQuantity: '', unit: 'pcs', barcode: '' })
    setModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setValue('name', product.name)
    setValue('category', product.category)
    setValue('buyingPrice', product.buyingPrice)
    setValue('sellingPrice', product.sellingPrice)
    setValue('stockQuantity', product.stockQuantity)
    setValue('unit', product.unit)
    setValue('barcode', product.barcode || '')
    setModalOpen(true)
  }

  const onSubmit = async (formData) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData)
        toast.success('Product updated')
      } else {
        await api.post('/products', formData)
        toast.success('Product created')
      }
      setModalOpen(false)
      fetchProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save product')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Product deleted')
      fetchProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="space-y-6">
      <Topbar title="Products" subtitle="Manage inventory and pricing" />
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <FiSearch />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="w-full border-0 bg-transparent outline-none" />
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Type category to filter"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <button onClick={openCreateModal} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 font-medium text-white dark:bg-slate-800">
            <FiPlus />
            Add Product
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-[24px] bg-slate-200 dark:bg-slate-800" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <div key={product._id} className="rounded-[24px] border border-slate-200 p-4 shadow-sm dark:border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.category}</p>
                  </div>
                  <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.stockQuantity <= 3 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                    {product.stockQuantity <= 0 ? 'Out of Stock' : product.stockQuantity <= 3 ? 'Low Stock' : 'In Stock'}
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between"><span>Buy</span><span>{formatCurrency(product.buyingPrice)}</span></div>
                  <div className="flex items-center justify-between"><span>Sell</span><span>{formatCurrency(product.sellingPrice)}</span></div>
                  <div className="flex items-center justify-between"><span>Stock</span><span>{product.stockQuantity} {product.unit}</span></div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => openEditModal(product)} className="rounded-2xl bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <FiEdit3 />
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="rounded-2xl bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                <p className="text-sm text-slate-500">Capture product details and stock</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">Close</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <input {...register('name', { required: true })} placeholder="Product name" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
              <input {...register('category', { required: true })} placeholder="Category" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
              <input type="number" step="0.01" {...register('buyingPrice', { required: true })} placeholder="Buying price" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
              <input type="number" step="0.01" {...register('sellingPrice', { required: true })} placeholder="Selling price" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
              <input type="number" {...register('stockQuantity', { required: true })} placeholder="Stock quantity" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
              <input {...register('unit', { required: true })} placeholder="Unit" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
              <input {...register('barcode')} placeholder="Barcode (optional)" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900 md:col-span-2" />
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-2">Cancel</button>
                <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-2 text-white dark:bg-slate-800">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
