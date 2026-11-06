export type ProviderId =
    | 'google'
    | 'github'
    | 'facebook'
    | 'telegram'
    | 'linkedin'
    | 'microsoft'
    | 'notion'
    | 'apple'
    | 'atlassian'

export type OAuthIconShape =
    | { type: 'path'; d: string; fill: string }
    | { type: 'circle'; cx: number; cy: number; r: number; fill: string }
    | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number; fill: string }

export const OAUTH_PROVIDERS: Array<{ id: ProviderId; label: string }> = [
    { id: 'google', label: 'Google' },
    { id: 'github', label: 'GitHub' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'telegram', label: 'Telegram' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'microsoft', label: 'Microsoft' },
    { id: 'notion', label: 'Notion' },
    { id: 'apple', label: 'Apple' },
    { id: 'atlassian', label: 'Atlassian' },
]

export const OAUTH_ICON_DATA: Record<ProviderId, { viewBox: string; shapes: OAuthIconShape[] }> = {
    google: {
        viewBox: '0 0 48 48',
        shapes: [
            { type: 'path', fill: '#4285F4', d: 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.45 5.78c4.35-4.02 7.31-9.94 7.31-17.43z' },
            { type: 'path', fill: '#34A853', d: 'M24 48c6.48 0 11.92-2.15 15.89-5.82l-7.45-5.78c-2.07 1.39-4.72 2.22-8.44 2.22-6.48 0-11.97-4.37-13.93-10.25l-7.7 5.95C6.33 42.53 14.5 48 24 48z' },
            { type: 'path', fill: '#FBBC05', d: 'M10.07 28.37A14.4 14.4 0 0 1 9.3 24c0-1.52.26-2.99.73-4.37l-7.7-5.95A23.9 23.9 0 0 0 0 24c0 3.86.92 7.52 2.56 10.32l7.51-5.95z' },
            { type: 'path', fill: '#EA4335', d: 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.5 0 6.33 5.47 2.33 13.68l7.7 5.95C11.99 13.75 17.48 9.5 24 9.5z' },
        ],
    },
    github: {
        viewBox: '0 0 24 24',
        shapes: [
            { type: 'path', fill: '#181717', d: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.334-5.466-5.93 0-1.31.467-2.38 1.235-3.22-.135-.303-.535-1.523.117-3.176 0 0 1.005-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.292-1.552 3.296-1.23 3.296-1.23.653 1.653.253 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.604-.015 2.896-.015 3.286 0 .322.216.694.825.576A11.1 11.1 0 0 0 12 .297z' },
        ],
    },
    facebook: {
        viewBox: '0 0 24 24',
        shapes: [
            { type: 'path', fill: '#1877F2', d: 'M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7v3h2.8v8h3.7z' },
        ],
    },
    telegram: {
        viewBox: '0 0 24 24',
        shapes: [
            { type: 'circle', cx: 12, cy: 12, r: 12, fill: '#26A5E4' },
            { type: 'path', fill: '#FFFFFF', d: 'm5.1 11.5 13.2-5.1c.6-.2 1.1.1.9.9l-2.2 10.4c-.2.7-.6.9-1.2.5l-3.4-2.5-1.6 1.6c-.2.2-.4.4-.8.4l.2-3.5 6.4-5.8c.3-.3-.1-.4-.5-.2l-7.9 5-3.4-1.1c-.7-.2-.7-.6.3-.9z' },
        ],
    },
    linkedin: {
        viewBox: '0 0 24 24',
        shapes: [
            { type: 'rect', x: 0, y: 0, width: 24, height: 24, rx: 3, fill: '#0A66C2' },
            { type: 'path', fill: '#FFFFFF', d: 'M6.5 9.1a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM5 10.5h3v9H5zM10 10.5h2.9v1.2h.1c.4-.7 1.3-1.5 2.8-1.5 3 0 3.6 2 3.6 4.5v4.8h-3v-4.3c0-1 0-2.4-1.5-2.4s-1.8 1.1-1.8 2.3v4.4h-3v-9z' },
        ],
    },
    microsoft: {
        viewBox: '0 0 24 24',
        shapes: [
            { type: 'path', fill: '#F25022', d: 'M1 1h10v10H1z' },
            { type: 'path', fill: '#7FBA00', d: 'M13 1h10v10H13z' },
            { type: 'path', fill: '#00A4EF', d: 'M1 13h10v10H1z' },
            { type: 'path', fill: '#FFB900', d: 'M13 13h10v10H13z' },
        ],
    },
    notion: {
        viewBox: '0 0 24 24',
        shapes: [
            { type: 'rect', x: 2, y: 2, width: 20, height: 20, rx: 2, fill: '#111111' },
            { type: 'path', fill: '#FFFFFF', d: 'M7 18V6h2.3l5.5 7.2V6H17v12h-2.2l-5.6-7.4V18z' },
        ],
    },
    apple: {
        viewBox: '0 0 512 512',
        shapes: [
            { type: 'path', fill: '#111111', d: 'M318.7 268.7c-.2-36.7 30-54.3 31.4-55.2-17.1-25-43.7-28.4-53.1-28.8-22.6-2.3-44.1 13.3-55.6 13.3-11.6 0-29.5-13-48.5-12.7-24.9.4-47.9 14.5-60.4 36.8-25.7 44.6-6.6 110.6 18.5 146.8 12.3 17.7 26.9 37.6 46.1 36.9 18.5-.7 25.5-11.9 47.9-11.9 22.4 0 28.7 11.9 48.3 11.5 20-.4 32.7-18 44.9-35.8 14.1-20.6 19.9-40.6 20.2-41.6-.4-.2-38.8-14.9-39.2-59.3zM282.1 160.7c10.1-12.2 16.9-29.2 15-46.1-14.5.6-32 9.7-42.4 21.9-9.3 10.8-17.5 28.1-15.3 44.6 16.1.7 32.6-8.2 42.7-20.4z' },
        ],
    },
    atlassian: {
        viewBox: '0 0 24 24',
        shapes: [
            { type: 'path', fill: '#0052CC', d: 'M12 1.2c-.5 0-.9.3-1.1.8L2.1 20.5c-.2.5.1 1 .6 1h4.8c.5 0 .9-.3 1.1-.8l3.4-7.3 3.4 7.3c.2.5.6.8 1.1.8h4.8c.5 0 .8-.5.6-1L13.1 2c-.2-.5-.6-.8-1.1-.8z' },
            { type: 'path', fill: '#FFFFFF', d: 'm12 13.4 2.1 4.5H9.9z' },
        ],
    },
}
