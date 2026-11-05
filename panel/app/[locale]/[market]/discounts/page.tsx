'use client'

import GlassButton from '@/components/admin/GlassButton'
import GlassCard from '@/components/admin/GlassCard'
import GlassInput from '@/components/admin/GlassInput'
import React, { useState } from 'react'

const Discounts = () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <section className='max-w-[1400px] mx-auto'>
            <GlassCard className='flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 w-full p-4'>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <h1 className='text-2xl font-bold'>Discounts</h1>
                    <select
                        // value={roleFilter}
                        // onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none backdrop-blur-md"
                    >
                        <option value="all" className="bg-neutral-900">All discounts</option>
                        <option value="New discounts" className="bg-neutral-900">New discounts</option>
                    </select>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="relative flex items-center flex-1 sm:flex-initial">
                        <GlassInput
                            type="text"
                            placeholder="Search..."
                            // value={searchTerm}
                            // onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-48 sm:focus:w-72 transition-all duration-300 text-xs py-2"
                        />
                    </div>
                    <GlassButton onClick={() => setIsOpen(true)} className="whitespace-nowrap">
                        Create Discount
                    </GlassButton>
                </div>
            </GlassCard>
        </section>
    )
}

export default Discounts