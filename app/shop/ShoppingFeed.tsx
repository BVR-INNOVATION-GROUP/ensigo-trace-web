"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, Package, ShoppingCart, Image, TreeDeciduous, SlidersHorizontal, X, Check, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import api, { type SeedBatch } from "@/src/api/client";
import { formatCurrency } from "@/src/utils/currency";
import CartModal from "@/components/shop/CartModal";

interface ShopProduct {
    id: string;
    batchNumber: string;
    species: string;
    commonName?: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    nurseryName: string;
    nurseryLocation: string;
    region: string;
    status: string;
    photoUrl?: string;
}

export default function PublicShopPage() {
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialSearch = searchParams?.get('search') || '';
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [filtersLoading, setFiltersLoading] = useState(false);
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [search, setSearch] = useState(initialSearch);
    const [cartCount, setCartCount] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [showProductDetails, setShowProductDetails] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [cartItems, setCartItems] = useState<Record<string, number>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [productsPerPage, setProductsPerPage] = useState(10);

    // Temporary filter states for UI
    const [tempRegions, setTempRegions] = useState<string[]>([]);
    const [tempPriceRange, setTempPriceRange] = useState({ min: '', max: '' });
    const [tempTypes, setTempTypes] = useState<string[]>([]);

    // Search debouncing
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Refs for filter values to always get latest state
    const regionsRef = useRef<string[]>([]);
    const priceRangeRef = useRef({ min: '', max: '' });
    const typesRef = useRef<string[]>([]);

    // Update refs when state changes
    useEffect(() => {
        regionsRef.current = selectedRegions;
    }, [selectedRegions]);

    useEffect(() => {
        priceRangeRef.current = priceRange;
    }, [priceRange]);

    useEffect(() => {
        typesRef.current = selectedTypes;
    }, [selectedTypes]);

    // Animation variants
    const sidebarVariants = {
        hidden: { x: "100%" },
        visible: { x: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
        exit: { x: "100%", transition: { duration: 0.2 } },
    };

    const loadCartFromLocalStorage = () => {
        try {
            const cart = JSON.parse(localStorage.getItem("shopCart") || "[]");
            const cartItemsMap: Record<string, number> = {};
            cart.forEach((item: any) => {
                cartItemsMap[item.id] = (cartItemsMap[item.id] || 0) + item.quantity;
            });
            setCartItems(cartItemsMap);
            // Show unique items count
            const uniqueItemsCount = Object.keys(cartItemsMap).length;
            setCartCount(uniqueItemsCount);
        } catch (err) {
            console.error("Error loading cart from localStorage:", err);
            setCartItems({});
            setCartCount(0);
        }
    };

    const loadData = useCallback(async (showSearchLoading = false) => {
        try {
            if (showSearchLoading) {
                setSearchLoading(true);
            } else {
                setLoading(true);
            }

            const params: any = { limit: productsPerPage, offset: (currentPage - 1) * productsPerPage };

            // Add search parameter
            if (search.trim()) {
                params.search = search.trim();
            }

            // Add filter parameters
            if (selectedRegions.length > 0) {
                params.regions = selectedRegions.join(',');
            }

            if (priceRange.min) {
                params.min_price = parseFloat(priceRange.min);
            }

            if (priceRange.max) {
                params.max_price = parseFloat(priceRange.max);
            }

            // Process different filter types
            const statusFilters = selectedTypes.filter(type => ['in_nursery', 'approved', 'distributed'].includes(type));
            const unitFilters = selectedTypes.filter(type => ['count', 'kg', 'g'].includes(type));
            const qualityFilters = selectedTypes.filter(type => type.includes('germination'));

            // Add status filter
            if (statusFilters.length > 0) {
                params.status = statusFilters.join(',');
            }

            // Add unit filter
            if (unitFilters.length > 0) {
                params.units = unitFilters.join(',');
            }

            // Add quality filter (germination rate)
            if (qualityFilters.length > 0) {
                qualityFilters.forEach(quality => {
                    if (quality.includes('high')) {
                        params.min_germination = 80;
                    } else if (quality.includes('medium')) {
                        params.min_germination = 50;
                        params.max_germination = 80;
                    } else if (quality.includes('low')) {
                        params.max_germination = 50;
                    }
                });
            }

            const batchesRes = await api.getPublicBatches(params);
            console.log('API Response (loadData):', batchesRes);

            // No need to filter on client side anymore since backend handles it
            const batches = batchesRes.data || [];
            console.log('Batches from API (loadData):', batches.length, 'Total:', batchesRes.total);

            const shopProducts: ShopProduct[] = batches.map((batch: SeedBatch) => ({
                id: batch.id,
                batchNumber: batch.batch_number || batch.id,
                species: batch.species?.scientific_name || batch.species_name || "Unknown Species",
                commonName: batch.species?.common_name,
                quantity: Number(batch.current_quantity) || Number(batch.initial_quantity) || 0,
                unit: batch.unit || "count",
                pricePerUnit: 500,
                nurseryName: batch.nursery?.name || "Regional Nursery",
                nurseryLocation: batch.nursery?.location || batch.region || "Uganda",
                region: batch.region || "West Nile",
                status: batch.status || "available",
                photoUrl: batch.species?.photo_url,
            }));

            setProducts(shopProducts);
            setTotalProducts(batchesRes.total || 0);
            setTotalPages(Math.ceil((batchesRes.total || 0) / productsPerPage));
        } catch (err) {
            console.error("Error loading shop data:", err);
            setProducts([]);
            setTotalProducts(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    }, [currentPage, productsPerPage, search, selectedRegions, priceRange, selectedTypes]); // Include pagination dependencies

    const loadDataWithFilters = useCallback(async (currentSearch: string, currentRegions: string[], currentPriceRange: { min: string, max: string }, currentTypes: string[], showSearchLoading = false) => {
        try {
            if (showSearchLoading) {
                setSearchLoading(true);
            } else {
                setLoading(true);
            }

            const params: any = { limit: productsPerPage, offset: (currentPage - 1) * productsPerPage };

            // Add search parameter
            if (currentSearch.trim()) {
                params.search = currentSearch.trim();
            }

            // Add filter parameters
            if (currentRegions.length > 0) {
                params.regions = currentRegions.join(',');
            }

            if (currentPriceRange.min) {
                params.min_price = parseFloat(currentPriceRange.min);
            }

            if (currentPriceRange.max) {
                params.max_price = parseFloat(currentPriceRange.max);
            }

            // Process different filter types
            const statusFilters = currentTypes.filter(type => ['in_nursery', 'approved', 'distributed'].includes(type));
            const unitFilters = currentTypes.filter(type => ['count', 'kg', 'g'].includes(type));
            const qualityFilters = currentTypes.filter(type => type.includes('germination'));

            // Add status filter
            if (statusFilters.length > 0) {
                params.status = statusFilters.join(',');
            }

            // Add unit filter
            if (unitFilters.length > 0) {
                params.units = unitFilters.join(',');
            }

            // Add quality filter (germination rate)
            if (qualityFilters.length > 0) {
                qualityFilters.forEach(quality => {
                    if (quality.includes('high')) {
                        params.min_germination = 80;
                    } else if (quality.includes('medium')) {
                        params.min_germination = 50;
                        params.max_germination = 80;
                    } else if (quality.includes('low')) {
                        params.max_germination = 50;
                    }
                });
            }

            const batchesRes = await api.getPublicBatches(params);
            console.log('API Response (loadDataWithFilters):', batchesRes);

            // No need to filter on client side anymore since backend handles it
            const batches = batchesRes.data || [];
            console.log('Batches from API (loadDataWithFilters):', batches.length, 'Total:', batchesRes.total);

            const shopProducts: ShopProduct[] = batches.map((batch: SeedBatch) => ({
                id: batch.id,
                batchNumber: batch.batch_number || batch.id,
                species: batch.species?.scientific_name || batch.species_name || "Unknown Species",
                commonName: batch.species?.common_name,
                quantity: Number(batch.current_quantity) || Number(batch.initial_quantity) || 0,
                unit: batch.unit || "count",
                pricePerUnit: 500,
                nurseryName: batch.nursery?.name || "Regional Nursery",
                nurseryLocation: batch.nursery?.location || batch.region || "Uganda",
                region: batch.region || "West Nile",
                status: batch.status || "available",
                photoUrl: batch.species?.photo_url,
            }));

            setProducts(shopProducts);
            setTotalProducts(batchesRes.total || 0);
            setTotalPages(Math.ceil((batchesRes.total || 0) / productsPerPage));
        } catch (err) {
            console.error("Error loading shop data:", err);
            setProducts([]);
            setTotalProducts(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    }, [currentPage, productsPerPage]); // Include pagination dependencies

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleProductsPerPageChange = (newProductsPerPage: number) => {
        setProductsPerPage(newProductsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    useEffect(() => {
        loadDataWithFilters(search, regionsRef.current, priceRangeRef.current, typesRef.current, false);
        loadCartFromLocalStorage();
    }, []); // Only load on initial mount

    // Debounced search effect - use refs to get latest values
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (search.length >= 3) {
            searchTimeoutRef.current = setTimeout(() => {
                loadDataWithFilters(search, regionsRef.current, priceRangeRef.current, typesRef.current, true);
            }, 300); // 300ms debounce
        } else if (search.length === 0) {
            // Load all data when search is cleared
            loadDataWithFilters(search, regionsRef.current, priceRangeRef.current, typesRef.current, false);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [search, loadDataWithFilters]);

    // Effect to reload data when page changes
    useEffect(() => {
        if (currentPage > 1) { // Skip initial load since it's handled by the mount effect
            loadDataWithFilters(search, regionsRef.current, priceRangeRef.current, typesRef.current, false);
        }
    }, [currentPage, loadDataWithFilters]);

    const updateCartQuantity = (productId: string, quantity: number) => {
        let updatedCartItems: Record<string, number>;

        if (quantity <= 0) {
            // Remove from cart
            const newCartItems = { ...cartItems };
            delete newCartItems[productId];
            setCartItems(newCartItems);
            updatedCartItems = newCartItems;
        } else {
            // Update quantity
            updatedCartItems = { ...cartItems, [productId]: quantity };
            setCartItems(updatedCartItems);
        }

        // Update localStorage
        const cart = JSON.parse(localStorage.getItem("shopCart") || "[]");
        const existingIndex = cart.findIndex((item: any) => item.id === productId);

        if (quantity <= 0) {
            if (existingIndex >= 0) {
                cart.splice(existingIndex, 1);
            }
        } else if (existingIndex >= 0) {
            cart[existingIndex].quantity = quantity;
        } else {
            const product = products.find(p => p.id === productId);
            if (product) {
                cart.push({
                    id: product.id,
                    species: product.species,
                    commonName: product.commonName,
                    batchNumber: product.batchNumber,
                    quantity: quantity,
                    unit: product.unit,
                    pricePerUnit: product.pricePerUnit,
                    nurseryName: product.nurseryName,
                    photoUrl: product.photoUrl,
                });
            }
        }

        localStorage.setItem("shopCart", JSON.stringify(cart));
        // Show unique items count
        const uniqueItemsCount = Object.keys(updatedCartItems).length;
        setCartCount(uniqueItemsCount);
    };

    const clearFilters = () => {
        setTempRegions([]);
        setTempPriceRange({ min: '', max: '' });
        setTempTypes([]);
        setShowFilters(false);
    };

    const applyFilters = async () => {
        // Process status filters
        const statusFilters = tempTypes.filter(type =>
            ['in_nursery', 'approved', 'distributed'].includes(type)
        );

        // Process unit type filters  
        const unitFilters = tempTypes.filter(type =>
            ['count', 'kg', 'g'].includes(type)
        );

        // Process quality filters
        const qualityFilters = tempTypes.filter(type =>
            type.includes('germination')
        );

        setSelectedRegions(tempRegions);
        setPriceRange(tempPriceRange);
        setSelectedTypes([...statusFilters, ...unitFilters, ...qualityFilters]);
        setShowFilters(false);
        setCurrentPage(1); // Reset to first page when applying filters
        setFiltersLoading(true);
        try {
            await loadDataWithFilters(search, tempRegions, tempPriceRange, [...statusFilters, ...unitFilters, ...qualityFilters], false);
        } finally {
            setFiltersLoading(false);
        }
    };

    const handleAddToCart = (product: ShopProduct) => {
        const currentQuantity = cartItems[product.id] || 0;
        updateCartQuantity(product.id, currentQuantity + 1);
    };

    const handleProductClick = (product: ShopProduct) => {
        setSelectedProduct(product);
        setShowProductDetails(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-paper leading-relaxed">
                <header className="sticky top-0 z-50 bg-paper border-b border-[var(--border)] leading-relaxed">
                    <div className="max-w-[90vw] mx-auto px-3 py-4 leading-relaxed">
                        <div className="flex items-center justify-between gap-4">
                            <div className="w-32 h-8 bg-pale rounded-lg animate-pulse"></div>
                            <div className="flex-1 max-w-xl mx-4">
                                <div className="h-10 bg-pale rounded animate-pulse"></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-pale rounded animate-pulse"></div>
                                <div className="w-16 h-8 bg-pale rounded-lg animate-pulse"></div>
                                <div className="w-10 h-10 bg-pale rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="py-4 px-4 relative bg-pale min-h-[20vh] leading-relaxed">
                    <div className="max-w-7xl mx-auto px-6 py-8 leading-relaxed">
                        <div className="text-center">
                            <div className="w-64 h-8 bg-pale rounded animate-pulse mx-auto mb-2"></div>
                            <div className="w-96 h-4 bg-pale rounded-lg animate-pulse mx-auto"></div>
                        </div>
                    </div>
                </div>

                <main className="max-w-[85vw] mx-auto px-4 py-6 leading-relaxed">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-24 h-8 bg-pale rounded-lg animate-pulse"></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-6 justify-between items-start">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-pale rounded-lg overflow-hidden animate-pulse">
                                <div className="aspect-square bg-pale/50"></div>
                                <div className="p-6 space-y-3">
                                    <div className="h-4 bg-pale rounded"></div>
                                    <div className="h-3 bg-pale rounded w-3/4"></div>
                                    <div className="h-3 bg-pale rounded w-1/2"></div>
                                    <div className="h-4 bg-pale rounded w-1/3"></div>
                                    <div className="h-10 bg-pale rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper leading-relaxed">
            {/* Header - NOT in primary color */}
            <header className="sticky top-0 z-50 bg-paper border-b border-[var(--border)] leading-relaxed">
                <div className="max-w-[90vw] mx-auto px-3 py-4 leading-relaxed">
                    <div className="flex items-center justify-between gap-4">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 flex-shrink-0">
                            {/* <TreeDeciduous className="text-primary" size={28} /> */}
                            <span className="text-xl font-bold text-[var(--very-dark-color)]">Ensigo Trace</span>
                        </Link>

                        <div className="flex-1 max-w-xl mx-4">
                            <div className="flex items-center gap-2 bg-pale rounded-sm px-5 py-3">
                                <div className="relative flex-1 flex items-center gap-3">
                                    <Search size={14} className=" text-[var(--very-dark-color)]/50" />
                                    <Input
                                        ref={searchInputRef}
                                        placeholder="Search..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                router.push(`/shop?search=${encodeURIComponent(search)}`);
                                            }
                                        }}
                                        className=" border-0 bg-transparent focus:ring-0 text-base h-8"
                                    />
                                </div>
                                {/* <Button variant="pale" onClick={() => setShowFilters(true)}> */}
                                <button
                                    className="hover:opacity-100 opacity-50"
                                    onClick={() => setShowFilters(true)}
                                >
                                    <SlidersHorizontal size={20} />
                                </button>
                                {/* </Button> */}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                            <ThemeToggle />
                            <Link href="/login" className="border-l border-r px-6 border-[var(--very-dark-color)]/30 hover:opacity-80 hidden sm:block text-[var(--very-dark-color)]">
                                <span className="block text-base opacity-50">Hello, sign in</span>
                                <span className="font-bold ">Account</span>
                            </Link>
                            <Link href="/shop/cart" className="flex items-center gap-1 hover:opacity-80" onClick={(e) => { e.preventDefault(); setShowCart(true); }}>
                                <div className="relative">
                                    <ShoppingCart className="text-[var(--very-dark-color)]" size={24} />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-white text-base font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="py-4 px-4 relative bg-[url(https://images.pexels.com/photos/5808/food-healthy-vegetables-village.jpg)] bg-center bg-cover min-h-[20vh] leading-relaxed">

                {/* overlay  */}
                <div className="absolute bg-black/50 backdrop-blur-lg h-full w-full left-0 top-0"></div>

                <div className="max-w-7xl mx-auto absolute text-white top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] leading-relaxed">
                    <div className="text-center leading-relaxed">
                        <h1 className="text-2xl font-semibold mb-3 leading-relaxed tracking-tight">Native Tree Seeds & Seedlings</h1>
                        <p className="text-base max-w-2xl mx-auto opacity-60 leading-relaxed tracking-wide">
                            Shop directly from verified nurseries across Uganda.
                            All products come with verified provenance and quality guarantees.
                        </p>
                    </div>
                </div>

            </div>

            {/* Filter Sidebar */}
            <AnimatePresence>
                {showFilters && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/40 z-40"
                            onClick={() => setShowFilters(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full min-w-[30vw] bg-[var(--card)] shadow-lg z-60 p-8 flex flex-col"
                        >
                            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
                                <h3 className="text-base">Filters</h3>
                                <Button variant="pale" size="icon-sm" onClick={() => setShowFilters(false)}>
                                    <X size={16} />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                <div>
                                    <h4 className="text-base font-medium mb-3">Status</h4>
                                    <div className="space-y-2">
                                        {['In Nursery', 'Approved', 'Distributed'].map((status) => (
                                            <label key={status} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--pale)] p-2 rounded-md transition-colors">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        value={status.replace(' ', '_').toLowerCase()}
                                                        checked={tempTypes.includes(status.replace(' ', '_').toLowerCase())}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setTempTypes(prev => [...prev, status.replace(' ', '_').toLowerCase()]);
                                                            } else {
                                                                setTempTypes(prev => prev.filter(t => t !== status.replace(' ', '_').toLowerCase()));
                                                            }
                                                        }}
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded transition-colors ${tempTypes.includes(status.replace(' ', '_').toLowerCase())
                                                        ? 'bg-primary border-primary'
                                                        : 'border-[var(--border)] bg-[var(--card)]'
                                                        }`}>
                                                        {tempTypes.includes(status.replace(' ', '_').toLowerCase()) && (
                                                            <Check size={14} className="text-white absolute top-0.5 left-0.5" />
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-base">{status}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-base font-medium mb-3">Region</h4>
                                    <div className="space-y-2">
                                        {['West Nile', 'Northern', 'Central', 'Eastern', 'Western'].map((region) => (
                                            <label key={region} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--pale)] p-2 rounded-md transition-colors">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        value={region}
                                                        checked={tempRegions.includes(region)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setTempRegions(prev => [...prev, region]);
                                                            } else {
                                                                setTempRegions(prev => prev.filter(r => r !== region));
                                                            }
                                                        }}
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded transition-colors ${tempRegions.includes(region)
                                                        ? 'bg-primary border-primary'
                                                        : 'border-[var(--border)] bg-[var(--card)]'
                                                        }`}>
                                                        {tempRegions.includes(region) && (
                                                            <Check size={14} className="text-white absolute top-0.5 left-0.5" />
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-base">{region}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-base font-medium mb-2">Price Range (UGX)</h4>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Min"
                                            className="text-base"
                                            type="number"
                                            value={tempPriceRange.min}
                                            onChange={(e) => setTempPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                        />
                                        <Input
                                            placeholder="Max"
                                            className="text-base"
                                            type="number"
                                            value={tempPriceRange.max}
                                            onChange={(e) => setTempPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-base font-medium mb-3">Unit Type</h4>
                                    <div className="space-y-2">
                                        {['Count', 'Kilograms', 'Grams'].map((unit) => (
                                            <label key={unit} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--pale)] p-2 rounded-md transition-colors">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        value={unit.toLowerCase()}
                                                        checked={tempTypes.includes(unit.toLowerCase())}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setTempTypes(prev => [...prev, unit.toLowerCase()]);
                                                            } else {
                                                                setTempTypes(prev => prev.filter(t => t !== unit.toLowerCase()));
                                                            }
                                                        }}
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded transition-colors ${tempTypes.includes(unit.toLowerCase())
                                                        ? 'bg-primary border-primary'
                                                        : 'border-[var(--border)] bg-[var(--card)]'
                                                        }`}>
                                                        {tempTypes.includes(unit.toLowerCase()) && (
                                                            <Check size={14} className="text-white absolute top-0.5 left-0.5" />
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-base">{unit}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-base font-medium mb-3">Quality</h4>
                                    <div className="space-y-2">
                                        {['High Germination (>80%)', 'Medium Germination (50-80%)', 'Low Germination (<50%)'].map((quality) => (
                                            <label key={quality} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--pale)] p-2 rounded-md transition-colors">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        value={quality.toLowerCase().replace(/[^a-z0-9]/g, '_')}
                                                        checked={tempTypes.includes(quality.toLowerCase().replace(/[^a-z0-9]/g, '_'))}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setTempTypes(prev => [...prev, quality.toLowerCase().replace(/[^a-z0-9]/g, '_')]);
                                                            } else {
                                                                setTempTypes(prev => prev.filter(t => t !== quality.toLowerCase().replace(/[^a-z0-9]/g, '_')));
                                                            }
                                                        }}
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded transition-colors ${tempTypes.includes(quality.toLowerCase().replace(/[^a-z0-9]/g, '_'))
                                                        ? 'bg-primary border-primary'
                                                        : 'border-[var(--border)] bg-[var(--card)]'
                                                        }`}>
                                                        {tempTypes.includes(quality.toLowerCase().replace(/[^a-z0-9]/g, '_')) && (
                                                            <Check size={14} className="text-white absolute top-0.5 left-0.5" />
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-base">{quality}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-[var(--border)]">
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={clearFilters}>Clear</Button>
                                    <Button
                                        className="flex-1 bg-primary"
                                        onClick={applyFilters}
                                        disabled={filtersLoading}
                                    >
                                        {filtersLoading ? (
                                            <>
                                                <Loader2 size={16} className="mr-2 animate-spin" />
                                                Applying...
                                            </>
                                        ) : (
                                            'Apply'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Search Loading Skeletons */}
            {searchLoading && (
                <main className="max-w-[85vw] mx-auto px-4 py-6 leading-relaxed">
                    <div className="flex items-center justify-between mb-6 leading-relaxed">
                        <span className="text-base text-[var(--very-dark-color)]/60 leading-relaxed">Searching...</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-6 justify-between items-start">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-pale rounded-lg overflow-hidden animate-pulse">
                                <div className="aspect-square bg-pale/50"></div>
                                <div className="p-6 space-y-3">
                                    <div className="h-4 bg-pale rounded"></div>
                                    <div className="h-3 bg-pale rounded w-3/4"></div>
                                    <div className="h-3 bg-pale rounded w-1/2"></div>
                                    <div className="h-4 bg-pale rounded w-1/3"></div>
                                    <div className="h-10 bg-pale rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            )}

            {/* Filters Loading Skeletons */}
            {filtersLoading && (
                <main className="max-w-[85vw] mx-auto px-4 py-6 leading-relaxed">
                    <div className="flex items-center justify-between mb-6 leading-relaxed">
                        <span className="text-base text-[var(--very-dark-color)]/60 leading-relaxed">Applying filters...</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-6 justify-between items-start">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-pale rounded-lg overflow-hidden animate-pulse">
                                <div className="aspect-square bg-pale/50"></div>
                                <div className="p-6 space-y-3">
                                    <div className="h-4 bg-pale rounded"></div>
                                    <div className="h-3 bg-pale rounded w-3/4"></div>
                                    <div className="h-3 bg-pale rounded w-1/2"></div>
                                    <div className="h-4 bg-pale rounded w-1/3"></div>
                                    <div className="h-10 bg-pale rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            )}

            {/* Products Grid - 3 columns on lg */}
            {!searchLoading && !loading && !filtersLoading && (
                <main className="max-w-[85vw] mx-auto px-4 py-6 leading-relaxed">
                    <div className="flex items-center justify-between mb-6 leading-relaxed">
                        {/* <h2 className="text-base">{search ? `Results for "${search}"` : "All Seeds & Seedlings"}</h2> */}
                        <span className="text-base text-[var(--very-dark-color)]/60 leading-relaxed">
                            {searchLoading ? "Searching..." : `${totalProducts} products`}
                        </span>
                    </div>

                    {/* Search loading skeleton */}
                    {searchLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-6 justify-between items-start">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-pale rounded-lg overflow-hidden animate-pulse">
                                    <div className="aspect-square bg-pale/50"></div>
                                    <div className="p-6 space-y-3">
                                        <div className="h-4 bg-pale rounded"></div>
                                        <div className="h-3 bg-pale rounded w-3/4"></div>
                                        <div className="h-3 bg-pale rounded w-1/2"></div>
                                        <div className="h-4 bg-pale rounded w-1/3"></div>
                                        <div className="h-10 bg-pale rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-6 justify-between items-start">
                            {products.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <Card
                                        className="group hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col bg-[var(--card)] rounded-sm leading-relaxed cursor-pointer"
                                        onClick={() => handleProductClick(product)}
                                    >
                                        {/* Image with icon placeholder */}
                                        <div className="relative aspect-square max-h-[30vh] bg-pale overflow-hidden flex items-center justify-center">
                                            {product.photoUrl ? (
                                                <img
                                                    src={product.photoUrl}
                                                    alt={product.species}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : null}
                                            {/* Image icon as fallback/placeholder - always visible */}
                                            <div className={`absolute inset-0 flex items-center justify-center ${product.photoUrl ? 'hidden group-hover:flex' : ''}`}>
                                                <Image size={48} className="text-[var(--very-dark-color)]/30" />
                                            </div>
                                            {product.status === "in_nursery" && (
                                                <div className="bg-white/20 backdrop-blur-lg text-white absolute top-5 left-5 px-3 rounded-[100px] py-1">
                                                    in stock
                                                </div>
                                                // <Badge className="absolute top-2 rounded-full left-2 bg-primary  text-base">
                                                //     In Stock
                                                // </Badge>
                                            )}
                                        </div>

                                        <CardContent className="p-6 flex-1 flex flex-col space-y-3">
                                            <h3 className="text-2xl font-medium line-clamp-2  leading-relaxed">
                                                {product.commonName || product.species}
                                            </h3>
                                            {product.commonName && (
                                                <p className="text-base   truncate leading-relaxed">{product.species}</p>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="mt-2 flex items-center gap-1 text-base text-[var(--very-dark-color)]/60 leading-relaxed">
                                                    <MapPin size={10} />
                                                    <span className="truncate underline">{product.nurseryLocation || product.region}</span>
                                                </div>

                                                <div className="mt-1 text-base text-[var(--very-dark-color)]/60 leading-relaxed">
                                                    {Number(product.quantity).toFixed(2)} {product.unit}
                                                </div>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between pt-3 space-y-2">
                                                <div>
                                                    <p className="text-base font-semibold text-primary">{formatCurrency(Number(product.pricePerUnit), 'UGX')} / {product.unit}</p>
                                                    {/* <p className="text-base text-[var(--very-dark-color)]/50 leading-relaxed">per {product.unit}</p> */}
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        // variant="outline"
                                                        size="icon-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const currentQty = cartItems[product.id] || 0;
                                                            if (currentQty > 0) {
                                                                updateCartQuantity(product.id, currentQty - 1);
                                                            }
                                                        }}
                                                        disabled={!cartItems[product.id]}
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="w-12 text-center text-base">
                                                        {cartItems[product.id] || 0}
                                                    </span>
                                                    <Button
                                                        // variant="outline"
                                                        size="icon-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddToCart(product);
                                                        }}
                                                    >
                                                        +
                                                    </Button>
                                                </div>

                                            </div>
                                            {/* Cart Actions */}
                                            <div className="relative">
                                                {cartItems[product.id] ? (
                                                    // Item in cart - show quantity controls and remove button
                                                    <div className="flex gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            // size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddToCart(product);
                                                            }}
                                                            className="flex-1 bg-pale hover:bg-[var(--border)] text-[var(--very-dark-color)]"
                                                        >
                                                            <ShoppingCart size={14} className="mr-1.5" />
                                                            Update
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            // size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateCartQuantity(product.id, 0);
                                                            }}
                                                            className="flex-1 bg-pale hover:bg-[var(--border)] text-[var(--very-dark-color)]"
                                                        >
                                                            <Trash2 size={14} className="mr-1.5" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    // Item not in cart - show Add to Cart button
                                                    <Button
                                                        variant="pale"
                                                        className="w-full text-base transition-all duration-200 hover:bg-primary hover:text-[var(--primary-foreground)]"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddToCart(product);
                                                        }}
                                                    >
                                                        <ShoppingCart size={14} className="mr-1.5" />
                                                        Add to Cart
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls - Show for debugging */}
                    {totalProducts > 0 && (
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-[var(--very-dark-color)]/60">
                                Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className="w-8 h-8 p-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </div>


                        </div>
                    )}

                    {Object.keys(cartItems).length === 0 && (
                        <div className="text-center py-24 leading-relaxed">
                            <Package size={64} className="mx-auto text-[var(--very-dark-color)]/20 mb-4" />
                            <h3 className="text-base mb-3 leading-relaxed">Your cart is empty</h3>
                            <p className="text-base text-[var(--very-dark-color)]/60 leading-relaxed">Try adjusting your search or filters</p>
                            {/* <Button onClick={() => { setShowCart(false) }}>
                Browse Shop
              </Button> */}
                        </div>
                    )}
                </main>
            )}

            {/* Footer */}
            <footer className="bg-[var(--card)] border-t border-[var(--border)] py-12 mt-auto leading-relaxed">
                <div className="max-w-[85vw] mx-auto px-4 leading-relaxed">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 leading-relaxed">
                        <div className="flex items-center gap-3">
                            {/* <TreeDeciduous className="text-primary" size={24} /> */}
                            <span className="text-base font-semibold text-[var(--very-dark-color)]">Ensigo Trace</span>
                        </div>
                        <p className="text-base text-[var(--very-dark-color)]/60 leading-relaxed">
                            All rights reserved to bvr.africa © 2025
                        </p>
                    </div>
                </div>
            </footer>

            {/* Cart Modal */}
            <CartModal
                isOpen={showCart}
                onClose={() => setShowCart(false)}
                cartItems={cartItems}
                products={products}
                onUpdateQuantity={updateCartQuantity}
            />

            {/* Product Details Modal */}
            <AnimatePresence>
                {showProductDetails && selectedProduct && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/40 z-40"
                            onClick={() => setShowProductDetails(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full min-w-[40vw] bg-paper shadow-lg z-60 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                                <h2 className="text-xl font-semibold text-[var(--very-dark-color)]">Product Details</h2>
                                <Button variant="ghost" size="icon-sm" onClick={() => setShowProductDetails(false)}>
                                    <X size={20} />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Product Image */}
                                <div className="relative aspect-video bg-pale overflow-hidden">
                                    {selectedProduct.photoUrl ? (
                                        <img
                                            src={selectedProduct.photoUrl}
                                            alt={selectedProduct.species}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : null}
                                    {!selectedProduct.photoUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Image size={64} className="text-[var(--very-dark-color)]/30" />
                                        </div>
                                    )}
                                    {selectedProduct.status === "in_nursery" && (
                                        <div className="bg-white/20 backdrop-blur-lg text-white absolute top-4 left-4 px-3 rounded-full py-1">
                                            In Stock
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Product Info */}
                                    <div>
                                        <h1 className="text-2xl font-bold text-[var(--very-dark-color)] mb-2">
                                            {selectedProduct.commonName || selectedProduct.species}
                                        </h1>
                                        {selectedProduct.commonName && (
                                            <p className="text-lg text-[var(--very-dark-color)]/60 italic mb-4">
                                                {selectedProduct.species}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-[var(--very-dark-color)]/60">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} />
                                                <span>{selectedProduct.nurseryLocation || selectedProduct.region}</span>
                                            </div>
                                            <span>•</span>
                                            <span>Batch: {selectedProduct.batchNumber}</span>
                                        </div>
                                    </div>

                                    {/* Price and Quantity */}
                                    <div className="border-t border-[var(--border)] pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-2xl font-bold text-primary">
                                                    {formatCurrency(Number(selectedProduct.pricePerUnit), 'UGX')}
                                                </p>
                                                <p className="text-sm text-[var(--very-dark-color)]/60">per {selectedProduct.unit}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-[var(--very-dark-color)]/60">Available</p>
                                                <p className="text-lg font-semibold">
                                                    {Number(selectedProduct.quantity).toFixed(2)} {selectedProduct.unit}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-[var(--very-dark-color)]">Quantity:</span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    onClick={() => {
                                                        const currentQty = cartItems[selectedProduct.id] || 0;
                                                        if (currentQty > 0) {
                                                            updateCartQuantity(selectedProduct.id, currentQty - 1);
                                                        }
                                                    }}
                                                    disabled={!cartItems[selectedProduct.id]}
                                                >
                                                    -
                                                </Button>
                                                <span className="w-12 text-center font-medium">
                                                    {cartItems[selectedProduct.id] || 0}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    onClick={() => handleAddToCart(selectedProduct)}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seller Information */}
                                    <div className="border-t border-[var(--border)] pt-6">
                                        <h3 className="text-lg font-semibold text-[var(--very-dark-color)] mb-4">Seller Information</h3>
                                        <div className="bg-pale rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-[var(--very-dark-color)]/60">Nursery</span>
                                                <span className="font-medium">{selectedProduct.nurseryName}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-[var(--very-dark-color)]/60">Location</span>
                                                <span className="font-medium">{selectedProduct.nurseryLocation || selectedProduct.region}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-[var(--very-dark-color)]/60">Region</span>
                                                <span className="font-medium">{selectedProduct.region}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-[var(--very-dark-color)]/60">Status</span>
                                                <span className="font-medium text-green-600">{selectedProduct.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <div className="border-t border-[var(--border)] pt-6">
                                        {cartItems[selectedProduct.id] ? (
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() => handleAddToCart(selectedProduct)}
                                                >
                                                    <ShoppingCart size={16} className="mr-2" />
                                                    Update Cart
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 text-destructive hover:text-destructive"
                                                    onClick={() => updateCartQuantity(selectedProduct.id, 0)}
                                                >
                                                    <Trash2 size={16} className="mr-2" />
                                                    Remove
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                className="w-full text-base"
                                                size="lg"
                                                onClick={() => handleAddToCart(selectedProduct)}
                                            >
                                                <ShoppingCart size={16} className="mr-2" />
                                                Add to Cart
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}