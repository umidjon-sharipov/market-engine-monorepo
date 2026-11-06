import React, { Suspense } from 'react'
import AuthC from 'app/features/app/auth/page'

const Auth = () => {
    return (
        <Suspense fallback={null}>
            <AuthC />
        </Suspense>
    )
}

export default Auth