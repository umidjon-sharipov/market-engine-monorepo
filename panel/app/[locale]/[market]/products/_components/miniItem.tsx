'use client'

import { useThemeStore } from '@/app/_store/useThemeStore'
import GlassInput from '@/components/admin/GlassInput'
import React, { useState, useEffect, useRef } from 'react'

const MiniItem = ({
    index,
    cIndex,
    setItemLenght,
    defaultKey = '',
    defaultValue,
}: {
    index: number
    cIndex: number
    setItemLenght: React.Dispatch<React.SetStateAction<number>>
    defaultKey?: string
    defaultValue?: number
}) => {
    const [title, setTitle] = useState(defaultKey)
    const [value, setValue] = useState<number | undefined>(defaultValue)

    const isFirstRun = useRef(true)
    const hasValue = useRef(false)

    const theme = useThemeStore(state => state.theme)
    const isSelected = false

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false
            return
        }

        const currentlyHasValue = title.trim() !== ''

        if (currentlyHasValue && !hasValue.current) {
            setItemLenght(prev => prev + 1)
            hasValue.current = true
        } else if (!currentlyHasValue && hasValue.current) {
            setItemLenght(prev => prev - 1)
            hasValue.current = false
        }
    }, [title, setItemLenght])

    return (
        <button
            type='button'
            className={`flex justify-between items-center text-xs font-medium p-2 gap-2 rounded-2xl border transition-all duration-200 ${isSelected
                ? "bg-sky-500/10 text-sky-500 border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.1)]"
                : theme === 'dark'
                    ? "bg-zinc-800/20 text-zinc-300 border-zinc-800 hover:bg-zinc-800/40 hover:border-zinc-700"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300"
                }`}
        >
            <GlassInput className='w-full' name={`title-${cIndex}-${index}`} onChange={(e) => setTitle(e.target.value)} value={title} placeholder='key' />
            <GlassInput className='w-full' name={`value-${cIndex}-${index}`} type='number' placeholder='value' onChange={(e: any) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) {
                    setValue(val === '' ? undefined : Number(val));
                }
            }} value={value} />
        </button>
    )
}

export default MiniItem