import React from 'react'
import { OAUTH_ICON_DATA, type OAuthIconShape, type ProviderId } from './OAuthIconData'

export { OAUTH_PROVIDERS } from './OAuthIconData'
export type { ProviderId } from './OAuthIconData'

function renderShape(shape: OAuthIconShape, index: number) {
    if (shape.type === 'path') return <path key={index} d={shape.d} fill={shape.fill} />
    if (shape.type === 'circle') return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} />
    return <rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} fill={shape.fill} />
}

export function OAuthBrandIcon({ id, size = 22 }: { id: ProviderId; size?: number }) {
    const icon = OAUTH_ICON_DATA[id]

    return (
        <svg width={size} height={size} viewBox={icon.viewBox} aria-hidden="true" focusable="false" className="shrink-0">
            {icon.shapes.map(renderShape)}
        </svg>
    )
}
