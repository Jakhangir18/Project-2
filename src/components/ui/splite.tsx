import { Suspense, lazy, memo } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
    scene: string
    className?: string
    id?: string
}

export const SplineScene = memo(function SplineScene({ scene, className, id }: SplineSceneProps) {
    return (
        <Suspense
            fallback={
                <div className="w-full h-full flex items-center justify-center">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
                </div>
            }
        >
            <div id={id} className={className} style={{ willChange: 'transform' }}>
                <Spline scene={scene} style={{ width: '100%', height: '100%' }} />
            </div>
        </Suspense>
    )
});
