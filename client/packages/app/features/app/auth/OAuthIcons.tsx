import React from 'react'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { OAUTH_ICON_DATA, type OAuthIconShape, type ProviderId } from './OAuthIconData'

export { OAUTH_PROVIDERS } from './OAuthIconData'
export type { ProviderId } from './OAuthIconData'

function renderShape(shape: OAuthIconShape, index: number) {
    if (shape.type === 'path') return <Path key={index} d={shape.d} fill={shape.fill} />
    if (shape.type === 'circle') return <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} />
    return <Rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} fill={shape.fill} />
}

export function OAuthBrandIcon({ id, size = 22 }: { id: ProviderId; size?: number }) {
    const icon = OAUTH_ICON_DATA[id]

    return (
        <Svg width={size} height={size} viewBox={icon.viewBox} accessible={false}>
            {icon.shapes.map(renderShape)}
        </Svg>
    )
}
