import React, { Suspense } from 'react'
import AuthC from 'app/features/app/auth/page'

export default function LocalizedAuthPage() {
    return (
        <Suspense fallback={null}>
            <AuthC />
        </Suspense>
    )
}
