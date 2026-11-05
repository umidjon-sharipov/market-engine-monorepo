'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const ProductsWrapper = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname()

    const lan = pathname.split('/')[1]
    const path = pathname.split('/')[2]
    return (
        <div className='mt-14'>
            <header className="flex items-center justify-between mb-8 font-semibold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest max-[500px]:text-[8px]">
                <Link className="hover:text-white hover:underline duration-200" href="/">dashboard</Link>
                <Link className="hover:text-white hover:underline duration-200" href={`/${lan}/${path}/get`}>get</Link>
                <Link className="hover:text-white hover:underline duration-200" href={`/${lan}/${path}/post`}>post</Link>
                <Link className="hover:text-white hover:underline duration-200" href={`/${lan}/${path}/put`}>put</Link>
                <Link className="hover:text-white hover:underline duration-200" href={`/${lan}/${path}/patch`}>patch</Link>
                <Link className="hover:text-white hover:underline duration-200" href={`/${lan}/${path}/delete`}>delete</Link>
                <Link href="/settings">
                    <Image src="/setting.png" alt="Settings" width={25} height={25} />
                </Link>
            </header>
            {children}
        </div>
    )
}

export default ProductsWrapper