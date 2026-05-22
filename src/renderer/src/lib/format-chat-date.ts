export function formatChatDate(
    input: Date | string | number,
    locale: string = 'en'
): string {
    const date = new Date(input)
    const now = new Date()

    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 24) {
        const hours = Math.floor(diffHours)
        if (hours <= 0) return 'Just now'
        return `${hours}h`
    }

    const yesterday = new Date()
    yesterday.setDate(now.getDate() - 1)

    if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    ) {
        return 'Yesterday'
    }

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())

    if (date >= startOfWeek) {
        return date.toLocaleDateString(locale, { weekday: 'long' })
    }

    return date.toLocaleDateString(locale)
}
