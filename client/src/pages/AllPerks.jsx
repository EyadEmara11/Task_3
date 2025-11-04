import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function AllPerks() {
  
 
  const [perks, setPerks] = useState([])

  const [searchQuery, setSearchQuery] = useState('')

 
  const [merchantFilter, setMerchantFilter] = useState('')

 
  const [uniqueMerchants, setUniqueMerchants] = useState([])

  
  const [loading, setLoading] = useState(true)

  
  const [error, setError] = useState('')

  // Ref to track if component has mounted (prevents double loading on initial mount)
  const isMounted = useRef(false)

  // ==================== SIDE EFFECTS WITH useEffect HOOK ====================

  // Define loadAllPerks function
  async function loadAllPerks() {
    // Reset error state before new request
    setError('')
    
    // Show loading indicator
    setLoading(true)
    
    try {
      // Make GET request to /api/perks/all with query parameters
      const params = {
        // Only include search param if searchQuery is not empty
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        // Only include merchant param if merchantFilter is not empty
        ...(merchantFilter.trim() && { merchant: merchantFilter.trim() })
      }
      
      console.log('Loading perks with params:', params)
      const res = await api.get('/perks/all', { params })
      
      console.log('Perks loaded:', res.data)
      // Update perks state with response data
      setPerks(res.data.perks || [])
      
    } catch (err) {
      // Handle errors (network failure, server error, etc.)
      console.error('Failed to load perks:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load perks. Make sure the server is running on port 4000.'
      setError(errorMessage)
      setPerks([]) // Clear perks on error
      
    } finally {
      // This block runs whether try succeeds or catch handles error
      // Always stop loading indicator
      setLoading(false)
    }
  }

  // useEffect Hook #1: Initial Data Loading
  useEffect(() => {
    // Load all perks when component first mounts
    loadAllPerks()
    // Mark as mounted after initial load
    isMounted.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run on mount

  // useEffect Hook #2: Auto-search on Input Change (with debounce)
  useEffect(() => {
    // Skip auto-search on initial mount (initial load handles it)
    if (!isMounted.current) return

    // Set up debounce timer to wait 500ms after user stops typing
    const debounceTimer = setTimeout(() => {
      loadAllPerks()
    }, 500)

    // Cleanup: cancel the timer if searchQuery or merchantFilter changes again
    // This ensures we only make the API call after user stops typing
    return () => clearTimeout(debounceTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, merchantFilter]) // Re-run when search or filter changes

  
  useEffect(() => {
    // Extract all merchant names from perks array
    const merchants = perks
      .map(perk => perk.merchant) // Get merchant from each perk
      .filter(merchant => merchant && merchant.trim()) // Remove empty/null values
    
    // Create array of unique merchants using Set
    // Set automatically removes duplicates, then we convert back to array
    const unique = [...new Set(merchants)]
    
    // Update state with unique merchants
    setUniqueMerchants(unique)
    
    // This effect depends on [perks], so it re-runs whenever perks changes
  }, [perks]) // Dependency: re-run when perks array changes

  // ==================== EVENT HANDLERS ====================

  
  function handleSearch(e) {
    // Prevent default form submission behavior (page reload)
    e.preventDefault()
    
    // Immediately reload perks with current search and filter values
    // This bypasses the debounce delay for instant results
    loadAllPerks()
  }

  
  function handleReset() {
    // Reset search and filter states to empty
    // The useEffect with [searchQuery, merchantFilter] dependencies
    // will automatically trigger and reload all perks
    setSearchQuery('')
    setMerchantFilter('')
  }

  
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Perks</h1>
        <div className="text-sm text-zinc-600">
          Showing {perks.length} perk{perks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search and Filter Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <span className="material-symbols-outlined text-sm align-middle">search</span>
                {' '}Search by Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Enter perk name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <p className="text-xs text-zinc-500 mt-1">
                Auto-searches as you type, or press Enter / click Search
              </p>
            </div>

            {/* Merchant Filter Dropdown - Controlled Component */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <span className="material-symbols-outlined text-sm align-middle">store</span>
                {' '}Filter by Merchant
              </label>
              <select
                className="input"
                value={merchantFilter}
                onChange={(e) => setMerchantFilter(e.target.value)}
              >
                <option value="">All Merchants</option>
                
                {uniqueMerchants.map(merchant => (
                  <option key={merchant} value={merchant}>
                    {merchant}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 items-center">
            <button type="submit" className="btn bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
              <span className="material-symbols-outlined text-sm align-middle">search</span>
              {' '}Search Now
            </button>
            <button 
              type="button" 
              onClick={handleReset}
              className="btn"
            >
              <span className="material-symbols-outlined text-sm align-middle">refresh</span>
              {' '}Reset Filters
            </button>
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Searching...
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Error Message - Inline, doesn't replace the UI */}
      {error && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600">
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
            </div>
            <button onClick={loadAllPerks} className="btn text-sm">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Perks Grid - Always visible, updates in place */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 
          Conditional Rendering with map():
          - If perks.length > 0: Show perk cards
          - If perks.length === 0: Show empty state (after the map)
        */}
        {perks.map(perk => (
          
          <Link
            key={perk._id}
            to={`/perks/${perk._id}/view`}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            {/* Perk Title (bold) */}
            <div className="font-bold text-lg text-zinc-900 mb-2">
              {perk.title}
            </div>

            {/* Perk Metadata */}
            <div className="text-sm text-zinc-600 space-y-1">
              {/* Conditional Rendering with && operator */}
              {/* Only show merchant if it exists */}
              {perk.merchant && (
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">store</span>
                  {perk.merchant}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">category</span>
                <span className="capitalize">{perk.category}</span>
              </div>
              
              {/* Discount percentage above description */}
              <div className="mt-2 text-green-600 font-semibold">
                {(perk.discountPercent ?? 0)}% OFF
                </div>
            </div>

            {/* Description - truncated if too long */}
            {perk.description && (
              <p className="mt-2 text-sm text-zinc-700 line-clamp-2">
                {perk.description}
              </p>
            )}

            {/* Creator info - populated from backend */}
            {perk.createdBy && (
              <div className="mt-3 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
                Created by: {perk.createdBy.name || perk.createdBy.email}
              </div>
            )}
          </Link>
        ))}

        
        {perks.length === 0 && !loading && !error && (
          <div className="col-span-full text-center py-12 text-zinc-600">
            <span className="material-symbols-outlined text-5xl mb-4 block text-zinc-400">
              sentiment_dissatisfied
            </span>
            <p className="text-lg">No perks found.</p>
            {searchQuery || merchantFilter ? (
            <p className="text-sm mt-2">Try adjusting your search or filters.</p>
            ) : (
              <div className="mt-4">
                <p className="text-sm mb-4">The database is empty. Create your first perk!</p>
                <Link to="/perks/new" className="btn bg-blue-600 text-white border-blue-600 hover:bg-blue-700 inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Create Your First Perk
                </Link>
              </div>
            )}
          </div>
        )}

        
        {loading && perks.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-600">
            <span className="material-symbols-outlined text-5xl mb-4 block text-zinc-400 animate-spin">
              progress_activity
            </span>
            <p className="text-lg">Loading perks...</p>
          </div>
        )}
      </div>
    </div>
  )
}

